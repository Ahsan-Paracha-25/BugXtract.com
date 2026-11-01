"use client";

import { useEffect, useMemo, useState } from "react";
import "./analytics-editor.css";
import "./analytics-live.css";

type CountRow = { label: string; views: number; visitors: number };
type DemandRow = { label: string; inquiries: number };
type LiveRow = { label: string; visitors: number };
type EngagementRow = { label: string; visitors: number; seconds: number };
type Analytics = { today: { views: number; visitors: number }; month: { views: number; visitors: number }; conversion: { inquiriesToday: number; inquiries30Days: number; visitorsPrevious30Days: number; inquiriesPrevious30Days: number }; inquiryDemand: { services: DemandRow[]; packages: DemandRow[]; statuses: DemandRow[] }; live: { active: number; pages: LiveRow[]; devices: LiveRow[]; windowMinutes: number }; sectionActivity: { live: LiveRow[]; engagement: EngagementRow[] }; countries: CountRow[]; pages: CountRow[]; sources: CountRow[]; devices: CountRow[]; themes: CountRow[]; daily: { day: string; views: number; visitors: number }[]; publicMetricsEnabled: boolean; privacy: string; error?: string };

function countryName(code: string) {
  if (code === "XX") return "Country unavailable";
  try { return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code; }
  catch { return code; }
}

function AnalyticsTable({ title, rows, country = false }: { title: string; rows: CountRow[]; country?: boolean }) {
  return <section className="analytics-table"><h3>{title}</h3>{rows.length ? <div>{rows.map(row => <article key={row.label}><span>{country ? countryName(row.label) : row.label}</span><small>{row.visitors} visitors · {row.views} views</small></article>)}</div> : <p>No visitor data yet. Analytics starts collecting after this version is deployed.</p>}</section>;
}

function DemandTable({ title, rows }: { title: string; rows: DemandRow[] }) {
  return <section className="analytics-table analytics-demand"><h3>{title}</h3>{rows.length ? <div>{rows.map(row => <article key={row.label}><span>{row.label}</span><small>{row.inquiries} {row.inquiries === 1 ? "inquiry" : "inquiries"}</small></article>)}</div> : <p>No inquiries in this period yet.</p>}</section>;
}

function LiveTable({ title, rows }: { title: string; rows: LiveRow[] }) {
  return <section className="analytics-live-table"><h3>{title}</h3>{rows.length ? <div>{rows.map(row => <article key={row.label}><span>{row.label === "/" ? "Homepage" : row.label}</span><small>{row.visitors} active</small></article>)}</div> : <p>No active visitors in the last 5 minutes.</p>}</section>;
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60); const remaining = seconds % 60;
  return remaining ? `${minutes}m ${remaining}s` : `${minutes}m`;
}

function EngagementTable({ rows }: { rows: EngagementRow[] }) {
  return <section className="analytics-engagement-table"><h3>Most engaged sections · 30 days</h3>{rows.length ? <div>{rows.map(row => <article key={row.label}><span>{row.label}</span><small><b>{formatDuration(row.seconds)}</b> · {row.visitors} {row.visitors === 1 ? "visitor" : "visitors"}</small></article>)}</div> : <p>Engagement data will appear after visitors browse the updated website.</p>}</section>;
}

function percentage(inquiries: number, visitors: number) {
  if (!visitors) return "—";
  return `${((inquiries / visitors) * 100).toFixed(1)}%`;
}

function csvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
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
  useEffect(() => { const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 30000); return () => window.clearInterval(timer); }, []);
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
  function downloadReport() {
    if (!data) return;
    const rows: Array<Array<string | number>> = [["BugXtract visitor analytics report", "Generated", new Date().toISOString()], [], ["Summary", "Value"], ["Visitors today", data.today.visitors], ["Page views today", data.today.views], ["Inquiries today", data.conversion.inquiriesToday], ["Visitors - last 30 days", data.month.visitors], ["Page views - last 30 days", data.month.views], ["Inquiries - last 30 days", data.conversion.inquiries30Days], ["Inquiry conversion - last 30 days", percentage(data.conversion.inquiries30Days, data.month.visitors)], ["Inquiry conversion - previous 30 days", percentage(data.conversion.inquiriesPrevious30Days, data.conversion.visitorsPrevious30Days)]];
    const addDemand = (title: string, values: DemandRow[]) => { rows.push([], [title, "Inquiries"]); values.forEach(item => rows.push([item.label, item.inquiries])); };
    const addVisitorRows = (title: string, values: CountRow[], country = false) => { rows.push([], [title, "Visitors", "Views"]); values.forEach(item => rows.push([country ? countryName(item.label) : item.label, item.visitors, item.views])); };
    addDemand("Requested services", data.inquiryDemand.services); addDemand("Preferred packages", data.inquiryDemand.packages); addDemand("Lead status", data.inquiryDemand.statuses);
    addVisitorRows("Visitors by country", data.countries, true); addVisitorRows("Most visited pages", data.pages); addVisitorRows("Traffic sources", data.sources); addVisitorRows("Devices", data.devices); addVisitorRows("Theme preference", data.themes);
    rows.push([], ["Section engagement - 30 days", "Visitors", "Estimated engagement"]); data.sectionActivity.engagement.forEach(item => rows.push([item.label, item.visitors, formatDuration(item.seconds)]));
    const blob = new Blob([`\uFEFF${rows.map(row => row.map(csvCell).join(",")).join("\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = `bugxtract-visitor-analytics-${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    setMessage("Analytics CSV report downloaded.");
  }
  const trend = useMemo(() => data?.daily.slice(-7).map(item => `${item.day}: ${item.visitors} visitors`).join(" · ") || "No activity yet", [data]);
  const cards = data ? [["Live now", data.live.active], ["Visitors today", data.today.visitors], ["Inquiries today", data.conversion.inquiriesToday], ["Visitors · 30 days", data.month.visitors], ["Inquiries · 30 days", data.conversion.inquiries30Days], ["Inquiry conversion", percentage(data.conversion.inquiries30Days, data.month.visitors)], ["Page views · 30 days", data.month.views]] : [];
  const previousRate = data ? percentage(data.conversion.inquiriesPrevious30Days, data.conversion.visitorsPrevious30Days) : "—";
  return (
    <section className="editor-section analytics-section">
      <div className="editor-title"><div><h2>Visitor analytics</h2><p>Private, anonymous website activity. Public reach stays off until you enable it below.</p></div><div className="analytics-actions"><button className="admin-secondary" onClick={downloadReport} disabled={!data}>Download CSV</button><button className="admin-secondary" onClick={() => void load()}>Refresh analytics</button></div></div>
      <p className="lead-status" role="status">{message}</p>
      <div className="analytics-cards">{cards.map(([label, value]) => <article key={String(label)}><span>{label}</span><strong>{value}</strong></article>)}</div>
      {data && <>
        <section className="analytics-live"><div><p className="analytics-live-kicker"><span /> Live visitor activity</p><h3>{data.live.active} active {data.live.active === 1 ? "visitor" : "visitors"} now</h3><p>Anonymous visitors seen in the last {data.live.windowMinutes} minutes. This refreshes automatically while this page is open.</p></div><div className="analytics-live-grid analytics-live-grid-three"><LiveTable title="Current pages" rows={data.live.pages} /><LiveTable title="Current sections" rows={data.sectionActivity.live} /><LiveTable title="Devices now" rows={data.live.devices} /></div></section>
        <section className="analytics-engagement"><div><p className="analytics-live-kicker"><span /> Engagement time</p><h3>Where visitors spend their attention</h3><p>Estimated visible time is recorded in coarse 30-second intervals only while a page is open and visible.</p></div><EngagementTable rows={data.sectionActivity.engagement} /></section>
        <section className="analytics-conversion"><div><h3>Visitor-to-inquiry performance</h3><p>This compares anonymous website visitors with Contact Us submissions. It helps you measure whether your website is turning interest into inquiries.</p></div><div className="analytics-conversion-stats"><article><span>Current 30 days</span><strong>{percentage(data.conversion.inquiries30Days, data.month.visitors)}</strong></article><article><span>Previous 30 days</span><strong>{previousRate}</strong></article></div></section>
        <section className="analytics-demand-section"><h3>What prospects are asking for</h3><p>Contact form demand from the last 30 days, so you can focus your offers and follow-ups.</p><div className="analytics-demand-grid"><DemandTable title="Requested services" rows={data.inquiryDemand.services} /><DemandTable title="Preferred packages" rows={data.inquiryDemand.packages} /><DemandTable title="Lead status" rows={data.inquiryDemand.statuses} /></div></section>
        <section className="analytics-public-control"><div><h3>Public visitor reach</h3><p>When enabled, the homepage can show only the total visitors and countries from the last 30 days. Individual visitor data remains private.</p></div><label className="analytics-toggle"><input type="checkbox" checked={data.publicMetricsEnabled} disabled={visibilityBusy} onChange={event => void setPublicVisibility(event.target.checked)} /><span>{data.publicMetricsEnabled ? "Shown on homepage" : "Keep private"}</span></label></section>
        <section className="analytics-trend"><h3>Last 7 days</h3><p>{trend}</p></section>
        <div className="analytics-grid"><AnalyticsTable title="Visitors by country" rows={data.countries} country /><AnalyticsTable title="Most visited pages" rows={data.pages} /><AnalyticsTable title="Traffic sources" rows={data.sources} /><AnalyticsTable title="Devices" rows={data.devices} /><AnalyticsTable title="Theme preference" rows={data.themes} /></div>
        <p className="analytics-privacy">{data.privacy}</p>
      </>}
    </section>
  );
}
