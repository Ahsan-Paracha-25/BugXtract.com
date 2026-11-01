import { sameOriginRequest } from "../../../../lib/admin-auth";
import { recordVisitorPresence, type VisitorPresence } from "../../../../lib/visitor-analytics";

export const dynamic = "force-dynamic";

const validVisitorId = (value: unknown): value is string => typeof value === "string" && /^[a-z0-9-]{20,64}$/i.test(value);
const validPath = (value: unknown): value is string => typeof value === "string" && /^\/[a-z0-9/_-]{0,239}$/i.test(value);

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: "Request could not be verified." }, { status: 403 });
  let payload: Partial<VisitorPresence>;
  try { payload = await request.json() as Partial<VisitorPresence>; }
  catch { return Response.json({ error: "Presence event was not valid." }, { status: 400 }); }
  if (!validVisitorId(payload.visitorId) || !validPath(payload.path) || !["Desktop", "Mobile", "Tablet", "Other"].includes(String(payload.device)) || !["Light", "Dark"].includes(String(payload.theme))) {
    return Response.json({ error: "Presence event was not valid." }, { status: 400 });
  }
  try {
    await recordVisitorPresence(payload as VisitorPresence, request);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Could not record visitor presence", error);
    return Response.json({ error: "Live analytics service is unavailable." }, { status: 503 });
  }
}
