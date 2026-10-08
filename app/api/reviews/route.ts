import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!env.DB) throw new Error("Review database is unavailable.");
    const { results } = await env.DB.prepare(
      "SELECT id, customer_name AS customerName, role, company, headline, body, rating, image_key AS imageKey, updated_at AS updatedAt FROM customer_reviews WHERE published = 1 AND (customer_name != '' OR role != '' OR company != '' OR headline != '' OR body != '' OR rating > 0 OR image_key != '') ORDER BY updated_at DESC"
    ).all<{
      id: string;
      customerName: string;
      role: string;
      company: string;
      headline: string;
      body: string;
      rating: number;
      imageKey: string;
      updatedAt: string;
    }>();

    return Response.json(results.map(({ imageKey, ...review }) => ({
      ...review,
      imageUrl: imageKey ? `/api/reviews/images/${encodeURIComponent(imageKey)}` : "",
    })), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load public customer reviews", error);
    return Response.json({ error: "Customer reviews are temporarily unavailable." }, { status: 503 });
  }
}
