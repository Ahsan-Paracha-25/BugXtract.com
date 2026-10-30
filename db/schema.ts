import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
  rating: real("rating").notNull(),
  imageKey: text("image_key").notNull(),
  published: integer("published").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [index("idx_customer_reviews_published_updated").on(table.published, table.updatedAt)]);

export const contactSettings = sqliteTable("contact_settings", {
  id: integer("id").primaryKey(),
  recipientEmail: text("recipient_email").notNull(),
  relayUrl: text("relay_url"),
  updatedAt: text("updated_at").notNull(),
  updatedBy: text("updated_by").notNull(),
});

export const contactSubmissionLimits = sqliteTable("contact_submission_limits", {
  ipHash: text("ip_hash").primaryKey(),
  submissions: integer("submissions").notNull(),
  windowStarted: integer("window_started").notNull(),
});

export const contactLeads = sqliteTable("contact_leads", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company").notNull().default(""),
  whatsapp: text("whatsapp").notNull().default(""),
  website: text("website").notNull().default(""),
  service: text("service").notNull(),
  plan: text("plan").notNull(),
  timeline: text("timeline").notNull().default(""),
  budget: text("budget").notNull().default(""),
  message: text("message").notNull(),
  status: text("status").notNull().default("New"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("idx_contact_leads_created_at").on(table.createdAt),
  index("idx_contact_leads_status_created_at").on(table.status, table.createdAt),
]);

export const contactLeadMetadata = sqliteTable("contact_lead_metadata", {
  leadId: text("lead_id").primaryKey(),
  leadType: text("lead_type").notNull().default("Prospect"),
  followUpAt: text("follow_up_at").notNull().default(""),
  updatedAt: text("updated_at").notNull(),
});

export const contactLeadNotes = sqliteTable("contact_lead_notes", {
  id: text("id").primaryKey(),
  leadId: text("lead_id").notNull(),
  note: text("note").notNull(),
  author: text("author").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("idx_contact_lead_notes_lead_created").on(table.leadId, table.createdAt)]);

export const contactLeadActivity = sqliteTable("contact_lead_activity", {
  id: text("id").primaryKey(),
  leadId: text("lead_id").notNull(),
  kind: text("kind").notNull(),
  detail: text("detail").notNull(),
  author: text("author").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("idx_contact_lead_activity_lead_created").on(table.leadId, table.createdAt)]);
