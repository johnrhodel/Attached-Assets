import { 
  users, projects, locations, drops, claimSessions, mints, walletlessUsers, walletlessKeys,
  type User, type Project, type Location, type Drop, type ClaimSession, type Mint, type WalletlessUser, type WalletlessKey,
  type InsertUser, type InsertProject, type InsertLocation, type InsertDrop, type InsertClaimSession, type InsertMint,
  type InsertWalletlessUser, type InsertWalletlessKey,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Users (Admin)
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Projects
  getProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, data: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;

  // Locations
  getLocations(projectId: number): Promise<Location[]>;
  getLocation(id: number): Promise<Location | undefined>;
  getLocationBySlug(slug: string): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: number, data: Partial<InsertLocation>): Promise<void>;
  deleteLocation(id: number): Promise<void>;

  // Drops
  getDrops(locationId: number): Promise<Drop[]>;
  getDrop(id: number): Promise<Drop | undefined>;
  getActiveDrop(locationId: number): Promise<Drop | undefined>;
  createDrop(drop: InsertDrop): Promise<Drop>;
  updateDrop(id: number, data: Partial<InsertDrop>): Promise<void>;
  deleteDrop(id: number): Promise<void>;
  updateDropStatus(id: number, status: string): Promise<Drop>;
  incrementMintCount(id: number): Promise<void>;

  // Claim Sessions
  createClaimSession(session: InsertClaimSession): Promise<ClaimSession>;
  getClaimSession(tokenHash: string): Promise<ClaimSession | undefined>;
  markSessionConsumed(id: number): Promise<void>;

  // Mints
  createMint(mint: InsertMint): Promise<Mint>;
  getMints(dropId: number): Promise<Mint[]>;

  // Dashboard stats
  getAllMints(): Promise<Mint[]>;
  getAllDrops(): Promise<Drop[]>;
  getAllLocations(): Promise<Location[]>;
  getMintsForEmail(email: string): Promise<Array<Mint & { dropTitle: string; dropImageUrl: string }>>;
  getRecentMints(limit: number): Promise<Array<Mint & { dropTitle: string }>>;
  getMintsByLocation(locationId: number): Promise<Mint[]>;

  // Walletless
  getWalletlessUser(email: string): Promise<WalletlessUser | undefined>;
  createWalletlessUser(user: InsertWalletlessUser): Promise<WalletlessUser>;
  markWalletlessUserVerified(userId: number): Promise<void>;
  getWalletlessKey(userId: number, chain: string): Promise<WalletlessKey | undefined>;
  createWalletlessKey(key: InsertWalletlessKey): Promise<WalletlessKey>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }
  async createProject(item: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(item).returning();
    return project;
  }
  async updateProject(id: number, data: Partial<InsertProject>): Promise<Project> {
    const [project] = await db.update(projects).set(data).where(eq(projects.id, id)).returning();
    return project;
  }
  async deleteProject(id: number): Promise<void> {
    const locs = await db.select().from(locations).where(eq(locations.projectId, id));
    for (const loc of locs) {
      await this.deleteLocation(loc.id);
    }
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Locations
  async getLocations(projectId: number): Promise<Location[]> {
    return await db.select().from(locations).where(eq(locations.projectId, projectId));
  }
  async getLocation(id: number): Promise<Location | undefined> {
    const [loc] = await db.select().from(locations).where(eq(locations.id, id));
    return loc;
  }
  async getLocationBySlug(slug: string): Promise<Location | undefined> {
    const [loc] = await db.select().from(locations).where(eq(locations.slug, slug));
    return loc;
  }
  async createLocation(item: InsertLocation): Promise<Location> {
    const [loc] = await db.insert(locations).values(item).returning();
    return loc;
  }
  async updateLocation(id: number, data: Partial<InsertLocation>): Promise<void> {
    await db.update(locations).set(data).where(eq(locations.id, id));
  }
  async deleteLocation(id: number): Promise<void> {
    const drps = await db.select().from(drops).where(eq(drops.locationId, id));
    for (const drp of drps) {
      await this.deleteDrop(drp.id);
    }
    await db.delete(locations).where(eq(locations.id, id));
  }

  // Drops
  async getDrops(locationId: number): Promise<Drop[]> {
    return await db.select().from(drops).where(eq(drops.locationId, locationId)).orderBy(desc(drops.createdAt));
  }
  async getDrop(id: number): Promise<Drop | undefined> {
    const [drop] = await db.select().from(drops).where(eq(drops.id, id));
    return drop;
  }
  async getActiveDrop(locationId: number): Promise<Drop | undefined> {
    // Return the most recently created 'published' drop
    const [drop] = await db.select()
      .from(drops)
      .where(and(eq(drops.locationId, locationId), eq(drops.status, "published")))
      .orderBy(desc(drops.createdAt))
      .limit(1);
    return drop;
  }
  async createDrop(item: InsertDrop): Promise<Drop> {
    const [drop] = await db.insert(drops).values(item).returning();
    return drop;
  }
  async updateDrop(id: number, data: Partial<InsertDrop>): Promise<void> {
    await db.update(drops).set(data).where(eq(drops.id, id));
  }
  async deleteDrop(id: number): Promise<void> {
    await db.delete(claimSessions).where(eq(claimSessions.dropId, id));
    await db.delete(mints).where(eq(mints.dropId, id));
    await db.delete(drops).where(eq(drops.id, id));
  }
  async updateDropStatus(id: number, status: string): Promise<Drop> {
    const [drop] = await db.update(drops)
      .set({ status })
      .where(eq(drops.id, id))
      .returning();
    return drop;
  }
  async incrementMintCount(id: number): Promise<void> {
    await db.update(drops)
      .set({ mintedCount: sql`${drops.mintedCount} + 1` })
      .where(eq(drops.id, id));
  }

  // Claim Sessions
  async createClaimSession(item: InsertClaimSession): Promise<ClaimSession> {
    const [session] = await db.insert(claimSessions).values(item).returning();
    return session;
  }
  async getClaimSession(tokenHash: string): Promise<ClaimSession | undefined> {
    const [session] = await db.select().from(claimSessions).where(eq(claimSessions.tokenHash, tokenHash));
    return session;
  }
  async markSessionConsumed(id: number): Promise<void> {
    await db.update(claimSessions)
      .set({ status: "consumed", consumedAt: new Date() })
      .where(eq(claimSessions.id, id));
  }

  // Mints
  async createMint(item: InsertMint): Promise<Mint> {
    const [mint] = await db.insert(mints).values(item).returning();
    return mint;
  }
  async getMints(dropId: number): Promise<Mint[]> {
    return await db.select().from(mints).where(eq(mints.dropId, dropId));
  }

  // Dashboard stats
  async getAllMints(): Promise<Mint[]> {
    return await db.select().from(mints).orderBy(desc(mints.createdAt));
  }
  async getAllDrops(): Promise<Drop[]> {
    return await db.select().from(drops).orderBy(desc(drops.createdAt));
  }
  async getAllLocations(): Promise<Location[]> {
    return await db.select().from(locations).orderBy(desc(locations.createdAt));
  }
  async getMintsForEmail(email: string): Promise<Array<Mint & { dropTitle: string; dropImageUrl: string }>> {
    const results = await db.select({
      id: mints.id,
      dropId: mints.dropId,
      chain: mints.chain,
      recipient: mints.recipient,
      txHash: mints.txHash,
      status: mints.status,
      createdAt: mints.createdAt,
      dropTitle: drops.title,
      dropImageUrl: drops.imageUrl,
    }).from(mints)
      .innerJoin(drops, eq(mints.dropId, drops.id))
      .innerJoin(walletlessKeys, and(eq(walletlessKeys.address, mints.recipient), eq(walletlessKeys.chain, mints.chain)))
      .innerJoin(walletlessUsers, eq(walletlessKeys.walletlessUserId, walletlessUsers.id))
      .where(eq(walletlessUsers.email, email))
      .orderBy(desc(mints.createdAt));
    return results;
  }
  async getRecentMints(limit: number): Promise<Array<Mint & { dropTitle: string }>> {
    const results = await db.select({
      id: mints.id,
      dropId: mints.dropId,
      chain: mints.chain,
      recipient: mints.recipient,
      txHash: mints.txHash,
      status: mints.status,
      createdAt: mints.createdAt,
      dropTitle: drops.title,
    }).from(mints)
      .innerJoin(drops, eq(mints.dropId, drops.id))
      .orderBy(desc(mints.createdAt))
      .limit(limit);
    return results;
  }
  async getMintsByLocation(locationId: number): Promise<Mint[]> {
    const results = await db.select({
      id: mints.id,
      dropId: mints.dropId,
      chain: mints.chain,
      recipient: mints.recipient,
      txHash: mints.txHash,
      status: mints.status,
      createdAt: mints.createdAt,
    }).from(mints)
      .innerJoin(drops, eq(mints.dropId, drops.id))
      .where(eq(drops.locationId, locationId))
      .orderBy(desc(mints.createdAt));
    return results;
  }

  // Walletless
  async getWalletlessUser(email: string): Promise<WalletlessUser | undefined> {
    const [user] = await db.select().from(walletlessUsers).where(eq(walletlessUsers.email, email));
    return user;
  }
  async createWalletlessUser(item: InsertWalletlessUser): Promise<WalletlessUser> {
    const [user] = await db.insert(walletlessUsers).values(item).returning();
    return user;
  }
  async markWalletlessUserVerified(userId: number): Promise<void> {
    await db.update(walletlessUsers)
      .set({ verifiedAt: new Date() })
      .where(eq(walletlessUsers.id, userId));
  }
  async getWalletlessKey(userId: number, chain: string): Promise<WalletlessKey | undefined> {
    const [key] = await db.select().from(walletlessKeys).where(
      and(eq(walletlessKeys.walletlessUserId, userId), eq(walletlessKeys.chain, chain))
    );
    return key;
  }
  async createWalletlessKey(item: InsertWalletlessKey): Promise<WalletlessKey> {
    const [key] = await db.insert(walletlessKeys).values(item).returning();
    return key;
  }
}

export const storage = new DatabaseStorage();
