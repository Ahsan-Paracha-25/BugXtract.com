import { getAdminUsername, sameOriginRequest } from "../../../../lib/admin-auth";
import { addLeadActivity, ensureContactLeadStorage, isLeadStatus, isLeadType, leadStatuses, leadTypes, type ContactLead, type LeadActivity, type LeadNote, type LeadStatus, type LeadType } from "../../../../lib/contact-leads";
import { env } from "../../../../lib/runtime-env";

export const dynamic = "force-dynamic";

type LeadRow = Omit<ContactLead, "createdAt" | "updatedAt"> & { createdAt: string; updatedAt: string };

function validId(value: unknown): value is string { return typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value); }
function validFollowUp(value: unknown): value is string { return typeof value === "string" && value.length <= 40 && (!value || !Number.isNaN(new Date(value).getTime())); }
function validNote(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 4000; }

async function listLeads(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const query = (url.searchParams.get("q") || "").trim().slice(0, 100);
  const binds: string[] = [];
  const conditions: string[] = [];
  if (status && isLeadStatus(status)) { conditions.push("l.status = ?"); binds.push(status); }
  if (query) {
    conditions.push("(l.name LIKE ? OR l.email LIKE ? OR l.company LIKE ? OR l.whatsapp LIKE ?)");
    const like = `%${query.replace(/[%_\\]/g, "\\$&")}%`;
    binds.push(like, like, like, like);
  }
  const where = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";
  const { results } = await env.DB!.prepare(
    `SELECT l.id, l.name, l.email, l.company, l.whatsapp, l.website, l.service, l.plan, l.timeline, l.budget, l.message, l.status, COALESCE(m.lead_type, 'Prospect') AS leadType, COALESCE(m.follow_up_at, '') AS followUpAt, l.created_at AS createdAt, l.updated_at AS updatedAt FROM contact_leads l LEFT JOIN contact_lead_metadata m ON m.lead_id = l.id${where} ORDER BY l.created_at DESC LIMIT 250`
  ).bind(...binds).all<LeadRow>();
  return results;
}

async function leadDetails(id: string) {
  const lead = await env.DB!.prepare(
    "SELECT l.id, l.name, l.email, l.company, l.whatsapp, l.website, l.service, l.plan, l.timeline, l.budget, l.message, l.status, COALESCE(m.lead_type, 'Prospect') AS leadType, COALESCE(m.follow_up_at, '') AS followUpAt, l.created_at AS createdAt, l.updated_at AS updatedAt FROM contact_leads l LEFT JOIN contact_lead_metadata m ON m.lead_id = l.id WHERE l.id = ?"
  ).bind(id).first<LeadRow>();
  if (!lead) return null;
  const { results: notes } = await env.DB!.prepare("SELECT id, lead_id AS leadId, note, author, created_at AS createdAt FROM contact_lead_notes WHERE lead_id = ? ORDER BY created_at DESC")
    .bind(id).all<LeadNote>();
  const { results: activity } = await env.DB!.prepare("SELECT id, lead_id AS leadId, kind, detail, author, created_at AS createdAt FROM contact_lead_activity WHERE lead_id = ? ORDER BY created_at DESC LIMIT 100")
    .bind(id).all<LeadActivity>();
  return { lead, notes, activity };
}

