"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import "./reviews-editor.css";

type Review = {
  id: string;
  customerName: string;
  role: string;
  company: string;
  headline: string;
  body: string;
  rating: number;
  imageKey: string;
  imageUrl: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

type Draft = Omit<Review, "id" | "createdAt" | "updatedAt" | "rating"> & { id?: string; rating: number | "" };
const blankDraft = (): Draft => ({ customerName: "", role: "", company: "", headline: "", body: "", rating: "", imageKey: "", imageUrl: "", published: true });

export function ReviewsEditor() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("Loading customer reviews…");
  const [error, setError] = useState("");
  const [localPreview, setLocalPreview] = useState("");

  async function loadReviews() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/reviews", { cache: "no-store", credentials: "same-origin" });
      const result = await response.json() as Review[] | { error?: string };
      if (!response.ok || !Array.isArray(result)) throw new Error((result as { error?: string }).error || "Reviews could not be loaded.");
      setReviews(result);
      setStatus(`${result.length} ${result.length === 1 ? "review" : "reviews"} saved in your admin panel.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Reviews could not be loaded. Refresh and try again.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void loadReviews(); }, []);

  function setField<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft(current => ({ ...current, [key]: value }));
  }

  function edit(review: Review) {
    setDraft({ ...review, rating: review.rating || "" });
    setLocalPreview("");
    setError("");
    document.getElementById("review-editor-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetDraft() {
    if (draft.imageKey) {
      void fetch("/api/admin/reviews/images", {
        method: "DELETE", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageKey: draft.imageKey }),
      }).catch(() => {});
    }
    if (localPreview) URL.revokeObjectURL(localPreview);
    setDraft(blankDraft());
    setLocalPreview("");
    setError("");
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("Please choose an image smaller than 4 MB.");
      return;
    }
    setError("");
    setUploading(true);
    const preview = URL.createObjectURL(file);
    try {
      const data = new FormData();
      data.set("image", file);
      const response = await fetch("/api/admin/reviews/images", { method: "POST", credentials: "same-origin", body: data });
      const result = await response.json() as { imageKey?: string; imageUrl?: string; error?: string };
      if (!response.ok || !result.imageKey || !result.imageUrl) throw new Error(result.error || "The image could not be uploaded.");
      const previousKey = draft.imageKey;
      if (previousKey && previousKey !== result.imageKey) {
        void fetch("/api/admin/reviews/images", {
          method: "DELETE", credentials: "same-origin", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageKey: previousKey }),
        }).catch(() => {});
      }
      if (localPreview) URL.revokeObjectURL(localPreview);
      setLocalPreview(preview);
      setDraft(current => ({ ...current, imageKey: result.imageKey!, imageUrl: result.imageUrl! }));
    } catch (cause) {
      URL.revokeObjectURL(preview);
      setError(cause instanceof Error ? cause.message : "The image could not be uploaded.");
    } finally { setUploading(false); }
  }

  async function saveReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = {
        id: draft.id || undefined,
        customerName: draft.customerName.trim(),
        role: draft.role.trim(),
        company: draft.company.trim(),
        headline: draft.headline.trim(),
        body: draft.body.trim(),
        rating: draft.rating === "" ? "" : Number(draft.rating),
        imageKey: draft.imageKey || "",
        published: Boolean(draft.published),
      };
      const response = await fetch("/api/admin/reviews", {
        method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "The review could not be saved.");
      resetDraft();
      await loadReviews();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The review could not be saved. Please try again."); }
    finally { setBusy(false); }
  }

  async function removeReview(review: Review) {
    if (!window.confirm(`Remove the review from ${review.customerName}? This also deletes its thumbnail.`)) return;
    setError("");
    try {
      const response = await fetch(`/api/admin/reviews/${encodeURIComponent(review.id)}`, { method: "DELETE", credentials: "same-origin" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "The review could not be removed.");
      if (draft.id === review.id) resetDraft();
      await loadReviews();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The review could not be removed."); }
  }

  return <section className="editor-section reviews-admin-section">
    <div className="editor-title"><div><h2>Customer reviews</h2><p>Add genuine customer feedback and choose which reviews appear on the website.</p></div><button type="button" className="admin-secondary" onClick={resetDraft}>+ Add review</button></div>
    <p className="reviews-admin-note">All review details are optional. Publish feedback only with the customer’s permission to use it. JPEG, PNG, and WebP thumbnails up to 4 MB are supported.</p>
    {error && <p className="reviews-admin-error" role="alert">{error}</p>}
    <form id="review-editor-form" className="edit-card review-form" onSubmit={saveReview}>
      <div className="edit-card-top"><h3>{draft.id ? "Edit customer review" : "Add a customer review"}</h3>{draft.id && <button type="button" className="remove-button" onClick={resetDraft}>Cancel edit</button>}</div>
      <div className="edit-grid">
        <label>Customer name <span>(optional)</span><input maxLength={100} value={draft.customerName} onChange={e => setField("customerName", e.target.value)} placeholder="Customer’s name" /></label>
        <label>Role / title <span>(optional)</span><input maxLength={100} value={draft.role} onChange={e => setField("role", e.target.value)} placeholder="Product Manager" /></label>
        <label>Company <span>(optional)</span><input maxLength={120} value={draft.company} onChange={e => setField("company", e.target.value)} placeholder="Company name" /></label>
        <label>Rating <span>(optional)</span><select value={draft.rating} onChange={e => setField("rating", e.target.value ? Number(e.target.value) : "")}><option value="">No rating</option>{[5, 4.8, 4.7, 4.5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} out of 5 stars</option>)}</select></label>
        <label className="wide">Review headline <span>(optional)</span><input maxLength={140} value={draft.headline} onChange={e => setField("headline", e.target.value)} placeholder="A clear, concise highlight from the review" /></label>
        <label className="wide">Customer review <span>(optional)</span><textarea rows={5} maxLength={2000} value={draft.body} onChange={e => setField("body", e.target.value)} placeholder="Add the customer’s feedback in their own words." /></label>
        <div className="wide review-image-field"><label htmlFor="review-thumbnail">Customer thumbnail <span>(optional)</span></label><div className="review-image-upload"><div className="review-image-preview">{(localPreview || draft.imageUrl) ? <img src={localPreview || draft.imageUrl} alt="Customer thumbnail preview" /> : <span>Photo<br />preview</span>}</div><div><input id="review-thumbnail" type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage} /><small>Square headshot works best. The image is kept securely and shown only with a saved review.</small>{uploading && <span className="review-uploading" role="status">Uploading thumbnail…</span>}</div></div></div>
        <label className="popular-check review-publish-check"><input type="checkbox" checked={draft.published} onChange={e => setField("published", e.target.checked)} /> Show this review on the website</label>
        <div className="wide review-form-actions"><button className="admin-button" disabled={busy || uploading}>{busy ? "Saving review…" : draft.id ? "Save review" : "Add review"}</button><span>{draft.published ? "Any supplied feedback will be visible on the public website." : "This review will stay private in your admin panel."}</span></div>
      </div>
    </form>
    <div className="reviews-admin-list-head"><h3>Saved reviews</h3><span aria-live="polite">{loading ? "Refreshing…" : status}</span></div>
    {reviews.length === 0 && !loading ? <div className="reviews-admin-empty"><strong>No customer reviews yet</strong><span>Add a review above to start your website’s feedback section.</span></div> : <div className="reviews-admin-list">{reviews.map(review => <article className="reviews-admin-item" key={review.id}>
      {review.imageUrl ? <img src={review.imageUrl} alt="" /> : <div className="reviews-admin-no-image" aria-hidden="true">—</div>}
      <div className="reviews-admin-item-copy"><div className="reviews-admin-meta"><strong>{review.customerName || "Customer review"}</strong><span>{review.published ? "Published" : "Private draft"}</span></div>{(review.role || review.company) && <p>{[review.role, review.company].filter(Boolean).join(" · ")}</p>}{review.headline && <h4>{review.headline}</h4>}{review.body && <p className="reviews-admin-excerpt">{review.body}</p>}</div>
      <div className="reviews-admin-actions"><button type="button" className="admin-secondary" onClick={() => edit(review)}>Edit</button><button type="button" className="remove-button" onClick={() => void removeReview(review)}>Remove</button></div>
    </article>)}</div>}
  </section>;
}
