import { env } from "@/lib/runtime-env";
import { sameOriginRequest } from "../../../lib/admin-auth";
import { getContactSettings } from "../../../lib/contact-settings";
import { createContactLead } from "../../../lib/contact-leads";

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
  contact_consent?: unknown;
  form_started_at?: unknown;
  source?: unknown;
};

const validText = (value: unknown, max: number, required = false): value is string =>
  typeof value === "string" && value.trim().length <= max && (!required || value.trim().length > 0);

function validEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function validPhone(value: unknown): value is string {
  return typeof value === "string" && value.length <= 30 && (!value.trim() || (/^[+()\-\s\d]{7,30}$/.test(value.trim()) && /\d/.test(value)));
}

async function withinRateLimit(request: Request) {
  if (!env.DB) throw new Error("Contact form storage is unavailable.");
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip))))
    .map(value => value.toString(16).padStart(2, "0")).join("");
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    "INSERT INTO contact_submission_limits (ip_hash, submissions, window_started) VALUES (?, 1, ?) ON DUPLICATE KEY UPDATE submissions = CASE WHEN ? - window_started >= 600 THEN 1 ELSE submissions + 1 END, window_started = CASE WHEN ? - window_started >= 600 THEN ? ELSE window_started END"
  ).bind(hash, now, now, now, now).run();
  const row = await env.DB.prepare(
    "SELECT submissions FROM contact_submission_limits WHERE ip_hash = ?"
  ).bind(hash).first<{ submissions: number }>();
  return Boolean(row && row.submissions <= 5);
}

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: "This request could not be verified. Refresh the page and try again." }, { status: 403 });

  let payload: Inquiry;
  try { payload = await request.json() as Inquiry; }
  catch { return Response.json({ error: "The form details could not be read. Please try again." }, { status: 400 }); }

  // Quietly accept the hidden honeypot so automated spam does not get a delivery signal.
  if (typeof payload.fax_number === "string" && payload.fax_number.trim()) return Response.json({ ok: true });
  const startedAt = typeof payload.form_started_at === "string" ? Number(payload.form_started_at) : 0;
  if (Number.isFinite(startedAt) && startedAt > 0 && Date.now() - startedAt < 1200) {
    return Response.json({ error: "Please take a moment to review your inquiry before sending." }, { status: 429 });
  }

  if (!validText(payload.name, 100, true) || !validEmail(payload.email) ||
      !validText(payload.company, 150) || !validPhone(payload.whatsapp) ||
      !validText(payload.website, 500) || !validText(payload.service, 120, true) ||
      !validText(payload.plan, 300, true) || !validText(payload.timeline, 40) ||
      !validText(payload.budget, 80) || !validText(payload.message, 5000, true) || payload.message.trim().length < 25 ||
      payload.contact_consent !== true || !(payload.source === undefined || validText(payload.source, 200))) {
    return Response.json({ error: "Please check your name, work email, service, package, and project details." }, { status: 400 });
  }
  if (payload.website.trim()) {
    try {
      const url = new URL(payload.website.trim());
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Invalid URL scheme");
    } catch { return Response.json({ error: "Enter a valid product or website URL, or leave that field blank." }, { status: 400 }); }
  }

  try {
    const { recipientEmail: recipient, relayUrl } = await getContactSettings();
    const smtpEnv = typeof process !== "undefined" ? process.env : undefined;
    const bridgedEnv = (globalThis as typeof globalThis & { __BUGXTRACT_ENV__?: Record<string, string | undefined> }).__BUGXTRACT_ENV__;
    const resendApiKey = env.BUGXTRACT_EMAIL_API_KEY || bridgedEnv?.BUGXTRACT_EMAIL_API_KEY || smtpEnv?.BUGXTRACT_EMAIL_API_KEY || smtpEnv?.RESEND_API_KEY;
    const resendFromEmail = env.RESEND_FROM_EMAIL || bridgedEnv?.RESEND_FROM_EMAIL || smtpEnv?.RESEND_FROM_EMAIL;
    const usingResend = Boolean(resendApiKey && resendFromEmail);
    const smtpUser = smtpEnv?.SMTP_USER?.trim();
    const smtpPassword = smtpEnv?.SMTP_PASSWORD;
    const usingSmtp = Boolean(smtpUser && smtpPassword);
    if (!usingResend && !relayUrl && !usingSmtp) {
      return Response.json({
        code: "provider_not_configured",
        recipientEmail: recipient,
        error: "The GoDaddy email delivery connection has not been completed yet. Please add the SMTP secrets in your hosting settings.",
      }, { status: 503 });
    }
    if (!(await withinRateLimit(request))) return Response.json({ error: "Too many inquiries were sent from this connection. Please try again in a few minutes." }, { status: 429 });
    // Save before sending the email so a temporary email-provider outage never loses a valid inquiry.
    await createContactLead({
      name: payload.name.trim(), email: payload.email.trim(), company: payload.company.trim(), whatsapp: payload.whatsapp.trim(),
      website: payload.website.trim(), service: payload.service.trim(), plan: payload.plan.trim(), timeline: payload.timeline.trim(),
      budget: payload.budget.trim(), message: payload.message.trim(), source: typeof payload.source === "string" ? payload.source.trim() : "Unattributed",
    });
    const rows: Array<[string, string]> = [
      ["Name", payload.name.trim()], ["Work email", payload.email.trim()], ["Company", payload.company.trim() || "Not specified"],
      ["WhatsApp number", payload.whatsapp.trim() || "Not specified"], ["Product / website URL", payload.website.trim() || "Not specified"],
      ["Testing service", payload.service.trim()], ["Preferred package and current price", payload.plan.trim()],
      ["Target release", payload.timeline.trim() || "Not specified"], ["Project budget", payload.budget.trim() || "Not specified"], ["Inquiry source", typeof payload.source === "string" ? payload.source.trim() || "Unattributed" : "Unattributed"],
      ["Project details", payload.message.trim()],
    ];
    const text = ["BugXtract.com — New Project Inquiry", "", ...rows.flatMap(([label, value]) => [`${label}:`, value, ""])].join("\n");
    const subjectName = payload.name.trim().replace(/[\r\n\t]+/g, " ").slice(0, 80);
    if (!usingResend && usingSmtp) {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.default.createTransport({
        host: smtpEnv?.SMTP_HOST || "smtpout.secureserver.net",
        port: Number(smtpEnv?.SMTP_PORT || "465"),
        secure: (smtpEnv?.SMTP_SECURE || "true").toLowerCase() !== "false",
        auth: { user: smtpUser, pass: smtpPassword },
      });
      await transporter.sendMail({
        from: `BugXtract.com <${smtpUser}>`,
        to: recipient,
        replyTo: payload.email.trim(),
        subject: `BugXtract.com — New project inquiry from ${subjectName}`,
        text,
      });
      let confirmationSent = false;
      try {
        await transporter.sendMail({
          from: `BugXtract.com <${smtpUser}>`,
          to: payload.email.trim(),
          subject: "We received your BugXtract QA inquiry",
          text: `Hi ${payload.name.trim()},\n\nThanks for contacting BugXtract. We received your project inquiry and usually reply within one business day.\n\nRegards,\nBugXtract.com`,
        });
        confirmationSent = true;
      } catch (confirmationError) { console.error("Could not send inquiry confirmation", confirmationError); }
      return Response.json({ ok: true, confirmationSent });
    }
    const response = usingResend
      ? await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
          body: JSON.stringify({
            from: `BugXtract.com <${resendFromEmail}>`,
            to: [recipient],
            reply_to: payload.email.trim(),
            subject: `New project inquiry — ${subjectName}`,
            text,
          }),
          signal: AbortSignal.timeout(15000),
        })
      : await fetch(relayUrl!, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            to: recipient,
            replyTo: payload.email.trim(),
            subject: `BugXtract.com — New project inquiry from ${subjectName}`,
            text,
          }),
          signal: AbortSignal.timeout(25000),
        });
    if (!response.ok) {
      const diagnostic = await response.text().catch(() => "");
      console.error("Email provider rejected a project inquiry", response.status, diagnostic.slice(0, 1000));
      return Response.json({ error: "Your inquiry could not be emailed right now. Your details are still here—please try again shortly." }, { status: 502 });
    }
    if (relayUrl && !usingResend) {
      const result = await response.json().catch(() => null) as { ok?: boolean; message?: string } | null;
      if (result?.ok !== true) {
        console.error("Gmail relay did not confirm a project inquiry", result?.message || "Unexpected response");
        return Response.json({ error: "Your inquiry could not be emailed right now. Please try again shortly." }, { status: 502 });
      }
    }
    let confirmationSent = false;
    if (usingResend) {
      try {
        const confirmation = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
          body: JSON.stringify({
            from: `BugXtract.com <${resendFromEmail}>`,
            to: [payload.email.trim()],
            subject: "We received your BugXtract QA inquiry",
            text: `Hi ${payload.name.trim()},\n\nThanks for contacting BugXtract. We received your project inquiry and usually reply within one business day.\n\nRegards,\nBugXtract.com`,
          }),
          signal: AbortSignal.timeout(15000),
        });
        confirmationSent = confirmation.ok;
        if (!confirmation.ok) console.error("Inquiry confirmation was not accepted by email provider", confirmation.status);
      } catch (confirmationError) { console.error("Could not send inquiry confirmation", confirmationError); }
    }
    return Response.json({ ok: true, confirmationSent });
  } catch (error) {
    console.error("Could not deliver project inquiry", error);
    return Response.json({ error: "Your inquiry could not be emailed right now. Your details are still here—please try again shortly." }, { status: 503 });
  }
}

