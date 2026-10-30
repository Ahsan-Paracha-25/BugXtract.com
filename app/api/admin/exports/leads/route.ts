import { getAdminUsername } from "../../../../../lib/admin-auth";
import { ensureContactLeadStorage } from "../../../../../lib/contact-leads";
import { env } from "../../../../../lib/runtime-env";
export const dynamic = "force-dynamic";
const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
export async function GET(request: Request) {
  if (!(await getAdminUsername(request))) return Response.json({ error: "Please sign in to the admin panel." }, { status: 401 });
  try { await ensureContactLeadStorage(); const { results } = await env.DB!.prepare("SELECT l.name, l.email, l.company, l.whatsapp, l.website, l.service, l.plan, l.timeline, l.budget, l.message, l.status, COALESCE(m.lead_type, 'Prospect') AS customerType, COALESCE(m.follow_up_at, '') AS followUpAt, l.created_at AS receivedAt FROM contact_leads l LEFT JOIN contact_lead_metadata m ON m.lead_id = l.id ORDER BY l.created_at DESC").all<Record<string, string>>(); const columns = ["name", "email", "company", "whatsapp", "website", "service", "plan", "timeline", "budget", "message", "status", "customerType", "followUpAt", "receivedAt"]; const csv = [columns.join(","), ...results.map(row => columns.map(column => quote(row[column])).join(","))].join("\n"); return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=bugxtract-leads.csv", "Cache-Control": "no-store" } }); } catch (error) { console.error("Could not export leads", error); return Response.json({ error: "Lead export could not be created." }, { status: 503 }); }
}
