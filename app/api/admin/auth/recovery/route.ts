import { env } from "cloudflare:workers";
import { authRateLimited, clearFailedAuth, constantTimeEqual, createSessionCookie, getCredentials, hashPassword, recordFailedAuth, sameOriginRequest, validPassword, validUsername } from "../../../../../lib/admin-auth";

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    if (!env.DB || !env.ADMIN_RECOVERY_TOKEN || !env.ADMIN_SESSION_SECRET) throw new Error("Recovery is unavailable.");
    if (await authRateLimited(request)) return Response.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
    const record = await getCredentials();
    if (!record) return Response.json({ error: "Set up the admin login first." }, { status: 409 });
    if (record.recoveryUsed) return Response.json({ error: "The one-time recovery code has already been used. Contact the site owner for a new recovery code." }, { status: 409 });
    const body = await request.json() as { recoveryCode?: unknown; username?: unknown; password?: unknown };
    if (!validUsername(body.username) || !validPassword(body.password)) return Response.json({ error: "Use a 3–40 character username and a password with at least 12 characters." }, { status: 400 });
    if (typeof body.recoveryCode !== "string" || body.recoveryCode.length > 200 || !constantTimeEqual(body.recoveryCode, env.ADMIN_RECOVERY_TOKEN)) {
      await recordFailedAuth(request);
      return Response.json({ error: "Recovery code is incorrect." }, { status: 403 });
    }
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await hashPassword(body.password, salt);
    await env.DB.prepare("UPDATE admin_credentials SET username = ?, salt = ?, password_hash = ?, iterations = 310000, recovery_used = 1, updated_at = ? WHERE id = 1")
      .bind(body.username, Array.from(salt, b => b.toString(16).padStart(2, "0")).join(""), hash, new Date().toISOString()).run();
    await clearFailedAuth(request);
    return Response.json({ ok: true }, { headers: { "Set-Cookie": await createSessionCookie(body.username) } });
  } catch {
    return Response.json({ error: "Could not recover the admin login. Please try again." }, { status: 503 });
  }
}
