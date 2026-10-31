import { sameOriginRequest } from "../../../../lib/admin-auth";
import { recordVisitorEvent, type VisitorEvent } from "../../../../lib/visitor-analytics";

export const dynamic = "force-dynamic";

const validVisitorId = (value: unknown): value is string => typeof value === "string" && /^[a-z0-9-]{20,64}$/i.test(value);
const validPath = (value: unknown): value is string => typeof value === "string" && /^\/[a-z0-9/_-]{0,239}$/i.test(value);
const validText = (value: unknown, max: number): value is string => typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: "Request could not be verified." }, { status: 403 });
  let payload: Partial<VisitorEvent>;
  try { payload = await request.json() as Partial<VisitorEvent>; }
  catch { return Response.json({ error: "Analytics event was not valid." }, { status: 400 }); }
  if (!validVisitorId(payload.visitorId) || !validPath(payload.path) || !validText(payload.source, 160) ||
    !["Desktop", "Mobile", "Tablet", "Other"].includes(String(payload.device)) || !["Light", "Dark"].includes(String(payload.theme))) {
    return Response.json({ error: "Analytics event was not valid." }, { status: 400 });
  }
  try {
    await recordVisitorEvent(payload as VisitorEvent, request);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Could not record visitor event", error);
    return Response.json({ error: "Analytics service is unavailable." }, { status: 503 });
  }
}
