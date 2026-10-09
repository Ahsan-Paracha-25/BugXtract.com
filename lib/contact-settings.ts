import { env } from "./runtime-env";

export const DEFAULT_CONTACT_RECIPIENT = "sqae001@gmail.com";

export async function getContactSettings() {
  if (!env.DB) throw new Error("Contact settings database is unavailable.");
  const row = await env.DB.prepare("SELECT recipient_email AS recipientEmail, relay_url AS relayUrl FROM contact_settings WHERE id = 1")
    .first<{ recipientEmail: string; relayUrl: string | null }>();
  return { recipientEmail: row?.recipientEmail || DEFAULT_CONTACT_RECIPIENT, relayUrl: row?.relayUrl || null };
}

export function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidGmailRelayUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 500) return false;
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && url.hostname === "script.google.com" &&
      /^\/macros\/s\/[A-Za-z0-9_-]+\/exec\/?$/.test(url.pathname) && !url.search && !url.hash;
  } catch { return false; }
}

