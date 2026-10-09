import { env } from "@/lib/runtime-env";
import { authRateLimited, clearFailedAuth, createSessionCookie, getCredentials, hashPassword, recordFailedAuth, sameOriginRequest, validUsername } from "../../../../../lib/admin-auth";

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    if (!env.DB || !env.ADMIN_SESSION_SECRET) throw new Error("Admin login is unavailable.");
    if (await authRateLimited(request)) return Response.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
    const body = await request.json() as { username?: unknown; password?: unknown };
    const record = await getCredentials();
    const username = validUsername(body.username) ? body.username : "invalid";
    const saltHex = record?.salt ?? "00000000000000000000000000000000";
    const salt = Uint8Array.from(saltHex.match(/.{1,2}/g) ?? [], byte => Number.parseInt(byte, 16));
    const computed = typeof body.password === "string" && body.password.length <= 128 ? await hashPassword(body.password, salt, record?.iterations ?? 100000) : "";
    if (!record || record.username !== username || computed !== record.passwordHash) {
      await recordFailedAuth(request);
      return Response.json({ error: "Username or password is incorrect." }, { status: 401 });
    }
    await clearFailedAuth(request);
    return Response.json({ ok: true }, { headers: { "Set-Cookie": await createSessionCookie(record.username) } });
  } catch {
    return Response.json({ error: "Could not sign in. Please try again." }, { status: 503 });
  }
}

