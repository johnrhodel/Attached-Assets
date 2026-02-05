import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === USERS (Admin) ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").default("admin").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });

// === PROJECTS ===
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });

// === LOCATIONS ===
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(), // Foreign key to projects
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLocationSchema = createInsertSchema(locations).omit({ id: true, createdAt: true });

// === DROPS ===
export const drops = pgTable("drops", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").notNull(), // Foreign key to locations
  title: text("title").notNull(),
  month: text("month").notNull(), // e.g. "February"
  year: integer("year").notNull(), // e.g. 2026
  imageUrl: text("image_url").notNull(),
  metadataUrl: text("metadata_url").notNull(),
  supply: integer("supply").default(0).notNull(),
  mintedCount: integer("minted_count").default(0).notNull(),
  status: text("status").default("draft").notNull(), // draft, published
  enabledChains: jsonb("enabled_chains").$type<string[]>().notNull(), // ["evm", "solana", "stellar"]
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDropSchema = createInsertSchema(drops).omit({ id: true, createdAt: true, mintedCount: true });

// === CLAIM SESSIONS ===
export const claimSessions = pgTable("claim_sessions", {
  id: serial("id").primaryKey(),
  dropId: integer("drop_id").notNull(),
  tokenHash: text("token_hash").notNull(), // Hashed claim token
  status: text("status").default("active").notNull(), // active, consumed, expired
  ipHash: text("ip_hash"),
  expiresAt: timestamp("expires_at").notNull(),
  consumedAt: timestamp("consumed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClaimSessionSchema = createInsertSchema(claimSessions).omit({ id: true, createdAt: true });

// === MINTS ===
export const mints = pgTable("mints", {
  id: serial("id").primaryKey(),
  dropId: integer("drop_id").notNull(),
  chain: text("chain").notNull(), // evm, solana, stellar
  recipient: text("recipient").notNull(),
  txHash: text("tx_hash"),
  status: text("status").default("pending").notNull(), // pending, confirmed, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMintSchema = createInsertSchema(mints).omit({ id: true, createdAt: true });

// === WALLETLESS USERS ===
export const walletlessUsers = pgTable("walletless_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWalletlessUserSchema = createInsertSchema(walletlessUsers).omit({ id: true, createdAt: true });

// === WALLETLESS KEYS ===
export const walletlessKeys = pgTable("walletless_keys", {
  id: serial("id").primaryKey(),
  walletlessUserId: integer("walletless_user_id").notNull(),
  chain: text("chain").notNull(),
  address: text("address").notNull(),
  encryptedSecret: text("encrypted_secret").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWalletlessKeySchema = createInsertSchema(walletlessKeys).omit({ id: true, createdAt: true });

// === RELATIONS ===
export const projectsRelations = relations(projects, ({ many }) => ({
  locations: many(locations),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  project: one(projects, {
    fields: [locations.projectId],
    references: [projects.id],
  }),
  drops: many(drops),
}));

export const dropsRelations = relations(drops, ({ one, many }) => ({
  location: one(locations, {
    fields: [drops.locationId],
    references: [locations.id],
  }),
  claimSessions: many(claimSessions),
  mints: many(mints),
}));

// === TYPES ===
export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type Drop = typeof drops.$inferSelect;
export type ClaimSession = typeof claimSessions.$inferSelect;
export type Mint = typeof mints.$inferSelect;
export type WalletlessUser = typeof walletlessUsers.$inferSelect;
export type WalletlessKey = typeof walletlessKeys.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type InsertDrop = z.infer<typeof insertDropSchema>;
export type InsertClaimSession = z.infer<typeof insertClaimSessionSchema>;
export type InsertMint = z.infer<typeof insertMintSchema>;
