import { env } from "@/lib/runtime-env";
import { defaultFounderProfile, defaultPricing, defaultTrustMetrics } from "../../../lib/pricing-defaults";
import { getAdminUsername, sameOriginRequest } from "../../../lib/admin-auth";

function validContent(value: unknown): value is typeof defaultPricing {
  if (!value || typeof value !== "object") return false;
  const content = value as { plans?: unknown; retainers?: unknown; trustMetrics?: unknown; founderProfile?: unknown };
  if (!Array.isArray(content.plans) || !Array.isArray(content.retainers)) return false;
  if (content.plans.length > 12 || content.retainers.length > 12) return false;
  if (content.trustMetrics !== undefined) {
    if (!Array.isArray(content.trustMetrics) || content.trustMetrics.length > 8) return false;
    const metrics = content.trustMetrics as Array<Record<string, unknown>>;
    if (new Set(metrics.map(metric => metric?.id)).size !== metrics.length) return false;
    if (!metrics.every(metric => metric && typeof metric.id === "string" && metric.id.length > 0 && metric.id.length <= 80 &&
      typeof metric.value === "string" && metric.value.length > 0 && metric.value.length <= 24 &&
      typeof metric.label === "string" && metric.label.length > 0 && metric.label.length <= 80 &&
      ["users", "document", "stars", "lightning"].includes(String(metric.icon)) && typeof metric.visible === "boolean")) return false;
  }
  if (content.founderProfile !== undefined) {
    const founder = content.founderProfile as Record<string, unknown>;
    const safeFounderText = (field: unknown, max: number) => typeof field === "string" && field.length <= max;
    if (!founder || typeof founder.visible !== "boolean" || typeof founder.homepageVisible !== "boolean" ||
      !safeFounderText(founder.name, 120) || !safeFounderText(founder.role, 140) || !safeFounderText(founder.imageUrl, 1000) ||
      !safeFounderText(founder.introduction, 240) || !safeFounderText(founder.message, 1800) ||
      !safeFounderText(founder.focusOne, 120) || !safeFounderText(founder.focusTwo, 120) || !safeFounderText(founder.focusThree, 120) ||
      !safeFounderText(founder.ctaLabel, 80) || !safeFounderText(founder.ctaUrl, 500) ||
      !safeFounderText(founder.signatureName, 120) || !safeFounderText(founder.signatureRole, 140) || !safeFounderText(founder.linkedInUrl, 1000) ||
      !safeFounderText(founder.homepageTitle, 180) || !safeFounderText(founder.homepageMessage, 500) ||
      !safeFounderText(founder.quote, 500) || !safeFounderText(founder.quoteAttribution, 180) ||
      !safeFounderText(founder.proofOne, 160) || !safeFounderText(founder.proofTwo, 160) || !safeFounderText(founder.proofThree, 160) ||
      !safeFounderText(founder.videoUrl, 1000)) return false;
    if (founder.imageUrl && !/^(?:https:\/\/|\/api\/founder\/images\/founder-[0-9a-f-]{36}\.(?:jpe?g|png|webp))$/i.test(String(founder.imageUrl))) return false;
    if (founder.ctaUrl && !/^(?:\/|https:\/\/)/i.test(String(founder.ctaUrl))) return false;
    if (founder.linkedInUrl && !/^https:\/\/www\.linkedin\.com\//i.test(String(founder.linkedInUrl))) return false;
    if (founder.videoUrl && !/^https:\/\//i.test(String(founder.videoUrl))) return false;
  }
  const safeText = (v: unknown) => typeof v === "string" && v.length <= 500;
  return content.plans.every((plan: unknown) => {
    const item = plan as Record<string, unknown> | null;
    return item && [item.id, item.name, item.price, item.billing, item.audience, item.hours, item.description].every(safeText) &&
      (item.originalPrice === undefined || safeText(item.originalPrice)) &&
      typeof item.popular === "boolean" && Array.isArray(item.features) && item.features.length <= 20 && item.features.every(safeText);
  }
  ) && content.retainers.every((retainer: unknown) => {
    const item = retainer as Record<string, unknown> | null;
    return item && [item.id, item.name, item.hours, item.price, item.description].every(safeText);
  });
}

async function getStoredContent() {
  if (!env.DB) throw new Error("Pricing storage is not configured.");
  const row = await env.DB.prepare("SELECT content FROM site_pricing WHERE id = 1").first<{ content: string }>();
  if (!row) return defaultPricing;
  try {
    const content = JSON.parse(row.content);
    return { ...content, trustMetrics: Array.isArray(content.trustMetrics) ? content.trustMetrics : defaultTrustMetrics, founderProfile: { ...defaultFounderProfile, ...(content.founderProfile as Record<string, unknown> | undefined) } };
  } catch { return defaultPricing; }
}

export async function GET() {
  try {
    return Response.json(await getStoredContent(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Pricing storage is temporarily unavailable." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const username = await getAdminUsername(request);
  if (!username) return Response.json({ error: "Please sign in to the admin panel." }, { status: 401 });
  if (!sameOriginRequest(request)) return Response.json({ error: "This request could not be verified." }, { status: 403 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }); }
  if (!validContent(payload)) return Response.json({ error: "Check the plan fields and try again." }, { status: 400 });
  try {
    if (!env.DB) throw new Error("Pricing storage is not configured.");
    const savedAt = new Date().toISOString();
    const existing = await env.DB.prepare("SELECT id FROM site_pricing WHERE id = 1").first<{ id: number }>();
    if (existing) {
      await env.DB.prepare("UPDATE site_pricing SET content = ?, updated_at = ?, updated_by = ? WHERE id = 1")
        .bind(JSON.stringify(payload), savedAt, username).run();
    } else {
      await env.DB.prepare("INSERT INTO site_pricing (id, content, updated_at, updated_by) VALUES (1, ?, ?, ?)")
        .bind(JSON.stringify(payload), savedAt, username).run();
    }
    return Response.json({ ok: true, savedAt });
  } catch {
    return Response.json({ error: "Could not save yet. Please try again." }, { status: 503 });
  }
}

