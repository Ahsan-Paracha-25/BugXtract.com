import { env } from "cloudflare:workers";
import { clearFailedAuth, constantTimeEqual, createSessionCookie, getCredentials, hashPassword, recordFailedAuth, sameOriginRequest, validPassword, validUsername, authRateLimited } from "../../../../../lib/admin-auth";

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    if (!env.DB || !env.ADMIN_SETUP_TOKEN || !env.ADMIN_SESSION_SECRET) throw new Error("Admin setup is unavailable.");
    if (await authRateLimited(request)) return Response.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
    if (await getCredentials()) return Response.json({ error: "Admin login has already been set up." }, { status: 409 });
    const body = await request.json() as { setupCode?: unknown; username?: unknown; password?: unknown };
    if (!validUsername(body.username) || !validPassword(body.password)) return Response.json({ error: "Use a 3–40 character username and a password with at least 12 characters." }, { status: 400 });
    if (typeof body.setupCode !== "string" || body.setupCode.length > 200 || !constantTimeEqual(body.setupCode, env.ADMIN_SETUP_TOKEN)) {
      await recordFailedAuth(request);
      return Response.json({ error: "Setup code is incorrect." }, { status: 403 });
    }
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await hashPassword(body.password, salt);
    await env.DB.prepare("INSERT INTO admin_credentials (id, username, salt, password_hash, iterations, recovery_used, updated_at) VALUES (1, ?, ?, ?, 310000, 0, ?)")
      .bind(body.username, Array.from(salt, b => b.toString(16).padStart(2, "0")).join(""), hash, new Date().toISOString()).run();
    await clearFailedAuth(request);
    return Response.json({ ok: true }, { headers: { "Set-Cookie": await createSessionCookie(body.username) } });
  } catch {
    return Response.json({ error: "Could not set up the admin login. Please try again." }, { status: 503 });
  }
}
