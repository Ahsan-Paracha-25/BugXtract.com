import { env } from "cloudflare:workers";
import { clearFailedAuth, createSessionCookie, getAdminUsername, getCredentials, hashPassword, sameOriginRequest, validPassword, validUsername } from "../../../../../lib/admin-auth";

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  const currentUsername = await getAdminUsername(request);
  if (!currentUsername) return Response.json({ error: "Please sign in again." }, { status: 401 });
  try {
    if (!env.DB) throw new Error("Admin database is unavailable.");
    const body = await request.json() as { username?: unknown; currentPassword?: unknown; newPassword?: unknown };
    const record = await getCredentials();
    const nextUsername = body.username === "" || body.username === undefined ? currentUsername : body.username;
    if (!record || typeof body.currentPassword !== "string" || !validUsername(nextUsername)) return Response.json({ error: "Check your username and current password." }, { status: 400 });
    const salt = Uint8Array.from(record.salt.match(/.{1,2}/g) ?? [], byte => Number.parseInt(byte, 16));
    const currentHash = await hashPassword(body.currentPassword, salt, record.iterations);
    if (currentHash !== record.passwordHash) return Response.json({ error: "Current password is incorrect." }, { status: 401 });
    const password = body.newPassword === "" || body.newPassword === undefined ? body.currentPassword : body.newPassword;
    if (!validPassword(password)) return Response.json({ error: "New password must contain at least 12 characters." }, { status: 400 });
    const newSalt = crypto.getRandomValues(new Uint8Array(16));
    const newHash = await hashPassword(password, newSalt);
    await env.DB.prepare("UPDATE admin_credentials SET username = ?, salt = ?, password_hash = ?, iterations = 310000, updated_at = ? WHERE id = 1")
      .bind(nextUsername, Array.from(newSalt, b => b.toString(16).padStart(2, "0")).join(""), newHash, new Date().toISOString()).run();
    await clearFailedAuth(request);
    return Response.json({ ok: true }, { headers: { "Set-Cookie": await createSessionCookie(nextUsername) } });
  } catch {
    return Response.json({ error: "Could not update your login details." }, { status: 503 });
  }
}
