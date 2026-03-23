import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { randomBytes, createHash, createCipheriv, createDecipheriv } from "crypto";
import { scryptSync, timingSafeEqual } from "crypto";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import express from "express";

import * as stellarService from "./services/stellar";
import { generateWalletForChain } from "./services/wallet";
import { walletlessUsers, walletlessKeys, insertPricingPlanSchema } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { sendVerificationEmail, sendMintConfirmationEmail } from "./services/email";

const PgSession = connectPgSimple(session);

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return password === storedHash;
  const hashBuffer = Buffer.from(hash, 'hex');
  const suppliedBuffer = scryptSync(password, salt, 64);
  if (hashBuffer.length !== suppliedBuffer.length) return false;
  return timingSafeEqual(hashBuffer, suppliedBuffer);
}

const ALGORITHM = 'aes-256-cbc';
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction && !process.env.SESSION_SECRET) {
  console.error('[SECURITY] SESSION_SECRET must be set in production! Server will not start.');
  process.exit(1);
}
if (isProduction && !process.env.WALLET_ENCRYPTION_SECRET) {
  console.error('[SECURITY] WALLET_ENCRYPTION_SECRET must be set in production! Server will not start.');
  process.exit(1);
}
const encryptionSecret = process.env.WALLET_ENCRYPTION_SECRET || process.env.SESSION_SECRET || 'dev-only-encryption-key';
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

  if (isProduction) {
    app.set('trust proxy', 1);
  }

  app.use(session({
    cookie: {
      maxAge: 86400000,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
    },
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: "session",
      createTableIfMissing: true,
      pruneSessionInterval: 60 * 15,
    }),
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || "dev_secret",
  }));

  const loginAttempts = new Map<string, { count: number; resetAt: number }>();
  const LOGIN_RATE_LIMIT = 5;
  const LOGIN_RATE_WINDOW = 15 * 60 * 1000;

  async function requireAuth(req: any, res: any, next: any) {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    if (!user.isActive) return res.status(403).json({ message: "Account deactivated" });
    (req as any).user = user;
    next();
  }

  async function requireAdmin(req: any, res: any, next: any) {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user || !user.isActive) return res.status(403).json({ message: "Account deactivated" });
    if (user.role !== "admin") return res.status(403).json({ message: "Admin access required" });
    (req as any).user = user;
    next();
  }

  async function requireProjectOwnership(req: any, res: any, next: any) {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    if (user.role === "admin") return next();
    const projectId = Number(req.params.projectId || req.params.id);
    if (!projectId) return res.status(400).json({ message: "Project ID required" });
    const project = await storage.getProject(projectId);
    if (!project || project.userId !== user.id) return res.status(403).json({ message: "Access denied" });
    next();
  }

  async function requireLocationOwnership(req: any, res: any, next: any) {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    if (user.role === "admin") return next();
    const locationId = Number(req.params.locationId || req.params.id);
    if (!locationId) return res.status(400).json({ message: "Location ID required" });
    const location = await storage.getLocation(locationId);
    if (!location) return res.status(404).json({ message: "Location not found" });
    const project = await storage.getProject(location.projectId);
    if (!project || project.userId !== user.id) return res.status(403).json({ message: "Access denied" });
    next();
  }

  async function requireDropOwnership(req: any, res: any, next: any) {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    if (user.role === "admin") return next();
    const dropId = Number(req.params.id);
    if (!dropId) return res.status(400).json({ message: "Drop ID required" });
    const drop = await storage.getDrop(dropId);
    if (!drop) return res.status(404).json({ message: "Drop not found" });
    const location = await storage.getLocation(drop.locationId);
    if (!location) return res.status(404).json({ message: "Location not found" });
    const project = await storage.getProject(location.projectId);
    if (!project || project.userId !== user.id) return res.status(403).json({ message: "Access denied" });
    next();
  }

  async function getDropOwnerPlanLimits(dropId: number): Promise<{ maxMintsPerDrop: number | null; maxLocations: number | null; planSlug: string; ownerId: number | null }> {
    const drop = await storage.getDrop(dropId);
    if (!drop) return { maxMintsPerDrop: null, maxLocations: null, planSlug: "free", ownerId: null };
    const location = await storage.getLocation(drop.locationId);
    if (!location) return { maxMintsPerDrop: null, maxLocations: null, planSlug: "free", ownerId: null };
    const project = await storage.getProject(location.projectId);
    if (!project || !project.userId) return { maxMintsPerDrop: null, maxLocations: null, planSlug: "free", ownerId: project?.userId || null };
    const owner = await storage.getUser(project.userId);
    if (!owner || owner.role === "admin") return { maxMintsPerDrop: null, maxLocations: null, planSlug: "admin", ownerId: project.userId };
    const limits = await storage.getUserPlanLimits(project.userId);
    return { ...limits, ownerId: project.userId };
  }

  const REGISTER_RATE_LIMIT = 5;
  const REGISTER_RATE_WINDOW = 15 * 60 * 1000;
  const registerAttempts = new Map<string, { count: number; resetAt: number }>();

  function safeErrorMessage(err: any, context: string): string {
    console.error(`[${context}]`, err);
    if (isProduction) return "An internal error occurred";
    return err.message || "An internal error occurred";
  }

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
      res.status(500).json({ message: safeErrorMessage(err, "SERVER") });
    }
  });

  // === SEED DEFAULT ADMIN ===
  const defaultAdminEmail = "admin@mintoria.xyz";
  const defaultAdminPassword = "Mintoria2026!";
  const existingAdmin = await storage.getUserByEmail(defaultAdminEmail);
  if (!existingAdmin) {
    await storage.createUser({
      email: defaultAdminEmail,
      passwordHash: hashPassword(defaultAdminPassword),
      role: "admin"
    });
    console.log(`[AUTH] Default admin seeded: ${defaultAdminEmail}`);
  } else if (!existingAdmin.passwordHash.includes(':')) {
    await storage.updateUserPassword(existingAdmin.id, hashPassword(existingAdmin.passwordHash === "admin" ? defaultAdminPassword : existingAdmin.passwordHash));
    console.log(`[AUTH] Migrated admin password to hashed format`);
  }

  // === BACKFILL: Assign orphan projects to admin ===
  const adminUser = existingAdmin || await storage.getUserByEmail(defaultAdminEmail);
  if (adminUser) {
    const { projects: projectsTable } = await import("@shared/schema");
    const { isNull } = await import("drizzle-orm");
    const orphanProjects = await db.select().from(projectsTable).where(isNull(projectsTable.userId));
    if (orphanProjects.length > 0) {
      await db.update(projectsTable).set({ userId: adminUser.id }).where(isNull(projectsTable.userId));
      console.log(`[MIGRATION] Assigned ${orphanProjects.length} orphan project(s) to admin user`);
    }
  }

  // === AUTH ROUTES ===
  app.post(api.auth.login.path, async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const attempt = loginAttempts.get(ip);
    if (attempt && now < attempt.resetAt && attempt.count >= LOGIN_RATE_LIMIT) {
      return res.status(429).json({ message: "Too many login attempts. Please try again later." });
    }

    const { email, password } = api.auth.login.input.parse(req.body);
    const user = await storage.getUserByEmail(email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      if (!attempt || now >= attempt.resetAt) {
        loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_RATE_WINDOW });
      } else {
        attempt.count++;
      }
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account deactivated" });
    }

    loginAttempts.delete(ip);

    if (!user.passwordHash.includes(':')) {
      await storage.updateUserPassword(user.id, hashPassword(password));
    }

    (req.session as any).userId = user.id;
    res.json({ message: "Logged in" });
  });

  app.post(api.auth.register.path, async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const attempt = registerAttempts.get(ip);
    if (attempt && now < attempt.resetAt && attempt.count >= REGISTER_RATE_LIMIT) {
      return res.status(429).json({ message: "Too many registration attempts. Please try again later." });
    }

    if (!attempt || now >= attempt.resetAt) {
      registerAttempts.set(ip, { count: 1, resetAt: now + REGISTER_RATE_WINDOW });
    } else {
      attempt.count++;
    }

    try {
      const { email, password, name } = api.auth.register.input.parse(req.body);
      const normalizedEmail = email.toLowerCase().trim();

      const existing = await storage.getUserByEmail(normalizedEmail);
      if (existing) {
        return res.status(409).json({ message: "Email already registered" });
      }

      await storage.createUser({
        email: normalizedEmail,
        passwordHash: hashPassword(password),
        role: "organizer",
        name: name || null,
        isActive: true,
      });

      res.status(201).json({ message: "Account created successfully" });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid registration data" });
      }
      res.status(500).json({ message: safeErrorMessage(err, "REGISTER") });
    }
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
    if (!user.isActive) return res.status(403).json({ message: "Account deactivated" });
    res.json({ id: user.id, email: user.email, role: user.role, name: user.name });
  });

  // === PROJECT / LOCATION / DROP ROUTES ===
  app.get(api.projects.list.path, requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    if (user.role === "admin") {
      const projects = await storage.getProjects();
      return res.json(projects);
    }
    const projects = await storage.getProjectsByUserId(userId);
    res.json(projects);
  });

  app.post(api.projects.create.path, requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const project = await storage.createProject({ ...req.body, userId });
    await storage.createActivityLog({ userId, action: "create", entity: "project", entityId: project.id, details: `Created project "${project.name}"` });
    res.status(201).json(project);
  });

  app.get(api.locations.list.path, requireAuth, requireProjectOwnership, async (req, res) => {
    const locations = await storage.getLocations(Number(req.params.projectId));
    res.json(locations);
  });

  app.post(api.locations.create.path, requireAuth, requireProjectOwnership, async (req, res) => {
    const userId = (req.session as any).userId;
    const user = (req as any).user;

    if (user && user.role !== "admin") {
      const limits = await storage.getUserPlanLimits(userId);
      if (limits.maxLocations !== null) {
        const currentCount = await storage.getLocationCountByUserId(userId);
        if (currentCount >= limits.maxLocations) {
          return res.status(403).json({ message: "PLAN_LOCATION_LIMIT", limit: limits.maxLocations, current: currentCount, planSlug: limits.planSlug });
        }
      }
    }

    const location = await storage.createLocation({
      ...req.body,
      projectId: Number(req.params.projectId)
    });
    await storage.createActivityLog({ userId, action: "create", entity: "location", entityId: location.id, details: `Created location "${location.name}"` });
    res.status(201).json(location);
  });

  app.get(api.locations.getBySlug.path, async (req, res) => {
    const location = await storage.getLocationBySlug(req.params.slug as string);
    if (!location) return res.status(404).json({ message: "Location not found" });
    res.json(location);
  });

  app.get(api.drops.list.path, requireAuth, requireLocationOwnership, async (req, res) => {
    const drops = await storage.getDrops(Number(req.params.locationId));
    res.json(drops);
  });

  app.post(api.drops.create.path, requireAuth, requireLocationOwnership, async (req, res) => {
    const userId = (req.session as any).userId;
    const drop = await storage.createDrop({
      ...req.body,
      locationId: Number(req.params.locationId)
    });
    await storage.createActivityLog({ userId, action: "create", entity: "drop", entityId: drop.id, details: `Created drop "${drop.title}"` });
    res.status(201).json(drop);
  });

  app.get(api.drops.getActive.path, async (req, res) => {
    const drop = await storage.getActiveDrop(Number(req.params.locationId));
    if (!drop) return res.status(404).json({ message: "No active drop found" });
    res.json(drop);
  });

  app.get("/api/drops/:id", async (req, res) => {
    const drop = await storage.getDrop(Number(req.params.id));
    if (!drop || drop.status !== "published") return res.status(404).json({ message: "Drop not found" });
    res.json(drop);
  });

  app.put(api.projects.update.path, requireAuth, requireProjectOwnership, async (req, res) => {
    const userId = (req.session as any).userId;
    const project = await storage.updateProject(Number(req.params.id), req.body);
    await storage.createActivityLog({ userId, action: "update", entity: "project", entityId: project.id, details: `Updated project "${project.name}"` });
    res.json(project);
  });

  app.delete(api.projects.delete.path, requireAuth, requireProjectOwnership, async (req, res) => {
    const userId = (req.session as any).userId;
    await storage.deleteProject(Number(req.params.id));
    await storage.createActivityLog({ userId, action: "delete", entity: "project", entityId: Number(req.params.id), details: `Deleted project #${req.params.id}` });
    res.json({ message: "Project deleted" });
  });

  app.put(api.locations.update.path, requireAuth, requireLocationOwnership, async (req, res) => {
    const userId = (req.session as any).userId;
    await storage.updateLocation(Number(req.params.id), req.body);
    await storage.createActivityLog({ userId, action: "update", entity: "location", entityId: Number(req.params.id), details: `Updated location #${req.params.id}` });
    res.json({ message: "Location updated" });
  });

  app.delete(api.locations.delete.path, requireAuth, requireLocationOwnership, async (req, res) => {
    const userId = (req.session as any).userId;
    await storage.deleteLocation(Number(req.params.id));
    await storage.createActivityLog({ userId, action: "delete", entity: "location", entityId: Number(req.params.id), details: `Deleted location #${req.params.id}` });
    res.json({ message: "Location deleted" });
  });

  app.put(api.drops.update.path, requireAuth, requireDropOwnership, async (req, res) => {
    const userId = (req.session as any).userId;
    await storage.updateDrop(Number(req.params.id), req.body);
    await storage.createActivityLog({ userId, action: "update", entity: "drop", entityId: Number(req.params.id), details: `Updated drop #${req.params.id}` });
    res.json({ message: "Drop updated" });
  });

  app.delete(api.drops.delete.path, requireAuth, requireDropOwnership, async (req, res) => {
    const userId = (req.session as any).userId;
    await storage.deleteDrop(Number(req.params.id));
    await storage.createActivityLog({ userId, action: "delete", entity: "drop", entityId: Number(req.params.id), details: `Deleted drop #${req.params.id}` });
    res.json({ message: "Drop deleted" });
  });

  app.post(api.drops.publish.path, requireAuth, requireDropOwnership, async (req, res) => {
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

    const planLimits = await getDropOwnerPlanLimits(drop.id);
    if (planLimits.maxMintsPerDrop !== null && drop.mintedCount >= planLimits.maxMintsPerDrop) {
      return res.status(429).json({ message: "PLAN_MINT_LIMIT", limit: planLimits.maxMintsPerDrop, current: drop.mintedCount, planSlug: planLimits.planSlug });
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

  app.get("/api/metadata/:locationSlug/:dropSlug", async (req, res) => {
    const { locationSlug, dropSlug } = req.params;
    const host = `${req.protocol}://${req.get("host")}`;

    const projects = await storage.getProjects();
    let matchedDrop = null;
    let matchedLocation = null;
    for (const project of projects) {
      const locations = await storage.getLocations(project.id);
      const location = locations.find(l => l.slug === locationSlug);
      if (location) {
        matchedLocation = location;
        const drops = await storage.getDrops(location.id);
        matchedDrop = drops[0] || null;
        break;
      }
    }

    const imageUrl = matchedDrop?.imageUrl
      ? (matchedDrop.imageUrl.startsWith("http") ? matchedDrop.imageUrl : `${host}${matchedDrop.imageUrl}`)
      : `${host}/images/${locationSlug}.png`;
    const locationName = matchedLocation?.name || locationSlug.replace(/-/g, " ");
    const dropTitle = matchedDrop?.title || dropSlug;
    const galleryUrl = matchedLocation ? `${host}/gallery/${matchedLocation.id}` : `${host}`;

    res.json({
      name: `Mintoria - ${dropTitle}`,
      description: `Commemorative NFT from ${locationName}`,
      image: imageUrl,
      external_url: galleryUrl,
      attributes: [
        { trait_type: "Location", value: locationName },
        { trait_type: "Collection", value: dropTitle },
        { trait_type: "Platform", value: "Mintoria" },
        { trait_type: "Chain", value: "Stellar" },
      ],
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

      if (drop.supply > 0 && drop.mintedCount >= drop.supply) {
        return res.status(429).json({ message: "Drop supply exhausted" });
      }

      const planLimits2 = await getDropOwnerPlanLimits(session.dropId);
      if (planLimits2.maxMintsPerDrop !== null && drop.mintedCount >= planLimits2.maxMintsPerDrop) {
        return res.status(429).json({ message: "PLAN_MINT_LIMIT", limit: planLimits2.maxMintsPerDrop, current: drop.mintedCount, planSlug: planLimits2.planSlug });
      }

      const recipientAddress = recipient || stellarService.getServerPublicKey();

      const result = await stellarService.mintNFT({
        recipientAddress,
        name: drop.title,
        uri: drop.metadataUrl,
      });

      try {
        await storage.markSessionConsumed(session.id);
        await storage.incrementMintCount(session.dropId);

        await storage.createMint({
          dropId: session.dropId,
          chain: "stellar",
          recipient: recipientAddress,
          txHash: result.txHash,
          status: "confirmed",
        });
      } catch (dbErr: any) {
        console.error("[STELLAR_MINT] Blockchain TX succeeded but DB update failed. TxHash:", result.txHash, "Error:", dbErr.message);
      }

      await storage.createActivityLog({ userId: 0, action: "mint", entity: "drop", entityId: session.dropId, details: `NFT minted on stellar to ${recipientAddress}` }).catch(() => {});
      await storage.createNotification({ type: "new_mint", title: "New NFT Minted", message: `NFT minted to ${recipientAddress} on stellar` }).catch(() => {});

      res.json({
        xdr: result.txHash,
        networkPassphrase: "Test SDF Network ; September 2015",
        explorerUrl: stellarService.getStellarExplorerUrl(result.txHash),
      });
    } catch (err: any) {
      console.error("[STELLAR_MINT] Error:", err.message);
      res.status(500).json({ message: safeErrorMessage(err, "STELLAR_MINT") });
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

  const rateLimitByEmail = new Map<string, number[]>();
  const rateLimitByIp = new Map<string, number[]>();
  const RATE_LIMIT_WINDOW = 10 * 60 * 1000;
  const MAX_PER_EMAIL = 3;
  const MAX_PER_IP = 10;

  function checkRateLimit(key: string, store: Map<string, number[]>, max: number): boolean {
    const now = Date.now();
    const timestamps = (store.get(key) || []).filter(t => now - t < RATE_LIMIT_WINDOW);
    if (timestamps.length >= max) {
      store.set(key, timestamps);
      return false;
    }
    timestamps.push(now);
    store.set(key, timestamps);
    return true;
  }

  app.post(api.walletless.start.path, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string" || !email.trim()) {
        return res.status(400).json({ message: "Email is required" });
      }
      const normalizedEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      const ip = req.ip || req.socket.remoteAddress || "unknown";

      if (!checkRateLimit(normalizedEmail, rateLimitByEmail, MAX_PER_EMAIL) || !checkRateLimit(ip, rateLimitByIp, MAX_PER_IP)) {
        return res.status(429).json({ message: "Too many requests. Please wait a few minutes." });
      }
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      await sendVerificationEmail(normalizedEmail, code);
      verificationCodes.set(normalizedEmail, code);
      if (!isProduction) {
        console.log(`[DEV] Verification code for ${email}: ${code}`);
      }

      let user = await storage.getWalletlessUser(normalizedEmail);
      if (!user) {
        user = await storage.createWalletlessUser({ email: normalizedEmail });
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

          if (!isProduction) {
            console.log(`[WALLETLESS] Created stellar wallet for ${email}: ${wallet.address}`);
          }
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
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (verificationCodes.get(normalizedEmail) !== code) {
      return res.status(400).json({ message: "Invalid code", verified: false });
    }

    verificationCodes.delete(normalizedEmail);

    const user = await storage.getWalletlessUser(normalizedEmail);
    if (user) {
      await storage.markWalletlessUserVerified(user.id);
    }

    res.json({
      token: `verified_${randomBytes(16).toString('hex')}`,
      verified: true
    });
  });

  app.post(api.walletless.mine.path, async (req, res) => {
    try {
      const { email, code, claimToken } = req.body;
      const chain = "stellar";
      const normalizedEmail = (email || "").trim().toLowerCase();

      if (!code) {
        return res.status(400).json({ message: "Verification code is required" });
      }

      if (verificationCodes.get(normalizedEmail) !== code) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      verificationCodes.delete(normalizedEmail);
      const userToVerify = await storage.getWalletlessUser(normalizedEmail);
      if (userToVerify) {
        await storage.markWalletlessUserVerified(userToVerify.id);
      }

      const user = await storage.getWalletlessUser(normalizedEmail);
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

      const existingMint = await storage.getMintByEmailAndDrop(email, drop.id);
      if (existingMint) {
        return res.status(409).json({ message: "ALREADY_MINTED" });
      }

      if (drop.supply > 0 && drop.mintedCount >= drop.supply) {
        return res.status(429).json({ message: "Drop supply exhausted" });
      }

      const planLimits3 = await getDropOwnerPlanLimits(session.dropId);
      if (planLimits3.maxMintsPerDrop !== null && drop.mintedCount >= planLimits3.maxMintsPerDrop) {
        return res.status(429).json({ message: "PLAN_MINT_LIMIT", limit: planLimits3.maxMintsPerDrop, current: drop.mintedCount, planSlug: planLimits3.planSlug });
      }

      const secret = decrypt(key.encryptedSecret);
      const result = await stellarService.mintNFTWithCustodialWallet({
        custodialSecretKey: secret,
        name: drop.title,
        uri: drop.metadataUrl,
      });

      const txHash = result.txHash;
      const recipientAddress = result.recipientAddress;

      try {
        await storage.markSessionConsumed(session.id);
        await storage.incrementMintCount(session.dropId);

        await storage.createMint({
          dropId: session.dropId,
          chain,
          recipient: recipientAddress,
          txHash,
          status: "confirmed",
          email: normalizedEmail,
        });
      } catch (dbErr: any) {
        console.error("[WALLETLESS_MINT] Blockchain TX succeeded but DB update failed. TxHash:", txHash, "Error:", dbErr.message);
      }

      await storage.createActivityLog({ userId: 0, action: "mint", entity: "drop", entityId: session.dropId, details: `NFT minted on ${chain} to ${recipientAddress}` }).catch(() => {});
      await storage.createNotification({ type: "new_mint", title: "New NFT Minted", message: `NFT minted to ${recipientAddress} on ${chain}` }).catch(() => {});

      const explorerUrl = stellarService.getStellarExplorerUrl(txHash);

      console.log(`[MINT_SUCCESS] Drop: "${drop.title}" | Chain: stellar | Email: ${normalizedEmail} | Recipient: ${recipientAddress} | TxHash: ${txHash} | Explorer: ${explorerUrl || 'N/A'}`);

      sendMintConfirmationEmail(normalizedEmail, {
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
      res.status(500).json({ message: safeErrorMessage(err, "WALLETLESS_MINT") });
    }
  });

  // === ACCESS CODE LOOKUP ===
  app.post("/api/access-code/lookup", async (req, res) => {
    try {
      const { code } = req.body;
      if (!code || typeof code !== "string") {
        return res.status(400).json({ message: "Access code is required" });
      }

      const drop = await storage.getDropByAccessCode(code.trim());
      if (!drop) {
        return res.status(404).json({ message: "INVALID_CODE" });
      }

      const location = await storage.getLocation(drop.locationId);
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }

      res.json({ locationId: drop.locationId, drop });
    } catch (err: any) {
      res.status(500).json({ message: safeErrorMessage(err, "SERVER") });
    }
  });

  // === BLOCKCHAIN STATUS ENDPOINT ===
  let cachedStatus: { data: any; timestamp: number } | null = null;
  const STATUS_CACHE_TTL = 30000;

  app.get("/api/blockchain/status", async (_req, res) => {
    try {
      const isHealthyCached = cachedStatus && parseFloat(String(cachedStatus.data?.stellar?.balance || "0")) > 0;
      if (cachedStatus && isHealthyCached && Date.now() - cachedStatus.timestamp < STATUS_CACHE_TTL) {
        return res.json(cachedStatus.data);
      }

      try { await stellarService.ensureServerFunded(); } catch { }

      let stlBal = "0";
      try {
        stlBal = await stellarService.getServerBalance();
      } catch { }

      const data = {
        stellar: {
          serverPublicKey: stellarService.getServerPublicKey(),
          balance: stlBal,
          network: process.env.STELLAR_NETWORK || "testnet",
          healthy: parseFloat(String(stlBal)) > 0,
        },
      };

      cachedStatus = { data, timestamp: Date.now() };
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: safeErrorMessage(err, "SERVER") });
    }
  });

  // === RESET MINTS (Admin only) ===
  app.post("/api/admin/reset-mints", requireAdmin, async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
    try {
      await storage.deleteAllMints();
      console.log("[ADMIN] All mints and mint counts have been reset");
      res.json({ message: "All mints have been deleted and drop counts reset to 0" });
    } catch (error: any) {
      console.error("[ADMIN] Error resetting mints:", error);
      res.status(500).json({ message: "Failed to reset mints" });
    }
  });

  // === DASHBOARD STATS ===
  app.get("/api/admin/stats", requireAdmin, async (_req, res) => {
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
      for (const loc of allLocations) {
        mintsByLocationData[loc.name] = 0;
      }
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
      res.status(500).json({ message: safeErrorMessage(err, "SERVER") });
    }
  });

  // === ORGANIZER DASHBOARD ===
  async function requireOrganizerOrAdmin(req: any, res: any, next: any) {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user || !user.isActive) return res.status(403).json({ message: "Account deactivated" });
    if (user.role !== "organizer" && user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    (req as any).user = user;
    next();
  }

  app.get("/api/organizer/stats", requireOrganizerOrAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const stats = await storage.getOrganizerStats(user.id);
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ message: safeErrorMessage(err, "ORGANIZER_STATS") });
    }
  });

  app.get("/api/organizer/projects", requireOrganizerOrAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const userProjects = await storage.getProjectsByUserId(user.id);
      res.json(userProjects);
    } catch (err: any) {
      res.status(500).json({ message: safeErrorMessage(err, "ORGANIZER_PROJECTS") });
    }
  });

  app.get("/api/organizer/mints", requireOrganizerOrAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const recentMints = await storage.getOrganizerMints(user.id, limit);
      res.json(recentMints);
    } catch (err: any) {
      res.status(500).json({ message: safeErrorMessage(err, "ORGANIZER_MINTS") });
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
      res.status(500).json({ message: safeErrorMessage(err, "SERVER") });
    }
  });

  // === PUBLIC PRICING ===
  app.get("/api/public/pricing", async (_req, res) => {
    try {
      const plans = await storage.getActivePricingPlans();
      res.json(plans);
    } catch (err: any) {
      res.status(500).json({ message: safeErrorMessage(err, "SERVER") });
    }
  });

  // === PUBLIC STATS ===
  app.get("/api/public/stats", async (_req, res) => {
    try {
      const allMints = await storage.getAllMints();
      const allLocations = await storage.getAllLocations();
      const allDrops = await storage.getAllDrops();
      const confirmedMints = allMints.filter(m => m.status === "confirmed").length;
      const activeDrops = allDrops.filter(d => d.status === "published").length;
      res.json({
        totalMinted: confirmedMints,
        activeLocations: allLocations.length,
        activeDrops,
      });
    } catch (err: any) {
      res.status(500).json({ message: safeErrorMessage(err, "SERVER") });
    }
  });

  // === MY NFTS ===
  app.get("/api/my-nfts/:email", async (req, res) => {
    try {
      const email = decodeURIComponent(req.params.email);
      const userMints = await storage.getMintsForEmail(email);
      res.json(userMints);
    } catch (err: any) {
      res.status(500).json({ message: safeErrorMessage(err, "SERVER") });
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
      res.status(500).json({ message: safeErrorMessage(err, "SERVER") });
    }
  });

  // === ACTIVITY LOGS ===
  app.get("/api/admin/activity", requireAdmin, async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const logs = await storage.getActivityLogs(200);
    res.json(logs);
  });

  // === PLATFORM SETTINGS ===
  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const settings = await storage.getAllSettings();
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });
    res.json(settingsMap);
  });

  app.put("/api/admin/settings", requireAdmin, async (req, res) => {
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
  app.get("/api/admin/notifications", requireAdmin, async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const notifs = await storage.getNotifications(50);
    const unread = await storage.getUnreadNotificationCount();
    res.json({ notifications: notifs, unreadCount: unread });
  });

  app.post("/api/admin/notifications/read-all", requireAdmin, async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    await storage.markAllNotificationsRead();
    res.json({ success: true });
  });

  app.post("/api/admin/notifications/:id/read", requireAdmin, async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    await storage.markNotificationRead(Number(req.params.id));
    res.json({ success: true });
  });

  // === ADMIN PRICING ===
  app.get("/api/admin/pricing", requireAdmin, async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    try {
      const plans = await storage.getPricingPlans();
      res.json(plans);
    } catch (err: any) {
      res.status(500).json({ message: safeErrorMessage(err, "SERVER") });
    }
  });

  app.post("/api/admin/pricing", requireAdmin, async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    try {
      const parsed = insertPricingPlanSchema.parse(req.body);
      const plan = await storage.createPricingPlan(parsed);
      await storage.createActivityLog({ userId, action: "create", entity: "pricing_plan", entityId: plan.id, details: `Created pricing plan: ${plan.name}` });
      res.status(201).json(plan);
    } catch (err: any) {
      if (err.name === "ZodError") return res.status(400).json({ message: "Invalid data", errors: err.errors });
      res.status(500).json({ message: safeErrorMessage(err, "SERVER") });
    }
  });

  app.put("/api/admin/pricing/:id", requireAdmin, async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    try {
      const parsed = insertPricingPlanSchema.partial().parse(req.body);
      const plan = await storage.updatePricingPlan(Number(req.params.id), parsed);
      if (!plan) return res.status(404).json({ message: "Plan not found" });
      await storage.createActivityLog({ userId, action: "update", entity: "pricing_plan", entityId: plan.id, details: `Updated pricing plan: ${plan.name}` });
      res.json(plan);
    } catch (err: any) {
      if (err.name === "ZodError") return res.status(400).json({ message: "Invalid data", errors: err.errors });
      res.status(500).json({ message: safeErrorMessage(err, "SERVER") });
    }
  });

  app.delete("/api/admin/pricing/:id", requireAdmin, async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    try {
      await storage.deletePricingPlan(Number(req.params.id));
      await storage.createActivityLog({ userId, action: "delete", entity: "pricing_plan", entityId: Number(req.params.id), details: "Deleted pricing plan" });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: safeErrorMessage(err, "SERVER") });
    }
  });

  // === CSV EXPORT ===
  app.get("/api/admin/export/mints", requireAdmin, async (req, res) => {
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

  app.get("/api/admin/export/users", requireAdmin, async (req, res) => {
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
  app.post("/api/admin/drops/:id/duplicate", requireAdmin, async (req, res) => {
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
      accessCode: null,
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
  app.get("/api/admin/stellar/detailed", requireAdmin, async (req, res) => {
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
      res.status(500).json({ message: safeErrorMessage(err, "SERVER") });
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
        metadataUrl: "/api/metadata/eiffel/paris-2026",
        supply: 1000,
        enabledChains: ["evm", "solana", "stellar"],
        status: "published"
      });
      console.log("Seeding Complete.");
    }

    const projectId = (await storage.getProjects())[0]?.id;

    const accessCodeMap: Record<string, string> = {
      "Paris Visit 2026": "PARIS2026",
      "Rio de Janeiro 2026": "RIO2026",
      "Curitiba 2026": "CURITIBA2026",
      "Foz do Iguaçu 2026": "FOZ2026",
    };
    const allExistingDrops = await storage.getAllDrops();
    for (const [title, code] of Object.entries(accessCodeMap)) {
      const drop = allExistingDrops.find(d => d.title === title && d.accessCode !== code);
      if (drop) {
        await storage.updateDrop(drop.id, { accessCode: code });
        console.log(`[SEED] Fixed access code ${code} on drop "${title}"`);
      }
    }

    const allLocations = projectId ? await storage.getLocations(projectId) : [];
    if (projectId && !allLocations.find(l => l.slug === "cristo-redentor")) {
      console.log("[SEED] Creating Cristo Redentor location...");
      const rioLocation = await storage.createLocation({ name: "Cristo Redentor", slug: "cristo-redentor", projectId });
      await storage.createDrop({
        locationId: rioLocation.id,
        title: "Rio de Janeiro 2026",
        month: "February",
        year: 2026,
        imageUrl: "/images/rio-cristo-redentor.png",
        metadataUrl: "/api/metadata/cristo-redentor/rio-2026",
        supply: 1000,
        enabledChains: ["stellar"],
        status: "published",
        accessCode: "RIO2026",
      });
      console.log(`[SEED] Created Cristo Redentor with access code RIO2026`);
    }

    if (projectId && !allLocations.find(l => l.slug === "palacio-cristal")) {
      console.log("[SEED] Creating Palácio de Cristal location...");
      const cwbLocation = await storage.createLocation({ name: "Palácio de Cristal", slug: "palacio-cristal", projectId });
      await storage.createDrop({
        locationId: cwbLocation.id,
        title: "Curitiba 2026",
        month: "February",
        year: 2026,
        imageUrl: "/images/curitiba-jardim-botanico.png",
        metadataUrl: "/api/metadata/palacio-cristal/curitiba-2026",
        supply: 1000,
        enabledChains: ["stellar"],
        status: "published",
        accessCode: "CURITIBA2026",
      });
      console.log(`[SEED] Created Palácio de Cristal with access code CURITIBA2026`);
    }

    if (projectId && !allLocations.find(l => l.slug === "cataratas-do-iguacu")) {
      console.log("[SEED] Creating Cataratas do Iguaçu location...");
      const fozLocation = await storage.createLocation({ name: "Cataratas do Iguaçu", slug: "cataratas-do-iguacu", projectId });
      await storage.createDrop({
        locationId: fozLocation.id,
        title: "Foz do Iguaçu 2026",
        month: "February",
        year: 2026,
        imageUrl: "/images/foz-cataratas.png",
        metadataUrl: "/api/metadata/cataratas-do-iguacu/foz-2026",
        supply: 1000,
        enabledChains: ["stellar"],
        status: "published",
        accessCode: "FOZ2026",
      });
      console.log(`[SEED] Created Cataratas do Iguaçu with access code FOZ2026`);
    }

    const existingPlans = await storage.getPricingPlans();
    if (existingPlans.length === 0) {
      console.log("Seeding default pricing plans...");
      await storage.createPricingPlan({
        name: "Starter",
        description: "Perfeito para eventos individuais",
        price: "R$599",
        pricePer: "/evento",
        features: ["Up to 500 mints", "1 location", "QR code generation", "Email support", "Basic analytics"],
        highlighted: false,
        sortOrder: 0,
        isActive: true,
      });
      await storage.createPricingPlan({
        name: "Professional",
        description: "Para operadores de turismo",
        price: "R$1.497",
        pricePer: "/month",
        features: ["Unlimited mints", "5 locations", "Custom branding", "Priority support", "Advanced analytics", "Embeddable widget"],
        highlighted: true,
        sortOrder: 1,
        isActive: true,
      });
      await storage.createPricingPlan({
        name: "Enterprise",
        description: "Solucao completa para grandes operacoes",
        price: "R$4.997",
        pricePer: "/month",
        features: ["Unlimited everything", "Unlimited locations", "White-label solution", "API access", "Dedicated support", "Custom integrations", "SLA guarantee"],
        highlighted: false,
        sortOrder: 2,
        isActive: true,
      });
      console.log("Pricing plans seeded.");
    }
  }

  seed().catch(console.error);

  storage.cleanupExpiredSessions().then((count) => {
    if (count > 0) console.log(`[CLEANUP] Removed ${count} expired claim sessions`);
  }).catch(console.error);

  console.log("[BLOCKCHAIN] Initializing Stellar service...");
  console.log(`[STELLAR] Server: ${stellarService.getServerPublicKey()}`);

  stellarService.ensureServerFunded().then((funded) => {
    console.log(`[STELLAR] Server funded: ${funded}`);
  }).catch(console.error);

  return httpServer;
}
