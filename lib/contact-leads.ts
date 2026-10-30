import { env } from "./runtime-env";
import { leadStatuses, type LeadStatus } from "./lead-status";

export { leadStatuses, type LeadStatus } from "./lead-status";

export type ContactLeadInput = {
  name: string;
  email: string;
  company: string;
  whatsapp: string;
  website: string;
  service: string;
  plan: string;
  timeline: string;
  budget: string;
  message: string;
};

export type ContactLead = ContactLeadInput & {
  id: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
};

let schemaPromise: Promise<void> | undefined;

/**
 * The live site uses either D1 or GoDaddy MySQL. Creating this small table on
 * first use keeps the feature safe to deploy without a manual database step.
 */
export async function ensureContactLeadStorage() {
  if (!env.DB) throw new Error("Lead storage is unavailable.");
  if (!schemaPromise) {
    schemaPromise = env.DB.prepare(`CREATE TABLE IF NOT EXISTS contact_leads (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(254) NOT NULL,
      company VARCHAR(150) NOT NULL DEFAULT '',
      whatsapp VARCHAR(30) NOT NULL DEFAULT '',
      website VARCHAR(500) NOT NULL DEFAULT '',
      service VARCHAR(120) NOT NULL,
      plan VARCHAR(300) NOT NULL,
      timeline VARCHAR(40) NOT NULL DEFAULT '',
      budget VARCHAR(80) NOT NULL DEFAULT '',
      message TEXT NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'New',
      created_at VARCHAR(40) NOT NULL,
      updated_at VARCHAR(40) NOT NULL
    )`).run().then(() => undefined).catch(error => {
      schemaPromise = undefined;
      throw error;
    });
  }
  await schemaPromise;
}

export async function createContactLead(input: ContactLeadInput) {
  await ensureContactLeadStorage();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB!.prepare(
    "INSERT INTO contact_leads (id, name, email, company, whatsapp, website, service, plan, timeline, budget, message, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    id, input.name, input.email, input.company, input.whatsapp, input.website,
    input.service, input.plan, input.timeline, input.budget, input.message, "New", now, now,
  ).run();
  return { id, createdAt: now };
}

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === "string" && (leadStatuses as readonly string[]).includes(value);
}
