import { clearSessionCookie } from "../../../../../lib/admin-auth";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  return Response.json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
}
