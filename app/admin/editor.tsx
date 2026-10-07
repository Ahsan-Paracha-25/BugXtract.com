"use client";

import { useEffect, useState } from "react";
import type { PricingContent, Plan, Retainer } from "../../lib/pricing-defaults";
import { defaultPricing, featureLabels } from "../../lib/pricing-defaults";
import "./editor.css";

const blankPlan = (n: number): Plan => ({ id: `custom-${Date.now()}-${n}`, name: "New QA plan", price: "Custom quote", billing: "Per project", audience: "", hours: "", description: "", popular: false, features: featureLabels.map(() => "Included") });
const blankRetainer = (): Retainer => ({ id: `retainer-${Date.now()}`, name: "New retainer", hours: "", price: "Custom quote", description: "" });

export function AdminEditor() {
  const [content, setContent] = useState<PricingContent>(defaultPricing);
  const [status, setStatus] = useState("Loading saved plans…");
  const [busy, setBusy] = useState(false);
  useEffect(() => { fetch("/api/pricing", { cache: "no-store" }).then(async r => { if (!r.ok) throw new Error("Pricing data could not be loaded."); return r.json() as Promise<PricingContent>; }).then(data => { setContent(data); setStatus("Your current live prices and plan details are loaded."); }).catch(() => setStatus("Showing the current website defaults. Saving will use the protected online database.")); }, []);
  function updatePlan(index: number, patch: Partial<Plan>) { setContent(c => ({ ...c, plans: c.plans.map((p, i) => i === index ? { ...p, ...patch } : p) })); }
  function updateRetainer(index: number, patch: Partial<Retainer>) { setContent(c => ({ ...c, retainers: c.retainers.map((p, i) => i === index ? { ...p, ...patch } : p) })); }
  async function save() {
    setBusy(true); setStatus("Saving changes…");
    try { const response = await fetch("/api/pricing", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(content) }); const result = await response.json() as { error?: string; savedAt?: string }; if (!response.ok) throw new Error(result.error || "Save failed."); setStatus(`Saved successfully at ${new Date(result.savedAt ?? Date.now()).toLocaleString()}. Public pricing is updated.`); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Could not save. Please try again."); }
    finally { setBusy(false); }
  }
  return <main className="admin-shell"><header className="admin-head"><div><p className="admin-kicker">BugXtract.com · Secure admin</p><h1>Plans & pricing</h1><p>Edit the offers visitors see on your website.</p></div><a className="admin-back" href="/">← View website</a></header>
    <div className="admin-toolbar"><span aria-live="polite">{status}</span><button className="admin-button" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save and publish changes"}</button></div>
    <section className="editor-section"><div className="editor-title"><div><h2>Project plans</h2><p>Price, hours, audience, description and included coverage.</p></div><button className="admin-secondary" onClick={() => setContent(c => ({ ...c, plans: [...c.plans, blankPlan(c.plans.length)] }))}>+ Add plan</button></div>
      {content.plans.map((plan, i) => <article className="edit-card" key={plan.id}><div className="edit-card-top"><h3>{plan.name || "Untitled plan"}</h3><button className="remove-button" onClick={() => setContent(c => ({ ...c, plans: c.plans.filter((_, index) => index !== i) }))}>Remove plan</button></div>
        <div className="edit-grid"><label>Plan name<input value={plan.name} onChange={e => updatePlan(i, { name: e.target.value })}/></label><label>Price / range<input value={plan.price} onChange={e => updatePlan(i, { price: e.target.value })}/></label><label>Billing period<input value={plan.billing} onChange={e => updatePlan(i, { billing: e.target.value })}/></label><label>Testing hours<input value={plan.hours} onChange={e => updatePlan(i, { hours: e.target.value })}/></label><label>Best suited for<input value={plan.audience} onChange={e => updatePlan(i, { audience: e.target.value })}/></label><label className="popular-check"><input type="checkbox" checked={plan.popular} onChange={e => updatePlan(i, { popular: e.target.checked })}/> Show “Most Popular” badge</label><label className="wide">Plan description<textarea rows={2} value={plan.description} onChange={e => updatePlan(i, { description: e.target.value })}/></label>
          <div className="wide feature-editor"><strong>What's included</strong>{featureLabels.map((feature, fi) => <label key={feature}>{feature}<input value={plan.features[fi] ?? ""} onChange={e => { const features = [...plan.features]; features[fi] = e.target.value; updatePlan(i, { features }); }}/></label>)}</div>
        </div></article>)}
    </section>
    <section className="editor-section"><div className="editor-title"><div><h2>Monthly retainers</h2><p>Set reserved QA hours, monthly prices and descriptions.</p></div><button className="admin-secondary" onClick={() => setContent(c => ({ ...c, retainers: [...c.retainers, blankRetainer()] }))}>+ Add retainer</button></div>
      {content.retainers.map((r, i) => <article className="edit-card" key={r.id}><div className="edit-card-top"><h3>{r.name || "Untitled retainer"}</h3><button className="remove-button" onClick={() => setContent(c => ({ ...c, retainers: c.retainers.filter((_, index) => index !== i) }))}>Remove retainer</button></div><div className="edit-grid"><label>Retainer name<input value={r.name} onChange={e => updateRetainer(i, { name: e.target.value })}/></label><label>Hours per month<input value={r.hours} onChange={e => updateRetainer(i, { hours: e.target.value })}/></label><label>Monthly price<input value={r.price} onChange={e => updateRetainer(i, { price: e.target.value })}/></label><label className="wide">Description<textarea rows={2} value={r.description} onChange={e => updateRetainer(i, { description: e.target.value })}/></label></div></article>)}
    </section>
    <footer className="admin-footer"><p>Changes are stored securely and appear on the public pricing page after saving.</p><button className="admin-button" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save pricing"}</button></footer>
  </main>;
}
