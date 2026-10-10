import { env } from "@/lib/runtime-env";
import { getAdminUsername, sameOriginRequest } from "../../../../lib/admin-auth";

export const dynamic = "force-dynamic";

type ReviewInput = {
  id?: unknown;
  customerName?: unknown;
  role?: unknown;
  company?: unknown;
  headline?: unknown;
  body?: unknown;
  rating?: unknown;
  imageKey?: unknown;
  published?: unknown;
};

const IMAGE_KEY = /^review-[0-9a-f-]{36}\.(?:jpg|png|webp)$/i;
const text = (value: unknown, max: number) => typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;

function validReview(value: unknown): value is ReviewInput {
  if (!value || typeof value !== "object") return false;
  const review = value as ReviewInput;
  const optionalText = (input: unknown, max: number) => input === undefined || input === null || input === "" || text(input, max);
  const validRating = review.rating === undefined || review.rating === "" || review.rating === null ||
    (typeof review.rating === "number" && Number.isFinite(review.rating) && review.rating >= 1 && review.rating <= 5 && Number.isInteger(review.rating * 10));
  const validImage = review.imageKey === undefined || review.imageKey === null || review.imageKey === "" || (typeof review.imageKey === "string" && IMAGE_KEY.test(review.imageKey));
  return (review.id === undefined || (typeof review.id === "string" && /^[0-9a-f-]{36}$/i.test(review.id))) &&
    optionalText(review.customerName, 100) && optionalText(review.role, 100) && optionalText(review.company, 120) &&
    optionalText(review.headline, 140) && optionalText(review.body, 2000) && validRating && validImage &&
    typeof review.published === "boolean";
}

export async function GET(request: Request) {
  if (!(await getAdminUsername(request))) return Response.json({ error: "Please sign in to the admin panel." }, { status: 401 });
  try {
    if (!env.DB) throw new Error("Review database is unavailable.");
    const { results } = await env.DB.prepare(
      "SELECT id, customer_name AS customerName, role, company, headline, body, rating, image_key AS imageKey, published, created_at AS createdAt, updated_at AS updatedAt FROM customer_reviews ORDER BY updated_at DESC"
    ).all<{
      id: string; customerName: string; role: string; company: string; headline: string; body: string;
      rating: number; imageKey: string; published: number; createdAt: string; updatedAt: string;
    }>();
    return Response.json(results.map(({ imageKey, ...review }) => ({
      ...review,
      published: review.published === 1,
      imageKey,
      imageUrl: imageKey ? `/api/reviews/images/${encodeURIComponent(imageKey)}` : "",
    })), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load admin customer reviews", error);
    return Response.json({ error: "Reviews could not be loaded. Please try again." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  if (!(await getAdminUsername(request))) return Response.json({ error: "Please sign in to the admin panel." }, { status: 401 });
  if (!sameOriginRequest(request)) return Response.json({ error: "This request could not be verified." }, { status: 403 });

  let payload: unknown;
  try { payload = await request.json(); } catch { return Response.json({ error: "Review details were not valid." }, { status: 400 }); }
  if (!validReview(payload)) return Response.json({ error: "Complete the review fields and choose a valid thumbnail image." }, { status: 400 });

  try {
    if (!env.DB || !env.BUCKET) throw new Error("Review storage is unavailable.");
    if (payload.imageKey) {
      const image = await env.BUCKET.head(payload.imageKey as string);
      if (!image) return Response.json({ error: "The uploaded thumbnail was not found. Upload it again." }, { status: 400 });
    }

    const id = typeof payload.id === "string" ? payload.id : crypto.randomUUID();
    const now = new Date().toISOString();
    const previous = typeof payload.id === "string"
      ? await env.DB.prepare("SELECT image_key AS imageKey FROM customer_reviews WHERE id = ?").bind(id).first<{ imageKey: string }>()
      : null;

    await env.DB.prepare(
      "INSERT INTO customer_reviews (id, customer_name, role, company, headline, body, rating, image_key, published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET customer_name = excluded.customer_name, role = excluded.role, company = excluded.company, headline = excluded.headline, body = excluded.body, rating = excluded.rating, image_key = excluded.image_key, published = excluded.published, updated_at = excluded.updated_at"
    ).bind(
      id, String(payload.customerName || "").trim(), String(payload.role || "").trim(), String(payload.company || "").trim(),
      String(payload.headline || "").trim(), String(payload.body || "").trim(), Number(payload.rating) || 0, payload.imageKey as string,
      payload.published ? 1 : 0, now, now,
    ).run();

    if (previous?.imageKey && previous.imageKey !== payload.imageKey) {
      try { await env.BUCKET.delete(previous.imageKey); }
      catch (error) { console.error("Saved review but could not clean up replaced thumbnail", error); }
    }
    return Response.json({ ok: true, id, savedAt: now });
  } catch (error) {
    console.error("Could not save customer review", error);
    return Response.json({ error: "The review could not be saved. Your form details are still here; please try again." }, { status: 503 });
  }
}

