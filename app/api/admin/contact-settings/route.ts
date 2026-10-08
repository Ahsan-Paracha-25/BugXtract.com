import { env } from "cloudflare:workers";
import { getAdminUsername, sameOriginRequest } from "../../../../lib/admin-auth";
import { DEFAULT_CONTACT_RECIPIENT, isValidEmail } from "../../../../lib/contact-settings";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await getAdminUsername(request))) return Response.json({ error: "Please sign in to the admin panel." }, { status: 401 });
  try {
    if (!env.DB) throw new Error("Contact settings database is unavailable.");
    const row = await env.DB.prepare("SELECT recipient_email AS recipientEmail, updated_at AS updatedAt FROM contact_settings WHERE id = 1")
      .first<{ recipientEmail: string; updatedAt: string }>();
    return Response.json({
      recipientEmail: row?.recipientEmail || DEFAULT_CONTACT_RECIPIENT,
      updatedAt: row?.updatedAt || null,
      senderConfigured: true,
      deliveryProvider: env.RESEND_API_KEY && env.RESEND_FROM_EMAIL ? "Resend" : "FormSubmit",
      activationStepRequired: !(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL),
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
  try { payload = await request.json(); } catch { return Response.json({ error: "Enter a valid receiving email address." }, { status: 400 }); }
  const email = payload && typeof payload === "object" ? (payload as { recipientEmail?: unknown }).recipientEmail : null;
  if (!isValidEmail(email)) return Response.json({ error: "Enter a valid receiving email address." }, { status: 400 });

  try {
    if (!env.DB) throw new Error("Contact settings database is unavailable.");
    const now = new Date().toISOString();
    await env.DB.prepare("INSERT INTO contact_settings (id, recipient_email, updated_at, updated_by) VALUES (1, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET recipient_email = excluded.recipient_email, updated_at = excluded.updated_at, updated_by = excluded.updated_by")
      .bind(email.trim(), now, username || "admin").run();
    return Response.json({ ok: true, recipientEmail: email.trim(), updatedAt: now, senderConfigured: true, deliveryProvider: env.RESEND_API_KEY && env.RESEND_FROM_EMAIL ? "Resend" : "FormSubmit", activationStepRequired: !(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL) });
  } catch (error) {
    console.error("Could not save contact email settings", error);
    return Response.json({ error: "The receiving email could not be saved. Please try again." }, { status: 503 });
  }
}
