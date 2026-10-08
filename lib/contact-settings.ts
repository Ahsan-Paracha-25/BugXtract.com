import { env } from "cloudflare:workers";

export const DEFAULT_CONTACT_RECIPIENT = "sqae001@gmail.com";

export async function getContactRecipient() {
  if (!env.DB) throw new Error("Contact settings database is unavailable.");
  const row = await env.DB.prepare("SELECT recipient_email AS recipientEmail FROM contact_settings WHERE id = 1")
    .first<{ recipientEmail: string }>();
  return row?.recipientEmail || DEFAULT_CONTACT_RECIPIENT;
}

export function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
