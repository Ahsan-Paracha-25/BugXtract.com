import { env } from "@/lib/runtime-env";
import { getAdminUsername, sameOriginRequest } from "../../../../../lib/admin-auth";

export const dynamic = "force-dynamic";
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function imageExtension(type: string, bytes: Uint8Array) {
  if (type === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (type === "image/png" && bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "png";
  if (type === "image/webp" && bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "webp";
  return null;
}

export async function POST(request: Request) {
  if (!(await getAdminUsername(request))) return Response.json({ error: "Please sign in to the admin panel." }, { status: 401 });
  if (!sameOriginRequest(request)) return Response.json({ error: "This request could not be verified." }, { status: 403 });

  try {
    if (!env.BUCKET) throw new Error("Review image storage is unavailable.");
    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File) || file.size < 1 || file.size > MAX_IMAGE_BYTES) {
      return Response.json({ error: "Choose an image smaller than 4 MB." }, { status: 400 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const extension = imageExtension(file.type, bytes);
    if (!extension) return Response.json({ error: "Use a valid JPEG, PNG, or WebP image." }, { status: 400 });

    const key = `review-${crypto.randomUUID()}.${extension}`;
    await env.BUCKET.put(key, bytes, {
      httpMetadata: { contentType: file.type, cacheControl: "public, max-age=3600" },
      customMetadata: { purpose: "customer-review-thumbnail" },
    });
    return Response.json({ imageKey: key, imageUrl: `/api/reviews/images/${encodeURIComponent(key)}` });
  } catch (error) {
    console.error("Could not upload customer review thumbnail", error);
    return Response.json({ error: "The image could not be uploaded. Please try again." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!(await getAdminUsername(request))) return Response.json({ error: "Please sign in to the admin panel." }, { status: 401 });
  if (!sameOriginRequest(request)) return Response.json({ error: "This request could not be verified." }, { status: 403 });
  try {
    const payload = await request.json() as { imageKey?: unknown };
    if (typeof payload.imageKey !== "string" || !/^review-[0-9a-f-]{36}\.(?:jpe?g|png|webp)$/i.test(payload.imageKey)) {
      return Response.json({ error: "Image not found." }, { status: 404 });
    }
    if (!env.DB || !env.BUCKET) throw new Error("Review image storage is unavailable.");
    const linked = await env.DB.prepare("SELECT id FROM customer_reviews WHERE image_key = ? LIMIT 1").bind(payload.imageKey).first<{ id: string }>();
    if (linked) return Response.json({ error: "This image belongs to a saved review." }, { status: 409 });
    await env.BUCKET.delete(payload.imageKey);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Could not remove unused customer review thumbnail", error);
    return Response.json({ error: "The unused image could not be removed." }, { status: 503 });
  }
}

