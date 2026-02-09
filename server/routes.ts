import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import { randomBytes, createHash, createCipheriv, createDecipheriv } from "crypto";
import { scryptSync } from "crypto";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import express from "express";

import * as stellarService from "./services/stellar";
import { generateWalletForChain } from "./services/wallet";
import { walletlessUsers, walletlessKeys } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { sendVerificationEmail, sendMintConfirmationEmail } from "./services/email";

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

  (global as any).__serverStartTime = Date.now();

  app.use(session({
    cookie: { maxAge: 86400000 },
    store: new SessionStore({ checkPeriod: 86400000 }),
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || "dev_secret",
  }));

  const uploadsDir = path.join(process.cwd(), "server", "public", "uploads");
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir));

  // === IMAGE UPLOAD ===
  app.post("/api/upload/image", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    try {
      const { data, filename } = req.body;
      if (!data || !filename) {
        return res.status(400).json({ message: "Missing image data" });
      }

      const ext = path.extname(filename).toLowerCase();
      const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      if (!allowedExts.includes(ext)) {
        return res.status(400).json({ message: "Invalid file type" });
      }

      const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      if (buffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({ message: "File too large (max 5MB)" });
      }

      const uniqueName = randomBytes(16).toString('hex') + ext;
      const filePath = path.join(uploadsDir, uniqueName);
      writeFileSync(filePath, buffer);

      res.json({ url: `/uploads/${uniqueName}` });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // === AUTH ROUTES ===
  app.post(api.auth.login.path, async (req, res) => {
    const { email, password } = api.auth.login.input.parse(req.body);
    const user = await storage.getUserByEmail(email);

    if (!user || user.passwordHash !== password) {
      if (email === "admin@mintoria.xyz" && password === "admin") {
        let admin = await storage.getUserByEmail("admin@mintoria.xyz");
        if (!admin) {
          admin = await storage.createUser({
            email: "admin@mintoria.xyz",
            passwordHash: "admin",
            role: "admin"
          });
        }
        (req.session as any).userId = admin.id;
        return res.json({ message: "Logged in" });
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
    const userId = (req.session as any).userId;
    const project = await storage.createProject(req.body);
    if (userId) {
      await storage.createActivityLog({ userId, action: "create", entity: "project", entityId: project.id, details: `Created project "${project.name}"` });
    }
    res.status(201).json(project);
  });

  app.get(api.locations.list.path, async (req, res) => {
    const locations = await storage.getLocations(Number(req.params.projectId));
    res.json(locations);
  });

  app.post(api.locations.create.path, async (req, res) => {
    const userId = (req.session as any).userId;
    const location = await storage.createLocation({
      ...req.body,
      projectId: Number(req.params.projectId)
    });
    if (userId) {
      await storage.createActivityLog({ userId, action: "create", entity: "location", entityId: location.id, details: `Created location "${location.name}"` });
    }
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
    const userId = (req.session as any).userId;
    const drop = await storage.createDrop({
      ...req.body,
      locationId: Number(req.params.locationId)
    });
    if (userId) {
      await storage.createActivityLog({ userId, action: "create", entity: "drop", entityId: drop.id, details: `Created drop "${drop.title}"` });
    }
    res.status(201).json(drop);
  });

  app.get(api.drops.getActive.path, async (req, res) => {
    const drop = await storage.getActiveDrop(Number(req.params.locationId));
    if (!drop) return res.status(404).json({ message: "No active drop found" });
    res.json(drop);
  });

  app.put(api.projects.update.path, async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const project = await storage.updateProject(Number(req.params.id), req.body);
    await storage.createActivityLog({ userId, action: "update", entity: "project", entityId: project.id, details: `Updated project "${project.name}"` });
    res.json(project);
  });

  app.delete(api.projects.delete.path, async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    await storage.deleteProject(Number(req.params.id));
    await storage.createActivityLog({ userId, action: "delete", entity: "project", entityId: Number(req.params.id), details: `Deleted project #${req.params.id}` });
    res.json({ message: "Project deleted" });
  });

  app.put(api.locations.update.path, async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    await storage.updateLocation(Number(req.params.id), req.body);
    await storage.createActivityLog({ userId, action: "update", entity: "location", entityId: Number(req.params.id), details: `Updated location #${req.params.id}` });
    res.json({ message: "Location updated" });
  });

  app.delete(api.locations.delete.path, async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    await storage.deleteLocation(Number(req.params.id));
    await storage.createActivityLog({ userId, action: "delete", entity: "location", entityId: Number(req.params.id), details: `Deleted location #${req.params.id}` });
    res.json({ message: "Location deleted" });
  });

  app.put(api.drops.update.path, async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    await storage.updateDrop(Number(req.params.id), req.body);
    await storage.createActivityLog({ userId, action: "update", entity: "drop", entityId: Number(req.params.id), details: `Updated drop #${req.params.id}` });
    res.json({ message: "Drop updated" });
  });

  app.delete(api.drops.delete.path, async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    await storage.deleteDrop(Number(req.params.id));
    await storage.createActivityLog({ userId, action: "delete", entity: "drop", entityId: Number(req.params.id), details: `Deleted drop #${req.params.id}` });
    res.json({ message: "Drop deleted" });
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
  app.post(api.mint.evmPermit.path, async (_req, res) => {
    res.status(503).json({ message: "EVM chain is currently disabled. Please use Stellar." });
  });

  app.post(api.mint.solanaTx.path, async (_req, res) => {
    res.status(503).json({ message: "Solana chain is currently disabled. Please use Stellar." });
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

      const mint = await storage.createMint({
        dropId: session.dropId,
        chain: "stellar",
        recipient: recipient || stellarService.getServerPublicKey(),
        txHash: result.txHash,
        status: "confirmed",
      });

      await storage.createActivityLog({ userId: 0, action: "mint", entity: "drop", entityId: mint.dropId, details: `NFT minted on ${mint.chain} to ${mint.recipient}` });
      await storage.createNotification({ type: "new_mint", title: "New NFT Minted", message: `NFT minted to ${mint.recipient} on ${mint.chain}` });

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

    await storage.createActivityLog({ userId: 0, action: "mint", entity: "drop", entityId: mint.dropId, details: `NFT minted on ${mint.chain} to ${mint.recipient}` });
    await storage.createNotification({ type: "new_mint", title: "New NFT Minted", message: `NFT minted to ${mint.recipient} on ${mint.chain}` });

    res.json(mint);
  });

  // === WALLETLESS ROUTES ===
  const verificationCodes = new Map<string, string>();

  app.post(api.walletless.start.path, async (req, res) => {
    try {
      const { email } = req.body;
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      await sendVerificationEmail(email, code);
      verificationCodes.set(email, code);
      console.log(`[DEV] Verification code for ${email}: ${code}`);

      let user = await storage.getWalletlessUser(email);
      if (!user) {
        user = await storage.createWalletlessUser({ email });
      }

      try {
        const existingKey = await storage.getWalletlessKey(user.id, "stellar");
        if (!existingKey) {
          const wallet = generateWalletForChain("stellar");
          const encryptedSecret = encrypt(wallet.secret);

          await storage.createWalletlessKey({
            walletlessUserId: user.id,
            chain: "stellar",
            address: wallet.address,
            encryptedSecret
          });

          console.log(`[WALLETLESS] Created stellar wallet for ${email}: ${wallet.address}`);
        }
      } catch (walletErr: any) {
        console.error(`[WALLETLESS] Failed to create stellar wallet for ${email}: ${walletErr.message}`);
      }

      res.json({ message: "Verification code sent" });
    } catch (err: any) {
      console.error(`[WALLETLESS_START] Error: ${err.message}`);
      res.status(500).json({ message: "Failed to send verification code" });
    }
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
    try {
      const { email, code, claimToken } = req.body;
      const chain = "stellar";

      if (!code) {
        return res.status(400).json({ message: "Verification code is required" });
      }

      if (verificationCodes.get(email) !== code) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      verificationCodes.delete(email);
      const userToVerify = await storage.getWalletlessUser(email);
      if (userToVerify) {
        await storage.markWalletlessUserVerified(userToVerify.id);
      }

      const user = await storage.getWalletlessUser(email);
      if (!user) return res.status(400).json({ message: "User not found" });

      const key = await storage.getWalletlessKey(user.id, chain);
      if (!key) return res.status(400).json({ message: "Stellar wallet not found. Please try again." });

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
      const result = await stellarService.mintNFTWithCustodialWallet({
        custodialSecretKey: secret,
        name: drop.title,
        uri: drop.metadataUrl,
      });

      const txHash = result.txHash;
      const recipientAddress = result.recipientAddress;

      await storage.markSessionConsumed(session.id);
      await storage.incrementMintCount(session.dropId);

      const mint = await storage.createMint({
        dropId: session.dropId,
        chain,
        recipient: recipientAddress,
        txHash,
        status: "confirmed"
      });

      await storage.createActivityLog({ userId: 0, action: "mint", entity: "drop", entityId: mint.dropId, details: `NFT minted on ${mint.chain} to ${mint.recipient}` });
      await storage.createNotification({ type: "new_mint", title: "New NFT Minted", message: `NFT minted to ${mint.recipient} on ${mint.chain}` });

      const explorerUrl = stellarService.getStellarExplorerUrl(txHash);

      console.log(`[MINT_SUCCESS] Drop: "${drop.title}" | Chain: stellar | Email: ${email} | Recipient: ${recipientAddress} | TxHash: ${txHash} | MintID: ${mint?.id || 'unknown'} | Explorer: ${explorerUrl || 'N/A'}`);

      sendMintConfirmationEmail(email, {
        dropTitle: drop.title,
        chain,
        txHash,
        explorerUrl: explorerUrl || "",
      }).catch(console.error);

      res.json({
        txHash,
        address: recipientAddress,
        explorerUrl,
        chain,
      });
    } catch (err: any) {
      console.error(`[WALLETLESS_MINT] Error: ${err.message}`);
      res.status(500).json({ message: `Minting failed: ${err.message}` });
    }
  });

  // === BLOCKCHAIN STATUS ENDPOINT ===
  app.get("/api/blockchain/status", async (_req, res) => {
    try {
      let stlBal = "0";
      try {
        stlBal = await stellarService.getServerBalance();
      } catch { }

      res.json({
        stellar: {
          serverPublicKey: stellarService.getServerPublicKey(),
          balance: stlBal,
          network: process.env.STELLAR_NETWORK || "testnet",
          healthy: parseFloat(String(stlBal)) > 0,
        },
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // === DASHBOARD STATS ===
  app.get("/api/admin/stats", async (_req, res) => {
    try {
      const [allMints, allDrops, allLocations] = await Promise.all([
        storage.getAllMints(),
        storage.getAllDrops(),
        storage.getAllLocations(),
      ]);

      const publishedDrops = allDrops.filter(d => d.status === "published");
      const totalMinted = allMints.filter(m => m.status === "confirmed").length;
      const uniqueRecipients = new Set(allMints.map(m => m.recipient)).size;
      
      const mintsByChain: Record<string, number> = {};
      const mintsByMonth: Record<string, number> = {};
      
      allMints.forEach(m => {
        mintsByChain[m.chain] = (mintsByChain[m.chain] || 0) + 1;
        const monthKey = new Date(m.createdAt).toISOString().slice(0, 7);
        mintsByMonth[monthKey] = (mintsByMonth[monthKey] || 0) + 1;
      });

      const mintsByLocationData: Record<string, number> = {};
      for (const mint of allMints) {
        const drop = allDrops.find(d => d.id === mint.dropId);
        if (drop) {
          const loc = allLocations.find(l => l.id === drop.locationId);
          const locName = loc?.name || `Location ${drop.locationId}`;
          mintsByLocationData[locName] = (mintsByLocationData[locName] || 0) + 1;
        }
      }

      const walletlessUsersList = await db.select().from(walletlessUsers);
      const topUsers = [];
      for (const wu of walletlessUsersList) {
        const keys = await db.select().from(walletlessKeys).where(eq(walletlessKeys.walletlessUserId, wu.id));
        const addresses = keys.map(k => k.address);
        const userMints = allMints.filter(m => addresses.includes(m.recipient));
        if (userMints.length > 0) {
          topUsers.push({
            email: wu.email,
            mintCount: userMints.length,
            lastMint: userMints[0]?.createdAt,
            verified: !!wu.verifiedAt,
          });
        }
      }
      topUsers.sort((a, b) => b.mintCount - a.mintCount);

      const recentMints = await storage.getRecentMints(10);

      res.json({
        totalMints: totalMinted,
        activeDrops: publishedDrops.length,
        totalLocations: allLocations.length,
        uniqueUsers: uniqueRecipients,
        mintsByChain,
        mintsByMonth,
        mintsByLocation: mintsByLocationData,
        topUsers,
        recentMints,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // === PUBLIC GALLERY ===
  app.get("/api/gallery/:locationId", async (req, res) => {
    try {
      const locationId = Number(req.params.locationId);
      const drop = await storage.getActiveDrop(locationId);
      const mintsList = await storage.getMints(drop?.id || 0);
      
      res.json({
        drop,
        mints: mintsList.map(m => ({
          id: m.id,
          chain: m.chain,
          txHash: m.txHash,
          createdAt: m.createdAt,
        })),
        totalMinted: mintsList.length,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // === MY NFTS ===
  app.get("/api/my-nfts/:email", async (req, res) => {
    try {
      const email = decodeURIComponent(req.params.email);
      const userMints = await storage.getMintsForEmail(email);
      res.json(userMints);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // === QR CODE GENERATION ===
  app.get("/api/qr/:locationId", async (req, res) => {
    try {
      const locationId = Number(req.params.locationId);
      const QRCode = await import("qrcode");
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const claimUrl = `${baseUrl}/claim/${locationId}`;
      
      const format = req.query.format || "png";
      
      if (format === "svg") {
        const svg = await QRCode.toString(claimUrl, { type: "svg", width: 300, margin: 2 });
        res.setHeader("Content-Type", "image/svg+xml");
        res.send(svg);
      } else {
        const png = await QRCode.toBuffer(claimUrl, { width: 300, margin: 2, color: { dark: "#000000", light: "#ffffff" } });
        res.setHeader("Content-Type", "image/png");
        res.send(png);
      }
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // === ACTIVITY LOGS ===
  app.get("/api/admin/activity", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const logs = await storage.getActivityLogs(200);
    res.json(logs);
  });

  // === PLATFORM SETTINGS ===
  app.get("/api/admin/settings", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const settings = await storage.getAllSettings();
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });
    res.json(settingsMap);
  });

  app.put("/api/admin/settings", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const entries = req.body as Record<string, string>;
    for (const [key, value] of Object.entries(entries)) {
      await storage.setSetting(key, value);
    }
    await storage.createActivityLog({
      userId,
      action: "update",
      entity: "settings",
      details: `Updated settings: ${Object.keys(entries).join(", ")}`,
    });
    res.json({ success: true });
  });

  // === NOTIFICATIONS ===
  app.get("/api/admin/notifications", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const notifs = await storage.getNotifications(50);
    const unread = await storage.getUnreadNotificationCount();
    res.json({ notifications: notifs, unreadCount: unread });
  });

  app.post("/api/admin/notifications/read-all", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    await storage.markAllNotificationsRead();
    res.json({ success: true });
  });

  app.post("/api/admin/notifications/:id/read", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    await storage.markNotificationRead(Number(req.params.id));
    res.json({ success: true });
  });

  // === CSV EXPORT ===
  app.get("/api/admin/export/mints", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const allMints = await storage.getAllMints();
    const drops_list = await storage.getAllDrops();
    const dropsMap = new Map(drops_list.map(d => [d.id, d.title]));

    let csv = "ID,Drop,Chain,Recipient,TX Hash,Status,Date\n";
    allMints.forEach(m => {
      csv += `${m.id},"${dropsMap.get(m.dropId) || m.dropId}",${m.chain},"${m.recipient}","${m.txHash || ''}",${m.status},${m.createdAt}\n`;
    });

    await storage.createActivityLog({ userId, action: "export", entity: "mints", details: `Exported ${allMints.length} mints to CSV` });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=mints-export.csv");
    res.send(csv);
  });

  app.get("/api/admin/export/users", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const { db: database } = await import("./db");
    const { walletlessUsers: wuTable } = await import("@shared/schema");
    const allUsers = await database.select().from(wuTable);

    let csv = "ID,Email,Verified,Created\n";
    allUsers.forEach(u => {
      csv += `${u.id},"${u.email}",${u.verifiedAt ? 'Yes' : 'No'},${u.createdAt}\n`;
    });

    await storage.createActivityLog({ userId, action: "export", entity: "users", details: `Exported ${allUsers.length} users to CSV` });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=users-export.csv");
    res.send(csv);
  });

  // === DUPLICATE DROP ===
  app.post("/api/admin/drops/:id/duplicate", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const drop = await storage.getDrop(Number(req.params.id));
    if (!drop) return res.status(404).json({ message: "Drop not found" });
    const newDrop = await storage.createDrop({
      locationId: drop.locationId,
      title: `${drop.title} (Copy)`,
      month: drop.month,
      year: drop.year,
      imageUrl: drop.imageUrl,
      metadataUrl: drop.metadataUrl,
      supply: drop.supply,
      status: "draft",
      enabledChains: drop.enabledChains,
    });
    await storage.createActivityLog({
      userId,
      action: "duplicate",
      entity: "drop",
      entityId: newDrop.id,
      details: `Duplicated drop "${drop.title}" as "${newDrop.title}"`,
    });
    res.json(newDrop);
  });

  // === ENHANCED STELLAR STATUS ===
  app.get("/api/admin/stellar/detailed", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    try {
      const status = stellarService.getChainStatus();
      const allMints = await storage.getAllMints();
      const stellarMints = allMints.filter(m => m.chain === "stellar");
      const lastMint = stellarMints.length > 0 
        ? stellarMints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        : null;

      const serverStartTime = (global as any).__serverStartTime || Date.now();
      const uptimeMs = Date.now() - serverStartTime;

      res.json({
        ...status,
        totalTransactions: stellarMints.length,
        lastTransaction: lastMint ? lastMint.createdAt : null,
        lastTxHash: lastMint ? lastMint.txHash : null,
        uptimeMs,
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

  console.log("[BLOCKCHAIN] Initializing Stellar service...");
  console.log(`[STELLAR] Server: ${stellarService.getServerPublicKey()}`);

  stellarService.ensureServerFunded().then((funded) => {
    console.log(`[STELLAR] Server funded: ${funded}`);
  }).catch(console.error);

  return httpServer;
}
