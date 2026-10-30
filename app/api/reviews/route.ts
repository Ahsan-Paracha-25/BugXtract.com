import { env } from "@/lib/runtime-env";

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

    const response = await Promise.all(results.map(async ({ imageKey, ...review }) => ({
      ...review,
      imageUrl: imageKey && await env.BUCKET?.head(imageKey) ? `/api/reviews/images/${encodeURIComponent(imageKey)}` : "",
    })));
    return Response.json(response, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load public customer reviews", error);
    return Response.json({ error: "Customer reviews are temporarily unavailable." }, { status: 503 });
  }
}

