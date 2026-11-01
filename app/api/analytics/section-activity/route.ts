import { sameOriginRequest } from "../../../../lib/admin-auth";
import { recordVisitorSectionActivity, type VisitorSectionActivity } from "../../../../lib/visitor-analytics";

export const dynamic = "force-dynamic";

const validVisitorId = (value: unknown): value is string => typeof value === "string" && /^[a-z0-9-]{20,64}$/i.test(value);
const validPath = (value: unknown): value is string => typeof value === "string" && /^\/[a-z0-9/_-]{0,239}$/i.test(value);
const validSection = (value: unknown): value is string => typeof value === "string" && /^[a-z0-9_-]{1,64}$/i.test(value);
const validLabel = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0 && value.trim().length <= 100;

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: "Request could not be verified." }, { status: 403 });
  let payload: Partial<VisitorSectionActivity>;
  try { payload = await request.json() as Partial<VisitorSectionActivity>; }
  catch { return Response.json({ error: "Section activity was not valid." }, { status: 400 }); }
  if (!validVisitorId(payload.visitorId) || !validPath(payload.path) || !validSection(payload.sectionId) || !validLabel(payload.sectionLabel) || !["Desktop", "Mobile", "Tablet", "Other"].includes(String(payload.device)) || !["Light", "Dark"].includes(String(payload.theme)) || !Number.isInteger(payload.seconds) || Number(payload.seconds) < 0 || Number(payload.seconds) > 60) {
    return Response.json({ error: "Section activity was not valid." }, { status: 400 });
  }
  try {
    await recordVisitorSectionActivity(payload as VisitorSectionActivity);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Could not record section activity", error);
    return Response.json({ error: "Section analytics service is unavailable." }, { status: 503 });
  }
}
