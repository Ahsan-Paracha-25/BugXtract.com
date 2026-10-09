import { env } from "@/lib/runtime-env";

export const dynamic = "force-dynamic";

const SAFE_REVIEW_IMAGE_KEY = /^review-[0-9a-f-]{36}\.(?:jpg|png|webp)$/i;

export async function GET(_request: Request, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params;
  if (!SAFE_REVIEW_IMAGE_KEY.test(key)) return new Response("Not found", { status: 404 });

  try {
    if (!env.BUCKET) throw new Error("Review image storage is unavailable.");
    const object = await env.BUCKET.get(key);
    if (!object) return new Response("Not found", { status: 404 });
    const headers = new Headers({
      "Cache-Control": "public, max-age=3600, s-maxage=86400, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
    });
    object.writeHttpMetadata(headers);
    headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400, immutable");
    headers.set("X-Content-Type-Options", "nosniff");
    return new Response(object.body, { headers });
  } catch (error) {
    console.error("Could not read customer review image", error);
    return new Response("Image storage is temporarily unavailable.", { status: 503 });
  }
}

