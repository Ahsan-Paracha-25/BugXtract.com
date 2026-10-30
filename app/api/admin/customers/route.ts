import { getAdminUsername, sameOriginRequest } from "../../../../lib/admin-auth";
import { addLeadActivity, ensureContactLeadStorage } from "../../../../lib/contact-leads";
import { customerEngagementStatuses, isCustomerEngagementStatus, type CustomerEngagementStatus } from "../../../../lib/customer-profile";
import { env } from "../../../../lib/runtime-env";

export const dynamic = "force-dynamic";

type Customer = { id: string; name: string; email: string; company: string; whatsapp: string; website: string; service: string; plan: string; leadType: "One-time Customer" | "Retainer Customer"; status: string; engagementStatus: CustomerEngagementStatus; startedAt: string; deliveryNotes: string; updatedAt: string };
const validId = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value);
const validDate = (value: unknown): value is string => typeof value === "string" && value.length <= 40 && (!value || !Number.isNaN(new Date(value).getTime()));
const validNotes = (value: unknown): value is string => typeof value === "string" && value.length <= 4000;

export async function GET(request: Request) {
  if (!(await getAdminUsername(request))) return Response.json({ error: "Please sign in to the admin panel." }, { status: 401 });
  try {
    await ensureContactLeadStorage();
    const url = new URL(request.url); const search = (url.searchParams.get("q") || "").trim().slice(0, 100); const type = url.searchParams.get("type");
    const binds: string[] = ["One-time Customer", "Retainer Customer"]; const conditions = ["m.lead_type IN (?, ?)"];
    if (type === "One-time Customer" || type === "Retainer Customer") { conditions.push("m.lead_type = ?"); binds.push(type); }
    if (search) { const like = `%${search.replace(/[%_\\]/g, "\\$&")}%`; conditions.push("(l.name LIKE ? OR l.email LIKE ? OR l.company LIKE ?)"); binds.push(like, like, like); }
    const { results } = await env.DB!.prepare(`SELECT l.id, l.name, l.email, l.company, l.whatsapp, l.website, l.service, l.plan, l.status, m.lead_type AS leadType, COALESCE(p.engagement_status, 'Active') AS engagementStatus, COALESCE(p.started_at, '') AS startedAt, COALESCE(p.delivery_notes, '') AS deliveryNotes, COALESCE(p.updated_at, l.updated_at) AS updatedAt FROM contact_leads l INNER JOIN contact_lead_metadata m ON m.lead_id = l.id LEFT JOIN customer_profiles p ON p.lead_id = l.id WHERE ${conditions.join(" AND ")} ORDER BY COALESCE(p.updated_at, l.updated_at) DESC LIMIT 250`).bind(...binds).all<Customer>();
    return Response.json({ customers: results, engagementStatuses: customerEngagementStatuses }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { console.error("Could not load customers", error); return Response.json({ error: "Customers could not be loaded. Please try again." }, { status: 503 }); }
}

export async function PUT(request: Request) {
  const username = await getAdminUsername(request);
  if (!username) return Response.json({ error: "Please sign in to the admin panel." }, { status: 401 });
  if (!sameOriginRequest(request)) return Response.json({ error: "This request could not be verified." }, { status: 403 });
  let payload: { id?: unknown; engagementStatus?: unknown; startedAt?: unknown; deliveryNotes?: unknown };
  try { payload = await request.json() as typeof payload; } catch { return Response.json({ error: "Customer details were not valid." }, { status: 400 }); }
  if (!validId(payload.id) || !isCustomerEngagementStatus(payload.engagementStatus) || !validDate(payload.startedAt) || !validNotes(payload.deliveryNotes)) return Response.json({ error: "Check the customer status, start date, and delivery notes." }, { status: 400 });
  try {
    await ensureContactLeadStorage();
    const current = await env.DB!.prepare("SELECT m.lead_type AS leadType, p.engagement_status AS engagementStatus, p.started_at AS startedAt, p.delivery_notes AS deliveryNotes FROM contact_leads l INNER JOIN contact_lead_metadata m ON m.lead_id = l.id LEFT JOIN customer_profiles p ON p.lead_id = l.id WHERE l.id = ?").bind(payload.id).first<{ leadType: string; engagementStatus: string | null; startedAt: string | null; deliveryNotes: string | null }>();
    if (!current || (current.leadType !== "One-time Customer" && current.leadType !== "Retainer Customer")) return Response.json({ error: "This lead is not marked as a customer." }, { status: 404 });
    const now = new Date().toISOString();
    await env.DB!.prepare("INSERT INTO customer_profiles (lead_id, engagement_status, started_at, delivery_notes, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(lead_id) DO UPDATE SET engagement_status = excluded.engagement_status, started_at = excluded.started_at, delivery_notes = excluded.delivery_notes, updated_at = excluded.updated_at")
      .bind(payload.id, payload.engagementStatus, payload.startedAt, String(payload.deliveryNotes).trim(), now).run();
    const events: string[] = [];
    if (payload.engagementStatus !== (current.engagementStatus || "Active")) events.push(`Customer engagement changed to ${payload.engagementStatus}`);
    if (payload.startedAt !== (current.startedAt || "")) events.push(payload.startedAt ? `Customer start date set for ${payload.startedAt}` : "Customer start date cleared");
    if (String(payload.deliveryNotes).trim() !== (current.deliveryNotes || "")) events.push("Customer delivery notes updated");
    await Promise.all(events.map(detail => addLeadActivity(payload.id as string, "customer_updated", detail, username, now)));
    return Response.json({ ok: true, updatedAt: now });
  } catch (error) { console.error("Could not update customer", error); return Response.json({ error: "Customer details could not be saved. Please try again." }, { status: 503 }); }
}
