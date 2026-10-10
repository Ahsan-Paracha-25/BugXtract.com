import { env } from "@/lib/runtime-env";
import { defaultPricing, defaultTrustMetrics } from "../../../lib/pricing-defaults";
import { getAdminUsername, sameOriginRequest } from "../../../lib/admin-auth";

function validContent(value: unknown): value is typeof defaultPricing {
  if (!value || typeof value !== "object") return false;
  const content = value as { plans?: unknown; retainers?: unknown; trustMetrics?: unknown };
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
  const safeText = (v: unknown) => typeof v === "string" && v.length <= 500;
  return content.plans.every((plan: any) =>
    plan && [plan.id, plan.name, plan.price, plan.billing, plan.audience, plan.hours, plan.description].every(safeText) &&
    (plan.originalPrice === undefined || safeText(plan.originalPrice)) &&
    typeof plan.popular === "boolean" && Array.isArray(plan.features) && plan.features.length <= 20 && plan.features.every(safeText)
  ) && content.retainers.every((retainer: any) =>
    retainer && [retainer.id, retainer.name, retainer.hours, retainer.price, retainer.description].every(safeText)
  );
}

async function getStoredContent() {
  if (!env.DB) throw new Error("Pricing storage is not configured.");
  const row = await env.DB.prepare("SELECT content FROM site_pricing WHERE id = 1").first<{ content: string }>();
  if (!row) return defaultPricing;
  try {
    const content = JSON.parse(row.content);
    return { ...content, trustMetrics: Array.isArray(content.trustMetrics) ? content.trustMetrics : defaultTrustMetrics };
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
    await env.DB.prepare("INSERT INTO site_pricing (id, content, updated_at, updated_by) VALUES (1, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at, updated_by = excluded.updated_by")
      .bind(JSON.stringify(payload), new Date().toISOString(), username).run();
    return Response.json({ ok: true, savedAt: new Date().toISOString() });
  } catch {
    return Response.json({ error: "Could not save yet. Please try again." }, { status: 503 });
  }
}

