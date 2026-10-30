"use client";

import { useEffect, useMemo, useState } from "react";
import { leadStatuses, type LeadStatus } from "../../lib/lead-status";
import type { ContactLead } from "../../lib/contact-leads";
import "./leads-editor.css";

type LeadResponse = { leads?: ContactLead[]; error?: string };

function displayDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function parseResponse(response: Response): Promise<LeadResponse> {
  return response.headers.get("content-type")?.includes("application/json")
    ? response.json() as Promise<LeadResponse>
    : Promise.resolve({ error: `The leads service is unavailable (HTTP ${response.status}).` });
}

export function LeadsEditor() {
  const [leads, setLeads] = useState<ContactLead[]>([]);
  const [selected, setSelected] = useState<ContactLead | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | LeadStatus>("All");
  const [status, setStatus] = useState("Loading inquiries…");
  const [busyId, setBusyId] = useState("");

  async function loadLeads() {
    setStatus("Loading inquiries…");
    try {
      const response = await fetch("/api/admin/leads", { cache: "no-store", credentials: "same-origin" });
      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.error || "Leads could not be loaded.");
      setLeads(data.leads || []);
      setStatus(data.leads?.length ? `${data.leads.length} ${data.leads.length === 1 ? "inquiry" : "inquiries"} saved.` : "No inquiries have been received yet.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Leads could not be loaded."); }
  }

  useEffect(() => {
    // Schedule the initial request after the admin shell has painted.
    const timer = window.setTimeout(() => { void loadLeads(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredLeads = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return leads.filter(lead => (filter === "All" || lead.status === filter) && (!needle || [lead.name, lead.email, lead.company, lead.whatsapp].some(value => value.toLowerCase().includes(needle))));
  }, [filter, leads, query]);

  async function changeStatus(lead: ContactLead, nextStatus: LeadStatus) {
    setBusyId(lead.id); setStatus("Updating lead status…");
    try {
      const response = await fetch("/api/admin/leads", { method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: lead.id, status: nextStatus }) });
      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.error || "Status could not be updated.");
      const updated = { ...lead, status: nextStatus, updatedAt: new Date().toISOString() };
      setLeads(current => current.map(item => item.id === lead.id ? updated : item));
      setSelected(current => current?.id === lead.id ? updated : current);
      setStatus(`Status updated to ${nextStatus}.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Status could not be updated."); }
    finally { setBusyId(""); }
  }

  async function deleteLead(lead: ContactLead) {
    if (!window.confirm(`Delete ${lead.name}'s inquiry? This cannot be undone.`)) return;
    setBusyId(lead.id); setStatus("Deleting inquiry…");
    try {
      const response = await fetch(`/api/admin/leads?id=${encodeURIComponent(lead.id)}`, { method: "DELETE", credentials: "same-origin" });
      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.error || "Lead could not be deleted.");
      setLeads(current => current.filter(item => item.id !== lead.id));
      setSelected(current => current?.id === lead.id ? null : current);
      setStatus("Inquiry deleted.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Lead could not be deleted."); }
    finally { setBusyId(""); }
  }

  return <section className="editor-section leads-section" aria-labelledby="lead-inbox-title">
    <div className="editor-title"><div><h2 id="lead-inbox-title">Lead inbox</h2><p>Every successful Contact Us inquiry is saved here, alongside the email sent to your inbox.</p></div><button className="admin-secondary" onClick={loadLeads} disabled={Boolean(busyId)}>Refresh leads</button></div>
    <div className="lead-controls"><label>Search inquiries<input value={query} onChange={event => setQuery(event.target.value)} placeholder="Name, email, company or WhatsApp" /></label><label>Status<select value={filter} onChange={event => setFilter(event.target.value as "All" | LeadStatus)}><option>All</option>{leadStatuses.map(item => <option key={item}>{item}</option>)}</select></label></div>
    <p className="lead-status" role="status">{status}</p>
    <div className="lead-list" aria-label="Saved contact inquiries">
      {filteredLeads.map(lead => <article className={`lead-row${selected?.id === lead.id ? " selected" : ""}`} key={lead.id}>
        <button className="lead-summary" onClick={() => setSelected(lead)} aria-expanded={selected?.id === lead.id}><strong>{lead.name}</strong><span>{lead.email}</span><span>{lead.company || "Independent inquiry"} · {lead.service}</span><time dateTime={lead.createdAt}>{displayDate(lead.createdAt)}</time></button>
        <select aria-label={`Status for ${lead.name}`} value={lead.status} disabled={busyId === lead.id} onChange={event => changeStatus(lead, event.target.value as LeadStatus)}>{leadStatuses.map(item => <option key={item}>{item}</option>)}</select>
        <button className="lead-delete" disabled={busyId === lead.id} onClick={() => deleteLead(lead)}>Delete</button>
      </article>)}
      {!filteredLeads.length && <p className="lead-empty">No inquiries match this view.</p>}
    </div>
    {selected && <article className="lead-detail"><div className="lead-detail-head"><div><p className="admin-kicker">Inquiry details</p><h3>{selected.name}</h3></div><button className="admin-secondary" onClick={() => setSelected(null)}>Close details</button></div><dl>
      <div><dt>Email</dt><dd><a href={`mailto:${selected.email}`}>{selected.email}</a></dd></div><div><dt>WhatsApp</dt><dd>{selected.whatsapp || "Not provided"}</dd></div><div><dt>Company</dt><dd>{selected.company || "Not provided"}</dd></div><div><dt>Website</dt><dd>{selected.website ? <a href={selected.website} target="_blank" rel="noreferrer">{selected.website}</a> : "Not provided"}</dd></div>
      <div><dt>Service</dt><dd>{selected.service}</dd></div><div><dt>Package</dt><dd>{selected.plan}</dd></div><div><dt>Target release</dt><dd>{selected.timeline || "Not provided"}</dd></div><div><dt>Budget</dt><dd>{selected.budget || "Not provided"}</dd></div><div><dt>Received</dt><dd>{displayDate(selected.createdAt)}</dd></div><div><dt>Current status</dt><dd>{selected.status}</dd></div>
    </dl><div className="lead-message"><strong>Project details</strong><p>{selected.message}</p></div></article>}
  </section>;
}
