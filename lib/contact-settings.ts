export const DEFAULT_CONTACT_RECIPIENT = "hello@bugxtract.com";

export async function getContactSettings() {
  // The public contact inbox is fixed to the GoDaddy mailbox. Delivery credentials
  // are configured separately as server secrets and are never editable in admin.
  return { recipientEmail: DEFAULT_CONTACT_RECIPIENT, relayUrl: null };
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

