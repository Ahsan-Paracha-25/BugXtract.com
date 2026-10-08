import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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

export const customerReviews = sqliteTable("customer_reviews", {
  id: text("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  role: text("role").notNull(),
  company: text("company").notNull(),
  headline: text("headline").notNull(),
  body: text("body").notNull(),
  rating: integer("rating").notNull(),
  imageKey: text("image_key").notNull(),
  published: integer("published").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [index("idx_customer_reviews_published_updated").on(table.published, table.updatedAt)]);
