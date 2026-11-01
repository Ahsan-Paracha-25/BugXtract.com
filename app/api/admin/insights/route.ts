import { getAdminUsername } from "../../../../lib/admin-auth";
import { ensureContactLeadStorage, leadStatuses } from "../../../../lib/contact-leads";
import { env } from "../../../../lib/runtime-env";

export const dynamic = "force-dynamic";

function pakistanDate(date: Date) {
  const values = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const part = (type: string) => values.find(item => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export async function GET(request: Request) {
  if (!(await getAdminUsername(request))) return Response.json({ error: "Please sign in to the admin panel." }, { status: 401 });
  try {
    await ensureContactLeadStorage();
    const { results } = await env.DB!.prepare("SELECT l.status, l.created_at AS createdAt, COALESCE(m.lead_type, 'Prospect') AS leadType, COALESCE(m.follow_up_at, '') AS followUpAt, COALESCE(p.engagement_status, '') AS engagementStatus FROM contact_leads l LEFT JOIN contact_lead_metadata m ON m.lead_id = l.id LEFT JOIN customer_profiles p ON p.lead_id = l.id").all<{ status: string; createdAt: string; leadType: string; followUpAt: string; engagementStatus: string }>();
    const now = new Date(); const today = pakistanDate(now); const monthAgo = new Date(now.getTime() - 30 * 86400000);
    const byStatus = Object.fromEntries(leadStatuses.map(status => [status, results.filter(item => item.status === status).length]));
    const customers = results.filter(item => item.leadType !== "Prospect"); const activeCustomers = customers.filter(item => item.engagementStatus !== "Paused" && item.engagementStatus !== "Completed").length;
    return Response.json({ totalLeads: results.length, newLast30Days: results.filter(item => new Date(item.createdAt) >= monthAgo).length, wonLeads: byStatus.Won || 0, conversionRate: results.length ? Math.round(((byStatus.Won || 0) / results.length) * 100) : 0, activeCustomers, activeRetainers: results.filter(item => item.leadType === "Retainer Customer" && item.engagementStatus !== "Paused" && item.engagementStatus !== "Completed").length, followUpsDue: results.filter(item => item.followUpAt && item.followUpAt.slice(0, 10) <= today).length, byStatus }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { console.error("Could not load insights", error); return Response.json({ error: "Insights could not be loaded. Please try again." }, { status: 503 }); }
}
