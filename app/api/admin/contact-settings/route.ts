import { env } from "@/lib/runtime-env";
import { getAdminUsername, sameOriginRequest } from "../../../../lib/admin-auth";
import { DEFAULT_CONTACT_RECIPIENT, isValidEmail, isValidGmailRelayUrl } from "../../../../lib/contact-settings";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await getAdminUsername(request))) return Response.json({ error: "Please sign in to the admin panel." }, { status: 401 });
  try {
    if (!env.DB) throw new Error("Contact settings database is unavailable.");
    const row = await env.DB.prepare("SELECT recipient_email AS recipientEmail, relay_url AS relayUrl, updated_at AS updatedAt FROM contact_settings WHERE id = 1")
      .first<{ recipientEmail: string; relayUrl: string | null; updatedAt: string }>();
    const googleAppsScriptConfigured = Boolean(row?.relayUrl);
    return Response.json({
      recipientEmail: row?.recipientEmail || DEFAULT_CONTACT_RECIPIENT,
      relayUrl: row?.relayUrl || "",
      updatedAt: row?.updatedAt || null,
      senderConfigured: Boolean((env.RESEND_API_KEY && env.RESEND_FROM_EMAIL) || googleAppsScriptConfigured),
      deliveryProvider: env.RESEND_API_KEY && env.RESEND_FROM_EMAIL ? "Resend" : googleAppsScriptConfigured ? "Gmail" : null,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load contact email settings", error);
    return Response.json({ error: "Contact email settings could not be loaded." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  if (!(await getAdminUsername(request))) return Response.json({ error: "Please sign in to the admin panel." }, { status: 401 });
  if (!sameOriginRequest(request)) return Response.json({ error: "This request could not be verified." }, { status: 403 });
  const username = await getAdminUsername(request);
  let payload: unknown;
  try { payload = await request.json(); } catch { return Response.json({ error: "Check the receiving email and Gmail relay URL." }, { status: 400 }); }
  const email = payload && typeof payload === "object" ? (payload as { recipientEmail?: unknown }).recipientEmail : null;
  const relayUrl = payload && typeof payload === "object" ? (payload as { relayUrl?: unknown }).relayUrl : "";
  if (!isValidEmail(email)) return Response.json({ error: "Enter a valid receiving email address." }, { status: 400 });
  if (!isValidGmailRelayUrl(relayUrl)) return Response.json({ error: "Paste the Google Apps Script Web App URL ending in /exec." }, { status: 400 });

  try {
    if (!env.DB) throw new Error("Contact settings database is unavailable.");
    const now = new Date().toISOString();
    const normalizedRelayUrl = typeof relayUrl === "string" && relayUrl.trim() ? relayUrl.trim() : null;
    await env.DB.prepare("INSERT INTO contact_settings (id, recipient_email, relay_url, updated_at, updated_by) VALUES (1, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET recipient_email = excluded.recipient_email, relay_url = excluded.relay_url, updated_at = excluded.updated_at, updated_by = excluded.updated_by")
      .bind(email.trim(), normalizedRelayUrl, now, username || "admin").run();
    const usingResend = Boolean(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL);
    return Response.json({ ok: true, recipientEmail: email.trim(), relayUrl: normalizedRelayUrl || "", updatedAt: now, senderConfigured: usingResend || Boolean(normalizedRelayUrl), deliveryProvider: usingResend ? "Resend" : normalizedRelayUrl ? "Gmail" : null });
  } catch (error) {
    console.error("Could not save contact email settings", error);
    return Response.json({ error: "The receiving email could not be saved. Please try again." }, { status: 503 });
  }
}

