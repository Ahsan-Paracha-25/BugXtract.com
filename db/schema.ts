import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sitePricing = sqliteTable("site_pricing", {
  id: integer("id").primaryKey(),
  content: text("content").notNull(),
  updatedAt: text("updated_at").notNull(),
  updatedBy: text("updated_by").notNull(),
});
