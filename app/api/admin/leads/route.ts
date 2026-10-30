import { getAdminUsername, sameOriginRequest } from "../../../../lib/admin-auth";
import { ensureContactLeadStorage, isLeadStatus, leadStatuses, type ContactLead, type LeadStatus } from "../../../../lib/contact-leads";
import { env } from "../../../../lib/runtime-env";

export const dynamic = "force-dynamic";

type LeadRow = Omit<ContactLead, "createdAt" | "updatedAt"> & { createdAt: string; updatedAt: string };

function validId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value);
}

export async function GET(request: Request) {
  if (!(await getAdminUsername(request))) return Response.json({ error: "Please sign in to the admin panel." }, { status: 401 });
  try {
    await ensureContactLeadStorage();
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const query = (url.searchParams.get("q") || "").trim().slice(0, 100);
    const binds: string[] = [];
    const conditions: string[] = [];
    if (status && isLeadStatus(status)) { conditions.push("status = ?"); binds.push(status); }
    if (query) {
      conditions.push("(name LIKE ? OR email LIKE ? OR company LIKE ? OR whatsapp LIKE ?)");
      const like = `%${query.replace(/[%_\\]/g, "\\$&")}%`;
      binds.push(like, like, like, like);
    }
    const where = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";
    const { results } = await env.DB!.prepare(
      `SELECT id, name, email, company, whatsapp, website, service, plan, timeline, budget, message, status, created_at AS createdAt, updated_at AS updatedAt FROM contact_leads${where} ORDER BY created_at DESC LIMIT 250`
    ).bind(...binds).all<LeadRow>();
    return Response.json({ leads: results, statuses: leadStatuses }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load contact leads", error);
    return Response.json({ error: "Leads could not be loaded. Please try again." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  if (!(await getAdminUsername(request))) return Response.json({ error: "Please sign in to the admin panel." }, { status: 401 });
  if (!sameOriginRequest(request)) return Response.json({ error: "This request could not be verified." }, { status: 403 });
  let payload: { id?: unknown; status?: unknown };
  try { payload = await request.json() as { id?: unknown; status?: unknown }; }
  catch { return Response.json({ error: "Lead update details were not valid." }, { status: 400 }); }
  if (!validId(payload.id) || !isLeadStatus(payload.status)) return Response.json({ error: "Choose a valid lead and status." }, { status: 400 });
  try {
    await ensureContactLeadStorage();
    const updatedAt = new Date().toISOString();
    await env.DB!.prepare("UPDATE contact_leads SET status = ?, updated_at = ? WHERE id = ?")
      .bind(payload.status as LeadStatus, updatedAt, payload.id).run();
    return Response.json({ ok: true, updatedAt });
  } catch (error) {
    console.error("Could not update contact lead", error);
    return Response.json({ error: "The lead status could not be updated. Please try again." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!(await getAdminUsername(request))) return Response.json({ error: "Please sign in to the admin panel." }, { status: 401 });
  if (!sameOriginRequest(request)) return Response.json({ error: "This request could not be verified." }, { status: 403 });
  const id = new URL(request.url).searchParams.get("id");
  if (!validId(id)) return Response.json({ error: "Choose a valid lead to delete." }, { status: 400 });
  try {
    await ensureContactLeadStorage();
    await env.DB!.prepare("DELETE FROM contact_leads WHERE id = ?").bind(id).run();
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Could not delete contact lead", error);
    return Response.json({ error: "The lead could not be deleted. Please try again." }, { status: 503 });
  }
}
