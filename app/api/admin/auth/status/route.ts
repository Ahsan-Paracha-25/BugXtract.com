import { env } from "cloudflare:workers";
import { getAdminUsername, isAdminConfigured } from "../../../../../lib/admin-auth";

export async function GET(request: Request) {
  try {
    if (!env.DB) throw new Error("Admin database is unavailable.");
    const configured = await isAdminConfigured();
    const username = configured ? await getAdminUsername(request) : null;
    return Response.json({ configured, authenticated: Boolean(username), username }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Admin sign-in is temporarily unavailable." }, { status: 503 });
  }
}
