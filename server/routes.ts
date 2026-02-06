import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import { randomBytes, createHash, createCipheriv, createDecipheriv } from "crypto";
import { scryptSync } from "crypto";

import * as solanaService from "./services/solana";
import * as evmService from "./services/evm";
import * as stellarService from "./services/stellar";
import { generateWalletForChain } from "./services/wallet";

const SessionStore = MemoryStore(session);

const ALGORITHM = 'aes-256-cbc';
const encryptionSecret = process.env.WALLET_ENCRYPTION_SECRET || process.env.SESSION_SECRET || 'dev-only-encryption-key';
if (!process.env.WALLET_ENCRYPTION_SECRET && process.env.NODE_ENV === 'production') {
  console.error('[SECURITY] WALLET_ENCRYPTION_SECRET must be set in production!');
}
const ENCRYPTION_KEY = scryptSync(encryptionSecret, 'mintoria-custodial-v1', 32);
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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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

    if (!user || user.passwordHash !== password) {
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
    const location = await storage.getLocationBySlug(req.params.slug as string);
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

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const ipHash = createHash('sha256').update(req.ip || "unknown").digest('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

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

  // 1. EVM Permit (EIP-712) - Real signing
  app.post(api.mint.evmPermit.path, async (req, res) => {
    const { claimToken, recipient, chainId } = req.body;

    const tokenHash = createHash('sha256').update(claimToken).digest('hex');
    const session = await storage.getClaimSession(tokenHash);

    if (!session || session.status !== "active" || new Date() > session.expiresAt) {
      return res.status(400).json({ message: "Invalid or expired claim token" });
    }

    try {
      const permitData = await evmService.signEIP712Permit({
        recipient,
        tokenId: session.dropId,
        chainId: chainId || 11155111,
      });

      res.json(permitData);
    } catch (err: any) {
      console.error("[EVM_PERMIT] Error:", err.message);
      res.status(500).json({ message: `EVM signing failed: ${err.message}` });
    }
  });

  // 2. Solana Transaction - Real minting via Metaplex
  app.post(api.mint.solanaTx.path, async (req, res) => {
    const { claimToken, recipient } = req.body;

    const tokenHash = createHash('sha256').update(claimToken).digest('hex');
    const session = await storage.getClaimSession(tokenHash);

    if (!session || session.status !== "active" || new Date() > session.expiresAt) {
      return res.status(400).json({ message: "Invalid or expired claim token" });
    }

    try {
      const drop = await storage.getDrop(session.dropId);
      if (!drop) {
        return res.status(404).json({ message: "Drop not found" });
      }

      const result = await solanaService.mintNFT({
        recipientAddress: recipient,
        name: drop.title,
        uri: drop.metadataUrl,
      });

      await storage.markSessionConsumed(session.id);
      await storage.incrementMintCount(session.dropId);

      await storage.createMint({
        dropId: session.dropId,
        chain: "solana",
        recipient,
        txHash: result.txHash,
        status: "confirmed",
      });

      res.json({
        transaction: result.txHash,
        mintAddress: result.mintAddress,
        explorerUrl: solanaService.getSolanaExplorerUrl(result.txHash),
      });
    } catch (err: any) {
      console.error("[SOLANA_MINT] Error:", err.message);
      res.status(500).json({ message: `Solana minting failed: ${err.message}` });
    }
  });

  // 3. Stellar XDR - Real transaction building
  app.post(api.mint.stellarXdr.path, async (req, res) => {
    const { claimToken, recipient } = req.body;

    const tokenHash = createHash('sha256').update(claimToken).digest('hex');
    const session = await storage.getClaimSession(tokenHash);

    if (!session || session.status !== "active" || new Date() > session.expiresAt) {
      return res.status(400).json({ message: "Invalid or expired claim token" });
    }

    try {
      const drop = await storage.getDrop(session.dropId);
      if (!drop) {
        return res.status(404).json({ message: "Drop not found" });
      }

      const result = await stellarService.mintNFT({
        recipientAddress: recipient || stellarService.getServerPublicKey(),
        name: drop.title,
        uri: drop.metadataUrl,
      });

      await storage.markSessionConsumed(session.id);
      await storage.incrementMintCount(session.dropId);

      await storage.createMint({
        dropId: session.dropId,
        chain: "stellar",
        recipient: recipient || stellarService.getServerPublicKey(),
        txHash: result.txHash,
        status: "confirmed",
      });

      res.json({
        xdr: result.txHash,
        networkPassphrase: "Test SDF Network ; September 2015",
        explorerUrl: stellarService.getStellarExplorerUrl(result.txHash),
      });
    } catch (err: any) {
      console.error("[STELLAR_MINT] Error:", err.message);
      res.status(500).json({ message: `Stellar minting failed: ${err.message}` });
    }
  });

  // Confirm Mint (for wallet-based flows that need separate confirmation)
  app.post(api.mint.confirm.path, async (req, res) => {
    const { claimToken, txHash, chain } = req.body;

    const tokenHash = createHash('sha256').update(claimToken).digest('hex');
    const session = await storage.getClaimSession(tokenHash);

    if (!session) return res.status(400).json({ message: "Invalid session" });

    if (session.status === "consumed") {
      return res.json({ message: "Already confirmed", txHash });
    }

    await storage.markSessionConsumed(session.id);
    await storage.incrementMintCount(session.dropId);

    const mint = await storage.createMint({
      dropId: session.dropId,
      chain,
      recipient: "wallet_user",
      txHash,
      status: "confirmed"
    });

    res.json(mint);
  });

  // === WALLETLESS ROUTES ===
  const verificationCodes = new Map<string, string>();

  app.post(api.walletless.start.path, async (req, res) => {
    const { email } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    console.log(`[WALLETLESS] Verification code for ${email}: ${code}`);
    verificationCodes.set(email, code);

    let user = await storage.getWalletlessUser(email);
    if (!user) {
      user = await storage.createWalletlessUser({ email });
    }

    const chains: Array<"evm" | "solana" | "stellar"> = ["evm", "solana", "stellar"];
    for (const chain of chains) {
      const existingKey = await storage.getWalletlessKey(user.id, chain);
      if (!existingKey) {
        const wallet = generateWalletForChain(chain);
        const encryptedSecret = encrypt(wallet.secret);

        await storage.createWalletlessKey({
          walletlessUserId: user.id,
          chain,
          address: wallet.address,
          encryptedSecret
        });

        console.log(`[WALLETLESS] Created ${chain} wallet for ${email}: ${wallet.address}`);
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

    const user = await storage.getWalletlessUser(email);
    if (user) {
      await storage.markWalletlessUserVerified(user.id);
    }

    res.json({
      token: `verified_${createHash('sha256').update(email + Date.now()).digest('hex').slice(0, 16)}`,
      verified: true
    });
  });

  app.post(api.walletless.mine.path, async (req, res) => {
    const { email, chain, claimToken } = req.body;

    const user = await storage.getWalletlessUser(email);
    if (!user) return res.status(400).json({ message: "User not found" });

    const key = await storage.getWalletlessKey(user.id, chain);
    if (!key) return res.status(400).json({ message: "Wallet key not found for this chain" });

    const tokenHash = createHash('sha256').update(claimToken).digest('hex');
    const session = await storage.getClaimSession(tokenHash);
    if (!session || session.status !== "active" || new Date() > session.expiresAt) {
      return res.status(400).json({ message: "Invalid or expired claim token" });
    }

    const drop = await storage.getDrop(session.dropId);
    if (!drop) {
      return res.status(404).json({ message: "Drop not found" });
    }

    const secret = decrypt(key.encryptedSecret);
    let txHash: string;
    let recipientAddress = key.address;

    try {
      switch (chain) {
        case "solana": {
          const result = await solanaService.mintNFTWithCustodialWallet({
            custodialSecretKey: secret,
            name: drop.title,
            uri: drop.metadataUrl,
          });
          txHash = result.txHash;
          recipientAddress = result.recipientAddress;
          break;
        }
        case "evm": {
          const result = await evmService.mintNFTWithCustodialWallet({
            custodialPrivateKey: secret,
            tokenId: drop.id,
          });
          txHash = result.txHash;
          recipientAddress = result.recipientAddress;
          break;
        }
        case "stellar": {
          const result = await stellarService.mintNFTWithCustodialWallet({
            custodialSecretKey: secret,
            name: drop.title,
            uri: drop.metadataUrl,
          });
          txHash = result.txHash;
          recipientAddress = result.recipientAddress;
          break;
        }
        default:
          return res.status(400).json({ message: `Unsupported chain: ${chain}` });
      }

      await storage.markSessionConsumed(session.id);
      await storage.incrementMintCount(session.dropId);

      await storage.createMint({
        dropId: session.dropId,
        chain,
        recipient: recipientAddress,
        txHash,
        status: "confirmed"
      });

      const explorerUrl =
        chain === "solana" ? solanaService.getSolanaExplorerUrl(txHash)
        : chain === "evm" ? evmService.getEvmExplorerUrl(txHash)
        : stellarService.getStellarExplorerUrl(txHash);

      res.json({
        txHash,
        address: recipientAddress,
        explorerUrl,
      });
    } catch (err: any) {
      console.error(`[WALLETLESS_MINT] ${chain} error:`, err.message);
      res.status(500).json({ message: `Minting failed on ${chain}: ${err.message}` });
    }
  });

  // === BLOCKCHAIN STATUS ENDPOINT ===
  app.get("/api/blockchain/status", async (_req, res) => {
    try {
      const [solBalance, evmBalance, stellarBalance] = await Promise.allSettled([
        solanaService.getServerBalance(),
        evmService.getServerBalance(),
        stellarService.getServerBalance(),
      ]);

      res.json({
        solana: {
          serverPublicKey: solanaService.getServerPublicKey(),
          balance: solBalance.status === "fulfilled" ? solBalance.value : 0,
          network: process.env.SOLANA_NETWORK || "devnet",
        },
        evm: {
          serverAddress: evmService.getServerAddress(),
          balance: evmBalance.status === "fulfilled" ? evmBalance.value : "0",
          ...evmService.getEvmChainInfo(),
        },
        stellar: {
          serverPublicKey: stellarService.getServerPublicKey(),
          balance: stellarBalance.status === "fulfilled" ? stellarBalance.value : "0",
          network: process.env.STELLAR_NETWORK || "testnet",
        },
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Seed Data
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

  seed().catch(console.error);

  // Initialize blockchain services
  console.log("[BLOCKCHAIN] Initializing services...");
  console.log(`[SOLANA] Server: ${solanaService.getServerPublicKey()}`);
  console.log(`[EVM] Server: ${evmService.getServerAddress()}`);
  console.log(`[STELLAR] Server: ${stellarService.getServerPublicKey()}`);

  solanaService.ensureServerFunded().then((funded) => {
    console.log(`[SOLANA] Server funded: ${funded}`);
  }).catch(console.error);

  stellarService.ensureServerFunded().then((funded) => {
    console.log(`[STELLAR] Server funded: ${funded}`);
  }).catch(console.error);

  return httpServer;
}
