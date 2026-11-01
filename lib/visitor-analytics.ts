import { env } from "./runtime-env";

export type VisitorEvent = {
  visitorId: string;
  path: string;
  source: string;
  device: "Desktop" | "Mobile" | "Tablet" | "Other";
  theme: "Light" | "Dark";
};

export type VisitorPresence = Pick<VisitorEvent, "visitorId" | "path" | "device" | "theme">;
export type VisitorSectionActivity = VisitorPresence & { sectionId: string; sectionLabel: string; seconds: number };

let schemaPromise: Promise<void> | undefined;

/** Stores anonymous, aggregate-ready events only; no IP address or contact data. */
export async function ensureVisitorAnalyticsStorage() {
  if (!env.DB) throw new Error("Visitor analytics storage is unavailable.");
  if (!schemaPromise) {
    schemaPromise = Promise.all([
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS visitor_events (
        id VARCHAR(64) PRIMARY KEY,
        visitor_id VARCHAR(64) NOT NULL,
        visited_at VARCHAR(40) NOT NULL,
        activity_date VARCHAR(10) NOT NULL,
        country_code VARCHAR(8) NOT NULL DEFAULT 'XX',
        page_path VARCHAR(240) NOT NULL,
        traffic_source VARCHAR(160) NOT NULL DEFAULT 'Direct',
        device_type VARCHAR(16) NOT NULL DEFAULT 'Other',
        color_theme VARCHAR(16) NOT NULL DEFAULT 'Light'
      )`).run(),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS visitor_analytics_settings (
        id VARCHAR(32) PRIMARY KEY,
        public_metrics_enabled TINYINT NOT NULL DEFAULT 0,
        updated_at VARCHAR(40) NOT NULL
      )`).run(),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS visitor_presence (
        visitor_id VARCHAR(64) PRIMARY KEY,
        last_seen VARCHAR(40) NOT NULL,
        country_code VARCHAR(8) NOT NULL DEFAULT 'XX',
        current_path VARCHAR(240) NOT NULL,
        device_type VARCHAR(16) NOT NULL DEFAULT 'Other',
        color_theme VARCHAR(16) NOT NULL DEFAULT 'Light'
      )`).run(),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS visitor_section_presence (
        visitor_id VARCHAR(64) PRIMARY KEY,
        last_seen VARCHAR(40) NOT NULL,
        page_path VARCHAR(240) NOT NULL,
        section_id VARCHAR(64) NOT NULL,
        section_label VARCHAR(100) NOT NULL,
        device_type VARCHAR(16) NOT NULL DEFAULT 'Other'
      )`).run(),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS visitor_section_activity (
        id VARCHAR(64) PRIMARY KEY,
        visitor_id VARCHAR(64) NOT NULL,
        recorded_at VARCHAR(40) NOT NULL,
        activity_date VARCHAR(10) NOT NULL,
        page_path VARCHAR(240) NOT NULL,
        section_id VARCHAR(64) NOT NULL,
        section_label VARCHAR(100) NOT NULL,
        engaged_seconds INTEGER NOT NULL DEFAULT 0
      )`).run(),
    ]).then(() => undefined).catch(error => { schemaPromise = undefined; throw error; });
  }
  await schemaPromise;
}

export function countryCodeFor(request: Request) {
  const country = (request.headers.get("cf-ipcountry") || request.headers.get("x-vercel-ip-country") || "XX").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(country) ? country : "XX";
}

export async function recordVisitorEvent(event: VisitorEvent, request: Request) {
  await ensureVisitorAnalyticsStorage();
  const now = new Date();
  await env.DB!.prepare("INSERT INTO visitor_events (id, visitor_id, visited_at, activity_date, country_code, page_path, traffic_source, device_type, color_theme) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), event.visitorId, now.toISOString(), now.toISOString().slice(0, 10), countryCodeFor(request), event.path, event.source, event.device, event.theme).run();
}

/** Keeps a short-lived, anonymous presence record for the private live dashboard. */
export async function recordVisitorPresence(presence: VisitorPresence, request: Request) {
  await ensureVisitorAnalyticsStorage();
  const now = new Date().toISOString();
  await env.DB!.prepare("DELETE FROM visitor_presence WHERE visitor_id = ?").bind(presence.visitorId).run();
  await env.DB!.prepare("INSERT INTO visitor_presence (visitor_id, last_seen, country_code, current_path, device_type, color_theme) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(presence.visitorId, now, countryCodeFor(request), presence.path, presence.device, presence.theme).run();
}

/** Records visible sections as anonymous, coarse 30-second engagement intervals. */
export async function recordVisitorSectionActivity(activity: VisitorSectionActivity) {
  await ensureVisitorAnalyticsStorage();
  const now = new Date();
  await env.DB!.prepare("DELETE FROM visitor_section_presence WHERE visitor_id = ?").bind(activity.visitorId).run();
  await env.DB!.prepare("INSERT INTO visitor_section_presence (visitor_id, last_seen, page_path, section_id, section_label, device_type) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(activity.visitorId, now.toISOString(), activity.path, activity.sectionId, activity.sectionLabel, activity.device).run();
  if (activity.seconds > 0) {
    await env.DB!.prepare("INSERT INTO visitor_section_activity (id, visitor_id, recorded_at, activity_date, page_path, section_id, section_label, engaged_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), activity.visitorId, now.toISOString(), now.toISOString().slice(0, 10), activity.path, activity.sectionId, activity.sectionLabel, activity.seconds).run();
  }
}
