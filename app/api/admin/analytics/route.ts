import { getAdminUsername, sameOriginRequest } from "../../../../lib/admin-auth";
import { ensureVisitorAnalyticsStorage } from "../../../../lib/visitor-analytics";
import { env } from "../../../../lib/runtime-env";

export const dynamic = "force-dynamic";

type CountRow = { label: string; views: number; visitors: number };
type DailyRow = { day: string; views: number; visitors: number };

export async function GET(request: Request) {
  if (!(await getAdminUsername(request))) return Response.json({ error: "Please sign in to the admin panel." }, { status: 401 });
  try {
    await ensureVisitorAnalyticsStorage();
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const since = new Date(now.getTime() - 29 * 86400000).toISOString().slice(0, 10);
    const [todayRows, monthRows, countries, pages, sources, devices, themes, daily, settings] = await Promise.all([
      env.DB!.prepare("SELECT COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors FROM visitor_events WHERE activity_date = ?").bind(today).first<{ views: number; visitors: number }>(),
      env.DB!.prepare("SELECT COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors FROM visitor_events WHERE activity_date >= ?").bind(since).first<{ views: number; visitors: number }>(),
      env.DB!.prepare("SELECT country_code AS label, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors FROM visitor_events WHERE activity_date >= ? GROUP BY country_code ORDER BY visitors DESC, views DESC LIMIT 12").bind(since).all<CountRow>(),
      env.DB!.prepare("SELECT page_path AS label, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors FROM visitor_events WHERE activity_date >= ? GROUP BY page_path ORDER BY views DESC LIMIT 12").bind(since).all<CountRow>(),
      env.DB!.prepare("SELECT traffic_source AS label, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors FROM visitor_events WHERE activity_date >= ? GROUP BY traffic_source ORDER BY visitors DESC, views DESC LIMIT 12").bind(since).all<CountRow>(),
      env.DB!.prepare("SELECT device_type AS label, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors FROM visitor_events WHERE activity_date >= ? GROUP BY device_type ORDER BY visitors DESC").bind(since).all<CountRow>(),
      env.DB!.prepare("SELECT color_theme AS label, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors FROM visitor_events WHERE activity_date >= ? GROUP BY color_theme ORDER BY visitors DESC").bind(since).all<CountRow>(),
      env.DB!.prepare("SELECT activity_date AS day, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors FROM visitor_events WHERE activity_date >= ? GROUP BY activity_date ORDER BY activity_date ASC").bind(since).all<DailyRow>(),
      env.DB!.prepare("SELECT public_metrics_enabled AS publicMetricsEnabled FROM visitor_analytics_settings WHERE id = ?").bind("public-visitor-metrics").first<{ publicMetricsEnabled: number }>(),
    ]);
    return Response.json({
      today: todayRows ?? { views: 0, visitors: 0 }, month: monthRows ?? { views: 0, visitors: 0 },
      countries: countries.results, pages: pages.results, sources: sources.results, devices: devices.results, themes: themes.results, daily: daily.results,
      publicMetricsEnabled: Boolean(Number(settings?.publicMetricsEnabled ?? 0)),
      privacy: "Anonymous aggregate analytics only. No names, emails, or raw IP addresses are recorded.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load visitor analytics", error);
    return Response.json({ error: "Visitor analytics could not be loaded. Please try again." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  if (!(await getAdminUsername(request))) return Response.json({ error: "Please sign in to the admin panel." }, { status: 401 });
  if (!sameOriginRequest(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const payload = await request.json() as { publicMetricsEnabled?: unknown };
    if (typeof payload.publicMetricsEnabled !== "boolean") return Response.json({ error: "Choose whether public visitor metrics are visible." }, { status: 400 });
    await ensureVisitorAnalyticsStorage();
    const id = "public-visitor-metrics";
    await env.DB!.prepare("DELETE FROM visitor_analytics_settings WHERE id = ?").bind(id).run();
    await env.DB!.prepare("INSERT INTO visitor_analytics_settings (id, public_metrics_enabled, updated_at) VALUES (?, ?, ?)").bind(id, payload.publicMetricsEnabled ? 1 : 0, new Date().toISOString()).run();
    return Response.json({ ok: true, publicMetricsEnabled: payload.publicMetricsEnabled });
  } catch (error) {
    console.error("Could not update public visitor analytics setting", error);
    return Response.json({ error: "The public visitor metric setting could not be updated. Please try again." }, { status: 503 });
  }
}
