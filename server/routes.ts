import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import { randomBytes, createHash, createCipheriv, createDecipheriv } from "crypto";
import { scryptSync } from "crypto";

const SessionStore = MemoryStore(session);

// --- Crypto Helpers for Walletless ---
const ALGORITHM = 'aes-256-cbc';
// For MVP, use a fixed key derived from a secret or default. In prod, use a real secret.
const ENCRYPTION_KEY = scryptSync('mvp-secret', 'salt', 32); 
const IV_LENGTH = 16;

function encrypt(text: string) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// --- Mock/Real Chain Helpers ---
// In a real app, these would import from 'viem', '@solana/web3.js', 'stellar-sdk'
// For the MVP *structure*, we'll scaffold the logic.
// We will need to ensure packages are installed for the real implementation.

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Session Setup
  app.use(session({
    cookie: { maxAge: 86400000 },
    store: new SessionStore({ checkPeriod: 86400000 }),
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || "dev_secret",
  }));

  // === AUTH ROUTES ===
  app.post(api.auth.login.path, async (req, res) => {
    const { email, password } = api.auth.login.input.parse(req.body);
    const user = await storage.getUserByEmail(email);
    
    // Simple password check (plaintext/hash comparison logic stubbed for MVP)
    // In prod, use bcrypt.compare(password, user.passwordHash)
    if (!user || user.passwordHash !== password) { 
      // For MVP dev convenience, if no admin exists, create one with password "admin"
      if (email === "admin@memories.xyz" && password === "admin") {
         let admin = await storage.getUserByEmail("admin@memories.xyz");
         if (!admin) {
           admin = await storage.createUser({
             email: "admin@memories.xyz",
             passwordHash: "admin",
             role: "admin"
           });
         }
         (req.session as any).userId = admin.id;
         return res.json({ message: "Logged in (Dev Admin)" });
      }
      return res.status(401).json({ message: "Invalid credentials" });
    }

    (req.session as any).userId = user.id;
    res.json({ message: "Logged in" });
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get(api.auth.me.path, async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    res.json(user);
  });

  // === PROJECT / LOCATION / DROP ROUTES ===
  app.get(api.projects.list.path, async (req, res) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  app.post(api.projects.create.path, async (req, res) => {
    const project = await storage.createProject(req.body);
    res.status(201).json(project);
  });

  app.get(api.locations.list.path, async (req, res) => {
    const locations = await storage.getLocations(Number(req.params.projectId));
    res.json(locations);
  });

  app.post(api.locations.create.path, async (req, res) => {
    const location = await storage.createLocation({
      ...req.body,
      projectId: Number(req.params.projectId)
    });
    res.status(201).json(location);
  });

  app.get(api.locations.getBySlug.path, async (req, res) => {
    const location = await storage.getLocationBySlug(req.params.slug);
    if (!location) return res.status(404).json({ message: "Location not found" });
    res.json(location);
  });

  app.get(api.drops.list.path, async (req, res) => {
    const drops = await storage.getDrops(Number(req.params.locationId));
    res.json(drops);
  });

  app.post(api.drops.create.path, async (req, res) => {
    const drop = await storage.createDrop({
      ...req.body,
      locationId: Number(req.params.locationId)
    });
    res.status(201).json(drop);
  });

  app.get(api.drops.getActive.path, async (req, res) => {
    const drop = await storage.getActiveDrop(Number(req.params.locationId));
    if (!drop) return res.status(404).json({ message: "No active drop found" });
    res.json(drop);
  });

  app.post(api.drops.publish.path, async (req, res) => {
    const drop = await storage.updateDropStatus(Number(req.params.id), "published");
    res.json(drop);
  });

  // === CLAIM SESSION ROUTES ===
  app.post(api.claims.createSession.path, async (req, res) => {
    const { locationId } = req.body;
    const drop = await storage.getActiveDrop(locationId);
    
    if (!drop) {
      return res.status(404).json({ message: "No active drop for this location" });
    }

    if (drop.supply > 0 && drop.mintedCount >= drop.supply) {
      return res.status(429).json({ message: "Drop supply exhausted" });
    }

    // Generate Token
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    
    // IP Hash (Mock for now, normally req.ip)
    const ipHash = createHash('sha256').update(req.ip || "unknown").digest('hex');

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await storage.createClaimSession({
      dropId: drop.id,
      tokenHash,
      ipHash,
      expiresAt,
      status: "active"
    });

    res.json({
      token,
      expiresAt: expiresAt.toISOString(),
      drop
    });
  });

  // === MINT ROUTES ===
  // 1. EVM Permit (EIP-712)
  app.post(api.mint.evmPermit.path, async (req, res) => {
    const { claimToken, recipient, chainId } = req.body;
    
    // Verify Token
    const tokenHash = createHash('sha256').update(claimToken).digest('hex');
    const session = await storage.getClaimSession(tokenHash);

    if (!session || session.status !== "active" || new Date() > session.expiresAt) {
      return res.status(400).json({ message: "Invalid or expired claim token" });
    }

    // Mock Signing Logic
    // In a real app, use 'viem' to signTypedData with process.env.EVM_BACKEND_SIGNER_PRIVATE_KEY
    const mockSignature = "0x" + randomBytes(65).toString('hex');
    const mockNonce = randomBytes(16).toString('hex');

    res.json({
      signature: mockSignature,
      nonce: mockNonce,
      deadline: Math.floor(Date.now() / 1000) + 3600,
      amount: 1
    });
  });

  // 2. Solana Transaction
  app.post(api.mint.solanaTx.path, async (req, res) => {
    const { claimToken } = req.body;
     // Verify Token
    const tokenHash = createHash('sha256').update(claimToken).digest('hex');
    const session = await storage.getClaimSession(tokenHash);

    if (!session || session.status !== "active" || new Date() > session.expiresAt) {
      return res.status(400).json({ message: "Invalid or expired claim token" });
    }

    // Mock Solana Tx (base64)
    // In real app, use Umi to create mint instruction, partially sign, serialize
    const mockTxBase64 = Buffer.from("mock_solana_transaction_data").toString('base64');

    res.json({ transaction: mockTxBase64 });
  });

  // 3. Stellar XDR
  app.post(api.mint.stellarXdr.path, async (req, res) => {
    const { claimToken } = req.body;
     // Verify Token
    const tokenHash = createHash('sha256').update(claimToken).digest('hex');
    const session = await storage.getClaimSession(tokenHash);

    if (!session || session.status !== "active" || new Date() > session.expiresAt) {
      return res.status(400).json({ message: "Invalid or expired claim token" });
    }

    // Mock Stellar XDR
    // In real app, use stellar-sdk to build invokeHostFunction op
    const mockXdr = "AAAA...MockXDRString..."; 

    res.json({ 
      xdr: mockXdr,
      networkPassphrase: "Test SDF Network ; September 2015" 
    });
  });

  // Confirm Mint
  app.post(api.mint.confirm.path, async (req, res) => {
    const { claimToken, txHash, chain } = req.body;
    
    const tokenHash = createHash('sha256').update(claimToken).digest('hex');
    const session = await storage.getClaimSession(tokenHash);

    if (!session) return res.status(400).json({ message: "Invalid session" });

    // Mark Consumed
    await storage.markSessionConsumed(session.id);
    
    // Increment Mint Count
    await storage.incrementMintCount(session.dropId);

    // Record Mint
    const mint = await storage.createMint({
      dropId: session.dropId,
      chain,
      recipient: "user_wallet", // In real app, extract from tx or session
      txHash,
      status: "confirmed"
    });

    res.json(mint);
  });

  // === WALLETLESS ROUTES ===
  const verificationCodes = new Map<string, string>(); // In-memory for MVP

  app.post(api.walletless.start.path, async (req, res) => {
    const { email } = req.body;
    // Generate 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log(`[WALLETLESS_DEV] Code for ${email}: ${code}`);
    verificationCodes.set(email, code);

    // Create walletless user if not exists
    let user = await storage.getWalletlessUser(email);
    if (!user) {
      user = await storage.createWalletlessUser({ email });
    }

    // Pre-generate keys for this user if they don't exist
    const chains = ["evm", "solana", "stellar"];
    for (const chain of chains) {
      const existingKey = await storage.getWalletlessKey(user.id, chain);
      if (!existingKey) {
        // Generate mock keypair
        const mockAddress = `mock_${chain}_address_${randomBytes(4).toString('hex')}`;
        const mockSecret = `secret_${randomBytes(8).toString('hex')}`;
        const encryptedSecret = encrypt(mockSecret);
        
        await storage.createWalletlessKey({
          walletlessUserId: user.id,
          chain,
          address: mockAddress,
          encryptedSecret
        });
      }
    }

    res.json({ message: "Verification code sent (check console)" });
  });

  app.post(api.walletless.verify.path, async (req, res) => {
    const { email, code } = req.body;
    
    if (verificationCodes.get(email) !== code) {
      return res.status(400).json({ message: "Invalid code", verified: false });
    }

    verificationCodes.delete(email);
    
    // In a real app, issue a JWT specifically for minting actions
    // For MVP, we return a success signal.
    
    res.json({ 
      token: "mock_walletless_session_token",
      verified: true 
    });
  });

  app.post(api.walletless.mine.path, async (req, res) => {
    const { email, chain, claimToken } = req.body;
    
    const user = await storage.getWalletlessUser(email);
    if (!user) return res.status(400).json({ message: "User not found" });

    const key = await storage.getWalletlessKey(user.id, chain);
    if (!key) return res.status(400).json({ message: "Key not found" });

    // Perform the minting logic (server-side signing)
    // 1. Verify claim token
    // 2. Decrypt secret: const secret = decrypt(key.encryptedSecret);
    // 3. Sign and submit tx to chain
    
    // Mock success
    const txHash = `0x${randomBytes(32).toString('hex')}`;

    // Call internal confirm logic
    const tokenHash = createHash('sha256').update(claimToken).digest('hex');
    const session = await storage.getClaimSession(tokenHash);
    if (session) {
      await storage.markSessionConsumed(session.id);
      await storage.incrementMintCount(session.dropId);
      await storage.createMint({
        dropId: session.dropId,
        chain,
        recipient: key.address,
        txHash,
        status: "confirmed"
      });
    }

    res.json({
      txHash,
      address: key.address
    });
  });

  // Seed Data function
  async function seed() {
    const projects = await storage.getProjects();
    if (projects.length === 0) {
      console.log("Seeding Database...");
      const project = await storage.createProject({ name: "Demo Project", slug: "demo" });
      const location = await storage.createLocation({ name: "Eiffel Tower", slug: "eiffel", projectId: project.id });
      await storage.createDrop({
        locationId: location.id,
        title: "Paris Visit 2026",
        month: "February",
        year: 2026,
        imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=1000",
        metadataUrl: "https://example.com/metadata.json",
        supply: 1000,
        enabledChains: ["evm", "solana", "stellar"],
        status: "published"
      });
      console.log("Seeding Complete.");
    }
  }

  // Run seed
  seed().catch(console.error);

  return httpServer;
}
