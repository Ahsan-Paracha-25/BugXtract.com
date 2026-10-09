import { env } from "@/lib/runtime-env";
import { getAdminUsername, sameOriginRequest } from "../../../../../lib/admin-auth";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await getAdminUsername(request))) return Response.json({ error: "Please sign in to the admin panel." }, { status: 401 });
  if (!sameOriginRequest(request)) return Response.json({ error: "This request could not be verified." }, { status: 403 });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "Review not found." }, { status: 404 });

  try {
    if (!env.DB || !env.BUCKET) throw new Error("Review storage is unavailable.");
    const review = await env.DB.prepare("SELECT image_key AS imageKey FROM customer_reviews WHERE id = ?").bind(id).first<{ imageKey: string }>();
    if (!review) return Response.json({ error: "Review not found." }, { status: 404 });
    await env.DB.prepare("DELETE FROM customer_reviews WHERE id = ?").bind(id).run();
    try { await env.BUCKET.delete(review.imageKey); }
    catch (error) { console.error("Removed review but could not clean up its thumbnail", error); }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Could not delete customer review", error);
    return Response.json({ error: "The review could not be deleted. Please try again." }, { status: 503 });
  }
}

