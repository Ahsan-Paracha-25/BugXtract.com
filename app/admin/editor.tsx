"use client";

import { FormEvent, useEffect, useState } from "react";
import type { PricingContent, Plan, Retainer } from "../../lib/pricing-defaults";
import { defaultPricing, featureLabels } from "../../lib/pricing-defaults";
import { ReviewsEditor } from "./reviews-editor";
import "./editor.css";
import "./usd-input.css";

const blankPlan = (n: number): EditablePlan => ({ id: `custom-${Date.now()}-${n}`, name: "New QA plan", price: "", billing: "Per project", audience: "", hours: "", description: "", popular: false, features: featureLabels.map(() => "Included"), currentMin: "", currentMax: "", originalMin: "", originalMax: "" });
const blankRetainer = (): Retainer => ({ id: `retainer-${Date.now()}`, name: "New retainer", hours: "", price: "Custom quote", description: "" });

type EditablePlan = Plan & { currentMin: string; currentMax: string; originalMin: string; originalMax: string };
type EditablePricing = Omit<PricingContent, "plans"> & { plans: EditablePlan[] };

function splitPriceRange(value: string) {
  const price = value.replace(/\$/g, "").trim();
  const parts = price.split(/\s*(?:\bto\b|–|—|-)\s*/i);
  return { min: parts[0] ?? "", max: parts.length > 1 ? parts.slice(1).join("–") : "" };
}

function formatPriceRange(min: string, max: string) {
  const first = min.replace(/\$/g, "").trim();
  const second = max.replace(/\$/g, "").trim();
  if (first && second) return `$${first}–$${second}`;
  const single = first || second;
  return single ? `$${single}` : "";
}

function toEditablePricing(data: PricingContent): EditablePricing {
  return { ...data, plans: data.plans.map(plan => {
    const current = splitPriceRange(plan.price);
    const original = splitPriceRange(plan.originalPrice ?? "");
    return {
      ...plan,
      audience: plan.audience ?? "",
      description: plan.description ?? "",
      features: Array.isArray(plan.features) && plan.features.length ? plan.features : featureLabels.map(() => "Included"),
      currentMin: current.min,
      currentMax: current.max,
      originalMin: original.min,
      originalMax: original.max,
    };
  }) };
}

function toStoredPricing(data: EditablePricing): PricingContent {
  return { ...data, plans: data.plans.map(plan => {
    const { currentMin, currentMax, originalMin, originalMax, ...stored } = plan;
    return { ...stored, price: formatPriceRange(currentMin, currentMax), originalPrice: formatPriceRange(originalMin, originalMax) };
  }) };
}

