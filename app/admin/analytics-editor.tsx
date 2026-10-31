"use client";

import { useEffect, useMemo, useState } from "react";
import "./analytics-editor.css";

type CountRow = { label: string; views: number; visitors: number };
type Analytics = { today: { views: number; visitors: number }; month: { views: number; visitors: number }; countries: CountRow[]; pages: CountRow[]; sources: CountRow[]; devices: CountRow[]; themes: CountRow[]; daily: { day: string; views: number; visitors: number }[]; publicMetricsEnabled: boolean; privacy: string; error?: string };

function countryName(code: string) {
  if (code === "XX") return "Country unavailable";
  try { return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code; }
  catch { return code; }
}

function AnalyticsTable({ title, rows, country = false }: { title: string; rows: CountRow[]; country?: boolean }) {
  return <section className="analytics-table"><h3>{title}</h3>{rows.length ? <div>{rows.map(row => <article key={row.label}><span>{country ? countryName(row.label) : row.label}</span><small>{row.visitors} visitors · {row.views} views</small></article>)}</div> : <p>No visitor data yet. Analytics starts collecting after this version is deployed.</p>}</section>;
}

export function AnalyticsEditor() {
  const [data, setData] = useState<Analytics | null>(null);
  const [message, setMessage] = useState("Loading visitor analytics…");
  const [visibilityBusy, setVisibilityBusy] = useState(false);
  async function load() {
    setMessage("Loading visitor analytics…");
    try {
      const response = await fetch("/api/admin/analytics", { cache: "no-store", credentials: "same-origin" });
      const result = await response.json() as Analytics;
      if (!response.ok) throw new Error(result.error || "Visitor analytics could not be loaded.");
      setData(result); setMessage("Visitor analytics updated.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Visitor analytics could not be loaded."); }
  }
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, []);
  async function setPublicVisibility(publicMetricsEnabled: boolean) {
    setVisibilityBusy(true);
    setMessage(publicMetricsEnabled ? "Making the aggregate visitor card public…" : "Hiding the public visitor card…");
    try {
      const response = await fetch("/api/admin/analytics", { method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicMetricsEnabled }) });
      const result = await response.json() as { error?: string; publicMetricsEnabled?: boolean };
      if (!response.ok) throw new Error(result.error || "The public visibility setting could not be updated.");
      setData(current => current ? { ...current, publicMetricsEnabled: Boolean(result.publicMetricsEnabled) } : current);
      setMessage(publicMetricsEnabled ? "Public visitor reach is now enabled on the homepage." : "Public visitor reach is now hidden from the homepage.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "The public visibility setting could not be updated."); }
    finally { setVisibilityBusy(false); }
  }
  const trend = useMemo(() => data?.daily.slice(-7).map(item => `${item.day}: ${item.visitors} visitors`).join(" · ") || "No activity yet", [data]);
  const cards = data ? [["Visitors today", data.today.visitors], ["Page views today", data.today.views], ["Visitors · 30 days", data.month.visitors], ["Page views · 30 days", data.month.views]] : [];
  return <section className="editor-section analytics-section"><div className="editor-title"><div><h2>Visitor analytics</h2><p>Private, anonymous website activity. Public reach stays off until you enable it below.</p></div><button className="admin-secondary" onClick={() => void load()}>Refresh analytics</button></div><p className="lead-status" role="status">{message}</p><div className="analytics-cards">{cards.map(([label, value]) => <article key={String(label)}><span>{label}</span><strong>{value}</strong></article>)}</div>{data && <><section className="analytics-public-control"><div><h3>Public visitor reach</h3><p>When enabled, the homepage can show only the total visitors and countries from the last 30 days. Individual visitor data remains private.</p></div><label className="analytics-toggle"><input type="checkbox" checked={data.publicMetricsEnabled} disabled={visibilityBusy} onChange={event => void setPublicVisibility(event.target.checked)} /><span>{data.publicMetricsEnabled ? "Shown on homepage" : "Keep private"}</span></label></section><section className="analytics-trend"><h3>Last 7 days</h3><p>{trend}</p></section><div className="analytics-grid"><AnalyticsTable title="Visitors by country" rows={data.countries} country /><AnalyticsTable title="Most visited pages" rows={data.pages} /><AnalyticsTable title="Traffic sources" rows={data.sources} /><AnalyticsTable title="Devices" rows={data.devices} /><AnalyticsTable title="Theme preference" rows={data.themes} /></div><p className="analytics-privacy">{data.privacy}</p></>}</section>;
}
