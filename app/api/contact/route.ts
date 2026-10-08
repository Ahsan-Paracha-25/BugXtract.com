import { env } from "cloudflare:workers";
import { sameOriginRequest } from "../../../lib/admin-auth";
import { getContactRecipient } from "../../../lib/contact-settings";

export const dynamic = "force-dynamic";

type Inquiry = {
  name?: unknown;
  email?: unknown;
  company?: unknown;
  whatsapp?: unknown;
  website?: unknown;
  service?: unknown;
  plan?: unknown;
  timeline?: unknown;
  budget?: unknown;
  message?: unknown;
  fax_number?: unknown;
};

const validText = (value: unknown, max: number, required = false): value is string =>
  typeof value === "string" && value.trim().length <= max && (!required || value.trim().length > 0);

function validEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

async function withinRateLimit(request: Request) {
  if (!env.DB) throw new Error("Contact form storage is unavailable.");
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip))))
    .map(value => value.toString(16).padStart(2, "0")).join("");
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare(
    "INSERT INTO contact_submission_limits (ip_hash, submissions, window_started) VALUES (?, 1, ?) ON CONFLICT(ip_hash) DO UPDATE SET submissions = CASE WHEN ? - window_started >= 600 THEN 1 ELSE submissions + 1 END, window_started = CASE WHEN ? - window_started >= 600 THEN ? ELSE window_started END RETURNING submissions"
  ).bind(hash, now, now, now, now).first<{ submissions: number }>();
  return Boolean(row && row.submissions <= 5);
}

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: "This request could not be verified. Refresh the page and try again." }, { status: 403 });

  let payload: Inquiry;
  try { payload = await request.json() as Inquiry; }
  catch { return Response.json({ error: "The form details could not be read. Please try again." }, { status: 400 }); }

  // Quietly accept the hidden honeypot so automated spam does not get a delivery signal.
  if (typeof payload.fax_number === "string" && payload.fax_number.trim()) return Response.json({ ok: true });

  if (!validText(payload.name, 100, true) || !validEmail(payload.email) ||
      !validText(payload.company, 150) || !validText(payload.whatsapp, 30) ||
      !validText(payload.website, 500) || !validText(payload.service, 120, true) ||
      !validText(payload.plan, 300, true) || !validText(payload.timeline, 40) ||
      !validText(payload.budget, 80) || !validText(payload.message, 5000, true)) {
    return Response.json({ error: "Please check your name, work email, service, package, and project details." }, { status: 400 });
  }
  if (payload.website.trim()) {
    try {
      const url = new URL(payload.website.trim());
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Invalid URL scheme");
    } catch { return Response.json({ error: "Enter a valid product or website URL, or leave that field blank." }, { status: 400 }); }
  }

  try {
    const recipient = await getContactRecipient();
    if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
      return Response.json({
        code: "provider_not_configured",
        recipientEmail: recipient,
        error: "Automatic email is not set up yet. Your email app can still send this inquiry manually.",
      }, { status: 503 });
    }
    if (!(await withinRateLimit(request))) return Response.json({ error: "Too many inquiries were sent from this connection. Please try again in a few minutes." }, { status: 429 });
    const rows: Array<[string, string]> = [
      ["Name", payload.name.trim()], ["Work email", payload.email.trim()], ["Company", payload.company.trim() || "Not specified"],
      ["WhatsApp number", payload.whatsapp.trim() || "Not specified"], ["Product / website URL", payload.website.trim() || "Not specified"],
      ["Testing service", payload.service.trim()], ["Preferred package and current price", payload.plan.trim()],
      ["Target release", payload.timeline.trim() || "Not specified"], ["Project budget", payload.budget.trim() || "Not specified"],
      ["Project details", payload.message.trim()],
    ];
    const text = ["BugXtract.com — New Project Inquiry", "", ...rows.flatMap(([label, value]) => [`${label}:`, value, ""])].join("\n");
    const subjectName = payload.name.trim().replace(/[\r\n\t]+/g, " ").slice(0, 80);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: `BugXtract.com <${env.RESEND_FROM_EMAIL}>`,
        to: [recipient],
        reply_to: payload.email.trim(),
        subject: `New project inquiry — ${subjectName}`,
        text,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      const diagnostic = await response.text().catch(() => "");
      console.error("Email provider rejected a project inquiry", response.status, diagnostic.slice(0, 1000));
      return Response.json({ error: "Your inquiry could not be emailed right now. Your details are still here—please try again shortly." }, { status: 502 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Could not deliver project inquiry", error);
    return Response.json({ error: "Your inquiry could not be emailed right now. Your details are still here—please try again shortly." }, { status: 503 });
  }
}
