import { ensureVisitorAnalyticsStorage } from "../../../../lib/visitor-analytics";
import { env } from "../../../../lib/runtime-env";

export const dynamic = "force-dynamic";

const settingId = "public-visitor-metrics";

/** Deliberately exposes only opt-in, anonymous 30-day totals. */
export async function GET() {
  try {
    await ensureVisitorAnalyticsStorage();
    const setting = await env.DB!.prepare("SELECT public_metrics_enabled AS enabled FROM visitor_analytics_settings WHERE id = ?").bind(settingId).first<{ enabled: number }>();
    if (!Number(setting?.enabled)) return Response.json({ enabled: false }, { headers: { "Cache-Control": "no-store" } });

    const since = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
    const [visitorTotals, countryTotals] = await Promise.all([
      env.DB!.prepare("SELECT COUNT(DISTINCT visitor_id) AS visitors FROM visitor_events WHERE activity_date >= ?").bind(since).first<{ visitors: number }>(),
      env.DB!.prepare("SELECT COUNT(DISTINCT country_code) AS countries FROM visitor_events WHERE activity_date >= ? AND country_code <> ?").bind(since, "XX").first<{ countries: number }>(),
    ]);
    return Response.json({ enabled: true, visitors: Number(visitorTotals?.visitors ?? 0), countries: Number(countryTotals?.countries ?? 0) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load public visitor reach", error);
    return Response.json({ enabled: false }, { headers: { "Cache-Control": "no-store" } });
  }
}
