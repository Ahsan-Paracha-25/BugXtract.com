"use client";

import type { TrustMetric } from "../../lib/pricing-defaults";
import "./trust-metrics-editor.css";

const iconNames: Record<TrustMetric["icon"], string> = {
  users: "People",
  document: "Document",
  stars: "Five stars",
  lightning: "Lightning",
};

function MetricSymbol({ icon }: { icon: TrustMetric["icon"] }) {
  if (icon === "stars") return <span className="trust-editor-stars" aria-hidden="true"><span>★★★</span><span>★★</span></span>;
  if (icon === "users") return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="17" cy="17" r="5"/><path d="M5 37v-4c0-6 5-10 12-10s12 4 12 10v4M33 12a5 5 0 0 1 0 10m3 5c4 1 7 4 7 9v1"/></svg>;
  if (icon === "document") return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5h17l8 8v29H12a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3ZM29 5v9h8M17 23h14M17 30h14M17 37h10"/></svg>;
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M27 3 8 26h14l-2 19 20-25H26l1-17Z"/></svg>;
}

export function TrustMetricsEditor({ metrics, onChange, onSave, busy, status }: {
  metrics: TrustMetric[];
  onChange: (metrics: TrustMetric[]) => void;
  onSave: () => void;
  busy: boolean;
  status: string;
}) {
  const update = (index: number, patch: Partial<TrustMetric>) => onChange(metrics.map((metric, i) => i === index ? { ...metric, ...patch } : metric));
  const move = (index: number, step: number) => {
    const next = [...metrics];
    [next[index], next[index + step]] = [next[index + step], next[index]];
    onChange(next);
  };
  const add = () => onChange([...metrics, { id: `metric-${Date.now()}`, value: "", label: "", icon: "users", visible: false }]);
  return <section className="editor-section trust-admin-section" aria-labelledby="trust-admin-title">
    <div className="editor-title"><div><h2 id="trust-admin-title">Trust metrics</h2><p>Edit the numbers and labels shown on your homepage. Each card can be reordered or hidden.</p></div><button type="button" className="admin-secondary" onClick={add} disabled={metrics.length >= 8}>+ Add metric</button></div>
    <div className="trust-admin-rows">
      {metrics.map((metric, index) => <article className="trust-admin-row" key={metric.id}>
        <div className="trust-admin-row-top"><strong>Metric {index + 1}</strong><div className="trust-admin-row-actions"><button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${metric.label || `metric ${index + 1}`} up`}>↑</button><button type="button" onClick={() => move(index, 1)} disabled={index === metrics.length - 1} aria-label={`Move ${metric.label || `metric ${index + 1}`} down`}>↓</button><button type="button" className="trust-admin-remove" onClick={() => onChange(metrics.filter((_, i) => i !== index))} aria-label={`Remove ${metric.label || `metric ${index + 1}`}`}>Remove</button></div></div>
        <div className="trust-admin-fields">
          <label>Number<input value={metric.value} maxLength={24} placeholder="e.g. 50+" onChange={event => update(index, { value: event.target.value })}/></label>
          <label>Label<input value={metric.label} maxLength={80} placeholder="e.g. Happy Customers" onChange={event => update(index, { label: event.target.value })}/></label>
          <label>Icon<select value={metric.icon} onChange={event => update(index, { icon: event.target.value as TrustMetric["icon"] })}>{Object.entries(iconNames).map(([key, name]) => <option value={key} key={key}>{name}</option>)}</select></label>
          <label className="trust-admin-visible"><input type="checkbox" checked={metric.visible} onChange={event => update(index, { visible: event.target.checked })}/><span>Visible</span></label>
        </div>
      </article>)}
    </div>
    <div className="trust-admin-preview" aria-label="Trust metrics preview"><div className="trust-admin-preview-head"><strong>Website preview</strong><span>{metrics.filter(metric => metric.visible).length} visible</span></div><div className="trust-admin-preview-grid">{metrics.filter(metric => metric.visible).map(metric => <div className={`trust-admin-preview-card trust-admin-preview-${metric.icon}`} key={metric.id}><span className="trust-admin-preview-icon"><MetricSymbol icon={metric.icon}/></span><span><strong>{metric.value || "—"}</strong><small>{metric.label || "Untitled metric"}</small></span></div>)}</div>{metrics.every(metric => !metric.visible) && <p>No metrics are visible. Turn on a card above to show this section on the website.</p>}</div>
    <div className="trust-admin-save"><span role="status">{status}</span><button type="button" className="admin-button" disabled={busy || metrics.some(metric => !metric.value.trim() || !metric.label.trim())} onClick={onSave}>{busy ? "Saving…" : "Save and publish metrics"}</button></div>
  </section>;
}
