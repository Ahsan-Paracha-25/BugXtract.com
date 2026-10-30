import { env } from "./runtime-env";
import { leadStatuses, leadTypes, type LeadStatus, type LeadType } from "./lead-status";

export { leadStatuses, leadTypes, type LeadStatus, type LeadType } from "./lead-status";

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
  leadType: LeadType;
  followUpAt: string;
  createdAt: string;
  updatedAt: string;
};

export type LeadNote = { id: string; leadId: string; note: string; author: string; createdAt: string };
export type LeadActivity = { id: string; leadId: string; kind: string; detail: string; author: string; createdAt: string };

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
    )`).run().then(async () => {
      await env.DB!.prepare(`CREATE TABLE IF NOT EXISTS contact_lead_metadata (
        lead_id VARCHAR(64) PRIMARY KEY,
        lead_type VARCHAR(32) NOT NULL DEFAULT 'Prospect',
        follow_up_at VARCHAR(40) NOT NULL DEFAULT '',
        updated_at VARCHAR(40) NOT NULL
      )`).run();
      await env.DB!.prepare(`CREATE TABLE IF NOT EXISTS contact_lead_notes (
        id VARCHAR(64) PRIMARY KEY,
        lead_id VARCHAR(64) NOT NULL,
        note TEXT NOT NULL,
        author VARCHAR(100) NOT NULL,
        created_at VARCHAR(40) NOT NULL
      )`).run();
      await env.DB!.prepare(`CREATE TABLE IF NOT EXISTS contact_lead_activity (
        id VARCHAR(64) PRIMARY KEY,
        lead_id VARCHAR(64) NOT NULL,
        kind VARCHAR(48) NOT NULL,
        detail VARCHAR(500) NOT NULL,
        author VARCHAR(100) NOT NULL,
        created_at VARCHAR(40) NOT NULL
      )`).run();
    }).then(() => undefined).catch(error => {
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
  await env.DB!.prepare("INSERT INTO contact_lead_metadata (lead_id, lead_type, follow_up_at, updated_at) VALUES (?, ?, ?, ?)")
    .bind(id, "Prospect", "", now).run();
  await addLeadActivity(id, "inquiry_received", "Contact form inquiry received", "System", now);
  return { id, createdAt: now };
}

export async function addLeadActivity(leadId: string, kind: string, detail: string, author: string, createdAt = new Date().toISOString()) {
  await ensureContactLeadStorage();
  await env.DB!.prepare("INSERT INTO contact_lead_activity (id, lead_id, kind, detail, author, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), leadId, kind, detail.slice(0, 500), author.slice(0, 100), createdAt).run();
}

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === "string" && (leadStatuses as readonly string[]).includes(value);
}

export function isLeadType(value: unknown): value is LeadType {
  return typeof value === "string" && (leadTypes as readonly string[]).includes(value);
}
