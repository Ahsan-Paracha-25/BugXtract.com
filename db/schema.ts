import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sitePricing = sqliteTable("site_pricing", {
  id: integer("id").primaryKey(),
  content: text("content").notNull(),
  updatedAt: text("updated_at").notNull(),
  updatedBy: text("updated_by").notNull(),
});

export const adminCredentials = sqliteTable("admin_credentials", {
  id: integer("id").primaryKey(),
  username: text("username").notNull(),
  salt: text("salt").notNull(),
  passwordHash: text("password_hash").notNull(),
  iterations: integer("iterations").notNull(),
  recoveryUsed: integer("recovery_used").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});

export const adminAuthAttempts = sqliteTable("admin_auth_attempts", {
  ipHash: text("ip_hash").primaryKey(),
  failures: integer("failures").notNull(),
  windowStarted: integer("window_started").notNull(),
  blockedUntil: integer("blocked_until").notNull().default(0),
});