export async function GET(request: Request) {
  if (!(await getAdminUsername(request))) return Response.json({ error: "Please sign in to the admin panel." }, { status: 401 });
  try {
    await ensureContactLeadStorage();
    const id = new URL(request.url).searchParams.get("id");
    if (id) {
      if (!validId(id)) return Response.json({ error: "Choose a valid lead." }, { status: 400 });
      const details = await leadDetails(id);
      if (!details) return Response.json({ error: "That lead no longer exists." }, { status: 404 });
      return Response.json(details, { headers: { "Cache-Control": "no-store" } });
    }
    return Response.json({ leads: await listLeads(request), statuses: leadStatuses, leadTypes }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load contact leads", error);
    return Response.json({ error: "Leads could not be loaded. Please try again." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const username = await getAdminUsername(request);
  if (!username) return Response.json({ error: "Please sign in to the admin panel." }, { status: 401 });
  if (!sameOriginRequest(request)) return Response.json({ error: "This request could not be verified." }, { status: 403 });
  let payload: { id?: unknown; status?: unknown; leadType?: unknown; followUpAt?: unknown };
  try { payload = await request.json() as typeof payload; }
  catch { return Response.json({ error: "Lead update details were not valid." }, { status: 400 }); }
  if (!validId(payload.id) || (payload.status !== undefined && !isLeadStatus(payload.status)) || (payload.leadType !== undefined && !isLeadType(payload.leadType)) || !validFollowUp(payload.followUpAt ?? "")) return Response.json({ error: "Choose valid lead details before saving." }, { status: 400 });
  try {
    await ensureContactLeadStorage();
    const previous = await leadDetails(payload.id);
    if (!previous) return Response.json({ error: "That lead no longer exists." }, { status: 404 });
    const status = (payload.status ?? previous.lead.status) as LeadStatus;
    const leadType = (payload.leadType ?? previous.lead.leadType) as LeadType;
    const followUpAt = String(payload.followUpAt ?? previous.lead.followUpAt ?? "");
    const updatedAt = new Date().toISOString();
    await env.DB!.prepare("UPDATE contact_leads SET status = ?, updated_at = ? WHERE id = ?").bind(status, updatedAt, payload.id).run();
    const metadata = await env.DB!.prepare("SELECT lead_id FROM contact_lead_metadata WHERE lead_id = ?").bind(payload.id).first<{ leadId: string }>();
    if (metadata) {
      await env.DB!.prepare("UPDATE contact_lead_metadata SET lead_type = ?, follow_up_at = ?, updated_at = ? WHERE lead_id = ?")
        .bind(leadType, followUpAt, updatedAt, payload.id).run();
    } else {
      await env.DB!.prepare("INSERT INTO contact_lead_metadata (lead_id, lead_type, follow_up_at, updated_at) VALUES (?, ?, ?, ?)")
        .bind(payload.id, leadType, followUpAt, updatedAt).run();
    }
    const events: string[] = [];
    if (status !== previous.lead.status) events.push(`Status changed from ${previous.lead.status} to ${status}`);
    if (leadType !== previous.lead.leadType) events.push(`Customer type changed to ${leadType}`);
    if (followUpAt !== previous.lead.followUpAt) events.push(followUpAt ? `Follow-up set for ${followUpAt}` : "Follow-up date cleared");
    await Promise.all(events.map(detail => addLeadActivity(payload.id as string, "lead_updated", detail, username, updatedAt)));
    return Response.json({ ok: true, updatedAt });
  } catch (error) {
    console.error("Could not update contact lead", error);
    return Response.json({ error: "The lead details could not be updated. Please try again." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const username = await getAdminUsername(request);
  if (!username) return Response.json({ error: "Please sign in to the admin panel." }, { status: 401 });
  if (!sameOriginRequest(request)) return Response.json({ error: "This request could not be verified." }, { status: 403 });
  let payload: { id?: unknown; note?: unknown };
  try { payload = await request.json() as typeof payload; }
  catch { return Response.json({ error: "Note details were not valid." }, { status: 400 }); }
  if (!validId(payload.id) || !validNote(payload.note)) return Response.json({ error: "Write a private note before saving." }, { status: 400 });
  try {
    await ensureContactLeadStorage();
    const id = crypto.randomUUID(); const createdAt = new Date().toISOString();
    await env.DB!.prepare("INSERT INTO contact_lead_notes (id, lead_id, note, author, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(id, payload.id, String(payload.note).trim(), username, createdAt).run();
    await addLeadActivity(payload.id, "note_added", "Private note added", username, createdAt);
    return Response.json({ ok: true, id, createdAt });
  } catch (error) {
    console.error("Could not add lead note", error);
    return Response.json({ error: "The note could not be saved. Please try again." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!(await getAdminUsername(request))) return Response.json({ error: "Please sign in to the admin panel." }, { status: 401 });
  if (!sameOriginRequest(request)) return Response.json({ error: "This request could not be verified." }, { status: 403 });
  const id = new URL(request.url).searchParams.get("id");
  if (!validId(id)) return Response.json({ error: "Choose a valid lead to delete." }, { status: 400 });
  try {
    await ensureContactLeadStorage();
    await Promise.all([
      env.DB!.prepare("DELETE FROM contact_lead_notes WHERE lead_id = ?").bind(id).run(),
      env.DB!.prepare("DELETE FROM contact_lead_activity WHERE lead_id = ?").bind(id).run(),
      env.DB!.prepare("DELETE FROM contact_lead_metadata WHERE lead_id = ?").bind(id).run(),
      env.DB!.prepare("DELETE FROM customer_profiles WHERE lead_id = ?").bind(id).run(),
    ]);
    await env.DB!.prepare("DELETE FROM contact_leads WHERE id = ?").bind(id).run();
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Could not delete contact lead", error);
    return Response.json({ error: "The lead could not be deleted. Please try again." }, { status: 503 });
  }
}
