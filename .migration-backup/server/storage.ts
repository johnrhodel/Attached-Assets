import { 
  users, projects, locations, drops, claimSessions, mints, walletlessUsers, walletlessKeys,
  activityLogs, platformSettings, notifications, pricingPlans,
  type User, type Project, type Location, type Drop, type ClaimSession, type Mint, type WalletlessUser, type WalletlessKey,
  type ActivityLog, type PlatformSetting, type Notification, type PricingPlan,
  type InsertUser, type InsertProject, type InsertLocation, type InsertDrop, type InsertClaimSession, type InsertMint,
  type InsertWalletlessUser, type InsertWalletlessKey,
  type InsertActivityLog, type InsertPlatformSetting, type InsertNotification, type InsertPricingPlan,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // Users (Admin + Organizer)
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: number, passwordHash: string): Promise<void>;
  getUsers(role?: string): Promise<User[]>;

  // Projects
  getProjects(): Promise<Project[]>;
  getProjectsByUserId(userId: number): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
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
  cleanupExpiredSessions(): Promise<number>;

  // Mints
  createMint(mint: InsertMint): Promise<Mint>;
  getMints(dropId: number): Promise<Mint[]>;
  getMintByEmailAndDrop(email: string, dropId: number): Promise<Mint | undefined>;

  // Dashboard stats
  getAllMints(): Promise<Mint[]>;
  getAllDrops(): Promise<Drop[]>;
  getAllLocations(): Promise<Location[]>;
  getMintsForEmail(email: string): Promise<Array<Mint & { dropTitle: string; dropImageUrl: string }>>;
  getRecentMints(limit: number): Promise<Array<Mint & { dropTitle: string }>>;
  getMintsByLocation(locationId: number): Promise<Mint[]>;
  deleteAllMints(): Promise<void>;

  // Drops by access code
  getDropByAccessCode(code: string): Promise<Drop | undefined>;

  // Walletless
  getWalletlessUser(email: string): Promise<WalletlessUser | undefined>;
  createWalletlessUser(user: InsertWalletlessUser): Promise<WalletlessUser>;
  markWalletlessUserVerified(userId: number): Promise<void>;
  getWalletlessKey(userId: number, chain: string): Promise<WalletlessKey | undefined>;
  createWalletlessKey(key: InsertWalletlessKey): Promise<WalletlessKey>;

  // Activity Logs
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  deleteAllActivityLogs(): Promise<void>;
  getActivityLogs(limit?: number): Promise<Array<ActivityLog & { userEmail?: string }>>;

  // Platform Settings
  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string): Promise<void>;
  getAllSettings(): Promise<PlatformSetting[]>;

  // Notifications
  createNotification(n: InsertNotification): Promise<Notification>;
  getNotifications(limit?: number): Promise<Notification[]>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsRead(): Promise<void>;
  getUnreadNotificationCount(): Promise<number>;

  // Pricing Plans
  getPricingPlans(): Promise<PricingPlan[]>;
  getActivePricingPlans(): Promise<PricingPlan[]>;
  createPricingPlan(plan: InsertPricingPlan): Promise<PricingPlan>;
  updatePricingPlan(id: number, data: Partial<InsertPricingPlan>): Promise<PricingPlan>;
  deletePricingPlan(id: number): Promise<void>;

  // Plan Limits
  getUserPlanLimits(userId: number): Promise<{ maxMintsPerDrop: number | null; maxLocations: number | null; planSlug: string }>;
  getLocationCountByUserId(userId: number): Promise<number>;

  // Admin Organizer Management
  getAllOrganizers(filters?: { planSlug?: string; search?: string; since?: string; page?: number; limit?: number }): Promise<{
    organizers: Array<{
      id: number;
      email: string;
      name: string | null;
      planSlug: string | null;
      isActive: boolean;
      createdAt: Date;
      totalMints: number;
      totalProjects: number;
    }>;
    total: number;
  }>;
  getOrganizerDetails(userId: number): Promise<{
    user: User;
    projects: Array<Project & { locations: Array<Location & { drops: Array<Drop & { mintCount: number }> }> }>;
    totalMints: number;
  } | undefined>;
  getOrganizerGlobalStats(): Promise<{
    totalOrganizers: number;
    activeOrganizers: number;
    newLastMonth: number;
    byPlan: Record<string, number>;
    conversionRate: number;
    totalPlatformMints: number;
  }>;
  toggleOrganizerStatus(userId: number, active: boolean): Promise<void>;

  // Organizer Dashboard
  getOrganizerStats(userId: number): Promise<{
    totalMints: number;
    activeDrops: number;
    totalLocations: number;
    totalProjects: number;
    mintsByDrop: Array<{ dropId: number; dropTitle: string; locationName: string; mintCount: number; supply: number | null }>;
  }>;
  getOrganizerMints(userId: number, limit: number): Promise<Array<{
    id: number;
    dropId: number;
    chain: string;
    recipient: string;
    txHash: string | null;
    status: string;
    email: string | null;
    createdAt: Date;
    dropTitle: string;
    locationName: string;
  }>>;
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
  async updateUserPassword(id: number, passwordHash: string): Promise<void> {
    await db.update(users).set({ passwordHash }).where(eq(users.id, id));
  }
  async getUsers(role?: string): Promise<User[]> {
    if (role) {
      return await db.select().from(users).where(eq(users.role, role)).orderBy(desc(users.createdAt));
    }
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }
  async getProjectsByUserId(userId: number): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
  }
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
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
  async cleanupExpiredSessions(): Promise<number> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await db.delete(claimSessions)
      .where(and(
        eq(claimSessions.status, "active"),
        sql`${claimSessions.expiresAt} < ${cutoff}`
      ));
    return (result as any).rowCount || 0;
  }

  // Mints
  async createMint(item: InsertMint): Promise<Mint> {
    const [mint] = await db.insert(mints).values(item).returning();
    return mint;
  }
  async getMints(dropId: number): Promise<Mint[]> {
    return await db.select().from(mints).where(eq(mints.dropId, dropId));
  }
  async getMintByEmailAndDrop(email: string, dropId: number): Promise<Mint | undefined> {
    const [mint] = await db.select().from(mints).where(
      and(
        eq(mints.email, email),
        eq(mints.dropId, dropId),
        inArray(mints.status, ["confirmed", "pending"])
      )
    );
    return mint;
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
  async deleteAllMints(): Promise<void> {
    await db.delete(mints);
    await db.delete(walletlessKeys);
    await db.delete(walletlessUsers);
    await db.delete(claimSessions);
    await db.update(drops).set({ mintedCount: 0 });
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

  // Drops by access code
  async getDropByAccessCode(code: string): Promise<Drop | undefined> {
    const [drop] = await db.select().from(drops).where(
      and(eq(drops.accessCode, code.toUpperCase()), eq(drops.status, "published"))
    );
    return drop;
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

  // Activity Logs
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [entry] = await db.insert(activityLogs).values(log).returning();
    return entry;
  }
  async deleteAllActivityLogs(): Promise<void> {
    await db.delete(activityLogs);
  }
  async getActivityLogs(limit = 100): Promise<Array<ActivityLog & { userEmail?: string }>> {
    const results = await db.select({
      id: activityLogs.id,
      userId: activityLogs.userId,
      action: activityLogs.action,
      entity: activityLogs.entity,
      entityId: activityLogs.entityId,
      details: activityLogs.details,
      createdAt: activityLogs.createdAt,
      userEmail: users.email,
    }).from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
    return results.map(r => ({ ...r, userEmail: r.userEmail ?? undefined }));
  }

  // Platform Settings
  async getSetting(key: string): Promise<string | undefined> {
    const [s] = await db.select().from(platformSettings).where(eq(platformSettings.key, key));
    return s?.value;
  }
  async setSetting(key: string, value: string): Promise<void> {
    const existing = await this.getSetting(key);
    if (existing !== undefined) {
      await db.update(platformSettings).set({ value, updatedAt: new Date() }).where(eq(platformSettings.key, key));
    } else {
      await db.insert(platformSettings).values({ key, value });
    }
  }
  async getAllSettings(): Promise<PlatformSetting[]> {
    return db.select().from(platformSettings);
  }

  // Notifications
  async createNotification(n: InsertNotification): Promise<Notification> {
    const [notif] = await db.insert(notifications).values(n).returning();
    return notif;
  }
  async getNotifications(limit = 50): Promise<Notification[]> {
    return db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(limit);
  }
  async markNotificationRead(id: number): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  }
  async markAllNotificationsRead(): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.read, false));
  }
  async getUnreadNotificationCount(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(eq(notifications.read, false));
    return Number(result?.count ?? 0);
  }

  // Pricing Plans
  async getPricingPlans(): Promise<PricingPlan[]> {
    return db.select().from(pricingPlans).orderBy(pricingPlans.sortOrder);
  }
  async getActivePricingPlans(): Promise<PricingPlan[]> {
    return db.select().from(pricingPlans).where(eq(pricingPlans.isActive, true)).orderBy(pricingPlans.sortOrder);
  }
  async createPricingPlan(plan: InsertPricingPlan): Promise<PricingPlan> {
    const [created] = await db.insert(pricingPlans).values(plan).returning();
    return created;
  }
  async updatePricingPlan(id: number, data: Partial<InsertPricingPlan>): Promise<PricingPlan> {
    const [updated] = await db.update(pricingPlans).set({ ...data, updatedAt: new Date() }).where(eq(pricingPlans.id, id)).returning();
    return updated;
  }
  async deletePricingPlan(id: number): Promise<void> {
    await db.delete(pricingPlans).where(eq(pricingPlans.id, id));
  }

  // Plan Limits
  async getUserPlanLimits(userId: number): Promise<{ maxMintsPerDrop: number | null; maxLocations: number | null; planSlug: string }> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return { maxMintsPerDrop: 50, maxLocations: 1, planSlug: "free" };
    const planSlug = user.planSlug || "free";
    const [plan] = await db.select().from(pricingPlans).where(eq(pricingPlans.slug, planSlug));
    if (!plan) return { maxMintsPerDrop: 50, maxLocations: 1, planSlug };
    return { maxMintsPerDrop: plan.maxMintsPerDrop, maxLocations: plan.maxLocations, planSlug };
  }

  async getLocationCountByUserId(userId: number): Promise<number> {
    const userProjects = await db.select().from(projects).where(eq(projects.userId, userId));
    if (userProjects.length === 0) return 0;
    const projectIds = userProjects.map(p => p.id);
    const userLocations = await db.select().from(locations).where(inArray(locations.projectId, projectIds));
    return userLocations.length;
  }

  // Organizer Dashboard
  async getOrganizerStats(userId: number) {
    const userProjects = await db.select().from(projects).where(eq(projects.userId, userId));
    const projectIds = userProjects.map(p => p.id);

    if (projectIds.length === 0) {
      return { totalMints: 0, activeDrops: 0, totalLocations: 0, totalProjects: 0, mintsByDrop: [] };
    }

    const userLocations = await db.select().from(locations).where(inArray(locations.projectId, projectIds));
    const locationIds = userLocations.map(l => l.id);

    if (locationIds.length === 0) {
      return { totalMints: 0, activeDrops: 0, totalLocations: 0, totalProjects: userProjects.length, mintsByDrop: [] };
    }

    const userDrops = await db.select().from(drops).where(inArray(drops.locationId, locationIds));
    const dropIds = userDrops.map(d => d.id);
    const activeDrops = userDrops.filter(d => d.status === "published").length;

    let totalMints = 0;
    const mintsByDrop: Array<{ dropId: number; dropTitle: string; locationName: string; mintCount: number; supply: number | null }> = [];

    if (dropIds.length > 0) {
      const userMints = await db.select().from(mints).where(inArray(mints.dropId, dropIds));
      const confirmedMints = userMints.filter(m => m.status === "confirmed");
      totalMints = confirmedMints.length;

      for (const drop of userDrops) {
        const dropMints = confirmedMints.filter(m => m.dropId === drop.id).length;
        const loc = userLocations.find(l => l.id === drop.locationId);
        mintsByDrop.push({
          dropId: drop.id,
          dropTitle: drop.title,
          locationName: loc?.name || "Unknown",
          mintCount: dropMints,
          supply: drop.supply,
        });
      }
    }

    return {
      totalMints,
      activeDrops,
      totalLocations: userLocations.length,
      totalProjects: userProjects.length,
      mintsByDrop,
    };
  }

  async getOrganizerMints(userId: number, limit: number) {
    const userProjects = await db.select().from(projects).where(eq(projects.userId, userId));
    const projectIds = userProjects.map(p => p.id);

    if (projectIds.length === 0) return [];

    const userLocations = await db.select().from(locations).where(inArray(locations.projectId, projectIds));
    const locationIds = userLocations.map(l => l.id);

    if (locationIds.length === 0) return [];

    const userDrops = await db.select().from(drops).where(inArray(drops.locationId, locationIds));
    const dropIds = userDrops.map(d => d.id);

    if (dropIds.length === 0) return [];

    const results = await db.select({
      id: mints.id,
      dropId: mints.dropId,
      chain: mints.chain,
      recipient: mints.recipient,
      txHash: mints.txHash,
      status: mints.status,
      email: mints.email,
      createdAt: mints.createdAt,
      dropTitle: drops.title,
      locationName: locations.name,
    }).from(mints)
      .innerJoin(drops, eq(mints.dropId, drops.id))
      .innerJoin(locations, eq(drops.locationId, locations.id))
      .where(inArray(mints.dropId, dropIds))
      .orderBy(desc(mints.createdAt))
      .limit(limit);

    return results;
  }

  // Admin Organizer Management
  async getAllOrganizers(filters?: { planSlug?: string; search?: string; since?: string; page?: number; limit?: number }) {
    const page = Math.max(1, filters?.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters?.limit ?? 20));
    const offset = (page - 1) * limit;

    let allOrganizers = await db.select().from(users).where(eq(users.role, "organizer")).orderBy(desc(users.createdAt));

    if (filters?.planSlug) {
      allOrganizers = allOrganizers.filter(u => u.planSlug === filters.planSlug);
    }
    if (filters?.since) {
      const sinceDate = new Date(filters.since);
      allOrganizers = allOrganizers.filter(u => u.createdAt >= sinceDate);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      allOrganizers = allOrganizers.filter(u =>
        u.email.toLowerCase().includes(q) || (u.name && u.name.toLowerCase().includes(q))
      );
    }

    const total = allOrganizers.length;
    const paged = allOrganizers.slice(offset, offset + limit);

    const organizers = await Promise.all(paged.map(async (u) => {
      const userProjects = await db.select().from(projects).where(eq(projects.userId, u.id));
      const projectIds = userProjects.map(p => p.id);
      let totalMints = 0;
      if (projectIds.length > 0) {
        const userLocations = await db.select().from(locations).where(inArray(locations.projectId, projectIds));
        const locationIds = userLocations.map(l => l.id);
        if (locationIds.length > 0) {
          const userDrops = await db.select().from(drops).where(inArray(drops.locationId, locationIds));
          const dropIds = userDrops.map(d => d.id);
          if (dropIds.length > 0) {
            const userMints = await db.select().from(mints).where(inArray(mints.dropId, dropIds));
            totalMints = userMints.filter(m => m.status === "confirmed").length;
          }
        }
      }
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        planSlug: u.planSlug,
        isActive: u.isActive,
        createdAt: u.createdAt,
        totalMints,
        totalProjects: userProjects.length,
      };
    }));

    return { organizers, total };
  }

  async getOrganizerDetails(userId: number) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || user.role !== "organizer") return undefined;

    const userProjects = await db.select().from(projects).where(eq(projects.userId, userId));
    let totalMints = 0;

    const projectsWithDetails = await Promise.all(userProjects.map(async (project) => {
      const projectLocations = await db.select().from(locations).where(eq(locations.projectId, project.id));
      const locationsWithDrops = await Promise.all(projectLocations.map(async (loc) => {
        const locationDrops = await db.select().from(drops).where(eq(drops.locationId, loc.id));
        const dropsWithMints = await Promise.all(locationDrops.map(async (drop) => {
          const dropMints = await db.select().from(mints).where(eq(mints.dropId, drop.id));
          const confirmed = dropMints.filter(m => m.status === "confirmed").length;
          totalMints += confirmed;
          return { ...drop, mintCount: confirmed };
        }));
        return { ...loc, drops: dropsWithMints };
      }));
      return { ...project, locations: locationsWithDrops };
    }));

    return { user, projects: projectsWithDetails, totalMints };
  }

  async getOrganizerGlobalStats() {
    const allOrganizers = await db.select().from(users).where(eq(users.role, "organizer"));
    const totalOrganizers = allOrganizers.length;
    const activeOrganizers = allOrganizers.filter(u => u.isActive).length;

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const newLastMonth = allOrganizers.filter(u => u.createdAt >= oneMonthAgo).length;

    const byPlan: Record<string, number> = {};
    allOrganizers.forEach(u => {
      const plan = u.planSlug || "free";
      byPlan[plan] = (byPlan[plan] || 0) + 1;
    });

    const freeCount = byPlan["free"] || 0;
    const paidCount = totalOrganizers - freeCount;
    const conversionRate = totalOrganizers > 0 ? Math.round((paidCount / totalOrganizers) * 100) : 0;

    const allMintsList = await db.select().from(mints);
    const totalPlatformMints = allMintsList.filter(m => m.status === "confirmed").length;

    return { totalOrganizers, activeOrganizers, newLastMonth, byPlan, conversionRate, totalPlatformMints };
  }

  async toggleOrganizerStatus(userId: number, active: boolean) {
    await db.update(users).set({ isActive: active }).where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();