export function AdminEditor({ onLogout, username }: { onLogout: () => void; username: string }) {
  const [content, setContent] = useState<EditablePricing>(() => toEditablePricing(defaultPricing));
  const [status, setStatus] = useState("Loading saved plans…");
  const [busy, setBusy] = useState(false);
  const [accountStatus, setAccountStatus] = useState("");
  const [accountBusy, setAccountBusy] = useState(false);
  useEffect(() => { fetch("/api/pricing", { cache: "no-store" }).then(async r => { if (!r.ok) throw new Error("Pricing data could not be loaded."); return r.json() as Promise<PricingContent>; }).then(data => { setContent(toEditablePricing(data)); setStatus("Your current live prices and plan details are loaded."); }).catch(() => setStatus("Showing the current website defaults. Saving will use the protected online database.")); }, []);
  function updatePlan(index: number, patch: Partial<EditablePlan>) { setContent(c => ({ ...c, plans: c.plans.map((p, i) => i === index ? { ...p, ...patch } : p) })); }
  function updateRetainer(index: number, patch: Partial<Retainer>) { setContent(c => ({ ...c, retainers: c.retainers.map((p, i) => i === index ? { ...p, ...patch } : p) })); }
  async function save() {
    setBusy(true); setStatus("Saving changes…");
    try { const response = await fetch("/api/pricing", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(toStoredPricing(content)) }); const result = await response.json() as { error?: string; savedAt?: string }; if (!response.ok) throw new Error(result.error || "Save failed."); setStatus(`Saved successfully at ${new Date(result.savedAt ?? Date.now()).toLocaleString()}. Public pricing is updated.`); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Could not save. Please try again."); }
    finally { setBusy(false); }
  }
  async function updateLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setAccountBusy(true); setAccountStatus("Updating login…");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/auth/credentials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: String(form.get("username") ?? ""), currentPassword: String(form.get("currentPassword") ?? ""), newPassword: String(form.get("newPassword") ?? "") }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not update login.");
      setAccountStatus("Login details updated successfully."); event.currentTarget.reset();
    } catch (error) { setAccountStatus(error instanceof Error ? error.message : "Could not update login."); }
    finally { setAccountBusy(false); }
  }
  return <main className="admin-shell"><header className="admin-head"><div><p className="admin-kicker">BugXtract.com · Secure admin</p><h1>Website content</h1><p>Manage your offers, monthly retainers, and customer reviews.</p></div><div className="admin-head-actions"><span>Signed in as <strong>{username}</strong></span><a className="admin-back" href="/">View website</a><button className="admin-secondary" onClick={onLogout}>Sign out</button></div></header>
    <div className="admin-toolbar"><span aria-live="polite">{status}</span><button className="admin-button" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save and publish changes"}</button></div>
    <section className="editor-section"><div className="editor-title"><div><h2>Project plans</h2><p>Price, hours, audience, description and included coverage.</p></div><button className="admin-secondary" onClick={() => setContent(c => ({ ...c, plans: [...c.plans, blankPlan(c.plans.length)] }))}>+ Add plan</button></div>
      {content.plans.map((plan, i) => <article className="edit-card" key={plan.id}><div className="edit-card-top"><h3>{plan.name || "Untitled plan"}</h3><button className="remove-button" onClick={() => setContent(c => ({ ...c, plans: c.plans.filter((_, index) => index !== i) }))}>Remove plan</button></div>
        <div className="edit-grid"><label>Plan name<input value={plan.name} onChange={e => updatePlan(i, { name: e.target.value })}/></label><label>Discounted / current price<div className="usd-range"><div className="usd-input"><span aria-hidden="true">$</span><input inputMode="decimal" placeholder="90" value={plan.currentMin} onChange={e => updatePlan(i, { currentMin: e.target.value })}/></div><span className="usd-range-to">to</span><div className="usd-input"><span aria-hidden="true">$</span><input inputMode="decimal" placeholder="150" value={plan.currentMax} onChange={e => updatePlan(i, { currentMax: e.target.value })}/></div></div></label><label>Original price (optional)<div className="usd-range"><div className="usd-input"><span aria-hidden="true">$</span><input inputMode="decimal" placeholder="150" value={plan.originalMin} onChange={e => updatePlan(i, { originalMin: e.target.value })}/></div><span className="usd-range-to">to</span><div className="usd-input"><span aria-hidden="true">$</span><input inputMode="decimal" placeholder="300" value={plan.originalMax} onChange={e => updatePlan(i, { originalMax: e.target.value })}/></div></div><small>Enter amounts only; leave both original fields blank to hide the crossed-out price.</small></label><label>Billing period<input value={plan.billing} onChange={e => updatePlan(i, { billing: e.target.value })}/></label><label>Testing hours<input value={plan.hours} onChange={e => updatePlan(i, { hours: e.target.value })}/></label><label>Best suited for<input value={plan.audience} onChange={e => updatePlan(i, { audience: e.target.value })}/></label><label className="popular-check"><input type="checkbox" checked={plan.popular} onChange={e => updatePlan(i, { popular: e.target.checked })}/> Show “Most Popular” badge</label><label className="wide">Plan description<textarea rows={2} value={plan.description} onChange={e => updatePlan(i, { description: e.target.value })}/></label>
          <div className="wide feature-editor"><strong>What's included</strong>{featureLabels.map((feature, fi) => <label key={feature}>{feature}<input value={plan.features[fi] ?? ""} onChange={e => { const features = [...plan.features]; features[fi] = e.target.value; updatePlan(i, { features }); }}/></label>)}</div>
        </div></article>)}
    </section>
    <section className="editor-section"><div className="editor-title"><div><h2>Monthly retainers</h2><p>Set reserved QA hours, monthly prices and descriptions.</p></div><button className="admin-secondary" onClick={() => setContent(c => ({ ...c, retainers: [...c.retainers, blankRetainer()] }))}>+ Add retainer</button></div>
      {content.retainers.map((r, i) => <article className="edit-card" key={r.id}><div className="edit-card-top"><h3>{r.name || "Untitled retainer"}</h3><button className="remove-button" onClick={() => setContent(c => ({ ...c, retainers: c.retainers.filter((_, index) => index !== i) }))}>Remove retainer</button></div><div className="edit-grid"><label>Retainer name<input value={r.name} onChange={e => updateRetainer(i, { name: e.target.value })}/></label><label>Hours per month<input value={r.hours} onChange={e => updateRetainer(i, { hours: e.target.value })}/></label><label>Monthly price<input value={r.price} onChange={e => updateRetainer(i, { price: e.target.value })}/></label><label className="wide">Description<textarea rows={2} value={r.description} onChange={e => updateRetainer(i, { description: e.target.value })}/></label></div></article>)}
    </section>
    <ReviewsEditor />
    <section className="editor-section"><div className="editor-title"><div><h2>Admin login</h2><p>Change the username or password for this panel.</p></div></div><article className="edit-card"><form className="edit-grid" onSubmit={updateLogin}><label>New username<input name="username" minLength={3} maxLength={40} placeholder={username}/></label><label>Current password<input name="currentPassword" type="password" autoComplete="current-password" required/></label><label className="wide">New password <small>Leave blank to keep your current password. If changing it, use at least 12 characters.</small><input name="newPassword" type="password" minLength={12} maxLength={128} autoComplete="new-password"/></label><div className="wide account-actions"><button className="admin-button" disabled={accountBusy}>{accountBusy ? "Updating…" : "Update login"}</button><span role="status">{accountStatus}</span></div></form></article></section>
    <footer className="admin-footer"><p>Changes are stored securely and appear on the public pricing page after saving.</p><button className="admin-button" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save pricing"}</button></footer>
  </main>;
}
