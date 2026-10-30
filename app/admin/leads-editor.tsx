"use client";

import { useEffect, useMemo, useState } from "react";
import { leadStatuses, leadTypes, type LeadStatus, type LeadType } from "../../lib/lead-status";
import type { ContactLead, LeadActivity, LeadNote } from "../../lib/contact-leads";
import "./leads-editor.css";

type LeadResponse = { leads?: ContactLead[]; lead?: ContactLead; notes?: LeadNote[]; activity?: LeadActivity[]; error?: string };
type LeadDetails = { lead: ContactLead; notes: LeadNote[]; activity: LeadActivity[] };
const displayDate = (value: string) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString(); };
const displayDateOnly = (value: string) => value ? value.slice(0, 10) : "Not scheduled";
const parseResponse = (response: Response): Promise<LeadResponse> => response.headers.get("content-type")?.includes("application/json") ? response.json() as Promise<LeadResponse> : Promise.resolve({ error: `The leads service is unavailable (HTTP ${response.status}).` });

export function LeadsEditor() {
  const [leads, setLeads] = useState<ContactLead[]>([]);
  const [selected, setSelected] = useState<LeadDetails | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | LeadStatus>("All");
  const [status, setStatus] = useState("Loading inquiries…");
  const [busyId, setBusyId] = useState("");
  const [note, setNote] = useState("");

  async function loadLeads() {
    setStatus("Loading inquiries…");
    try { const response = await fetch("/api/admin/leads", { cache: "no-store", credentials: "same-origin" }); const data = await parseResponse(response); if (!response.ok) throw new Error(data.error || "Leads could not be loaded."); setLeads(data.leads || []); setStatus(data.leads?.length ? `${data.leads.length} ${data.leads.length === 1 ? "inquiry" : "inquiries"} saved.` : "No inquiries have been received yet."); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Leads could not be loaded."); }
  }
  useEffect(() => { const timer = window.setTimeout(() => { void loadLeads(); }, 0); return () => window.clearTimeout(timer); }, []);
  const filteredLeads = useMemo(() => { const needle = query.trim().toLowerCase(); return leads.filter(lead => (filter === "All" || lead.status === filter) && (!needle || [lead.name, lead.email, lead.company, lead.whatsapp].some(value => value.toLowerCase().includes(needle)))); }, [filter, leads, query]);

  async function openLead(lead: ContactLead) {
    setBusyId(lead.id); setStatus("Loading inquiry details…"); setNote("");
    try { const response = await fetch(`/api/admin/leads?id=${encodeURIComponent(lead.id)}`, { cache: "no-store", credentials: "same-origin" }); const data = await parseResponse(response); if (!response.ok || !data.lead) throw new Error(data.error || "Lead details could not be loaded."); setSelected({ lead: data.lead, notes: data.notes || [], activity: data.activity || [] }); setStatus("Inquiry details loaded."); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Lead details could not be loaded."); }
    finally { setBusyId(""); }
  }
  async function saveLead(patch: Partial<Pick<ContactLead, "status" | "leadType" | "followUpAt">>) {
    if (!selected) return; const lead = selected.lead; setBusyId(lead.id); setStatus("Saving lead details…");
    try { const next = { ...lead, ...patch }; const response = await fetch("/api/admin/leads", { method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: lead.id, status: next.status, leadType: next.leadType, followUpAt: next.followUpAt }) }); const data = await parseResponse(response); if (!response.ok) throw new Error(data.error || "Lead details could not be updated."); setLeads(current => current.map(item => item.id === lead.id ? next : item)); await openLead(next); setStatus("Lead details saved."); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Lead details could not be updated."); }
    finally { setBusyId(""); }
  }
  async function addNote() {
    if (!selected || !note.trim()) return; const lead = selected.lead; setBusyId(lead.id); setStatus("Saving private note…");
    try { const response = await fetch("/api/admin/leads", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: lead.id, note }) }); const data = await parseResponse(response); if (!response.ok) throw new Error(data.error || "Note could not be saved."); setNote(""); await openLead(lead); setStatus("Private note saved."); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Note could not be saved."); }
    finally { setBusyId(""); }
  }
  async function deleteLead(lead: ContactLead) {
    if (!window.confirm(`Delete ${lead.name}'s inquiry? This cannot be undone.`)) return; setBusyId(lead.id); setStatus("Deleting inquiry…");
    try { const response = await fetch(`/api/admin/leads?id=${encodeURIComponent(lead.id)}`, { method: "DELETE", credentials: "same-origin" }); const data = await parseResponse(response); if (!response.ok) throw new Error(data.error || "Lead could not be deleted."); setLeads(current => current.filter(item => item.id !== lead.id)); setSelected(current => current?.lead.id === lead.id ? null : current); setStatus("Inquiry deleted."); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Lead could not be deleted."); }
    finally { setBusyId(""); }
  }

  return <section className="editor-section leads-section" aria-labelledby="lead-inbox-title"><div className="editor-title"><div><h2 id="lead-inbox-title">Lead inbox</h2><p>Manage incoming inquiries, customer type, follow-ups, and your private sales notes.</p></div><button className="admin-secondary" onClick={loadLeads} disabled={Boolean(busyId)}>Refresh leads</button></div><div className="lead-controls"><label>Search inquiries<input value={query} onChange={event => setQuery(event.target.value)} placeholder="Name, email, company or WhatsApp" /></label><label>Status<select value={filter} onChange={event => setFilter(event.target.value as "All" | LeadStatus)}><option>All</option>{leadStatuses.map(item => <option key={item}>{item}</option>)}</select></label></div><p className="lead-status" role="status">{status}</p><div className="lead-list" aria-label="Saved contact inquiries">{filteredLeads.map(lead => <article className={`lead-row${selected?.lead.id === lead.id ? " selected" : ""}`} key={lead.id}><button className="lead-summary" onClick={() => void openLead(lead)} disabled={busyId === lead.id} aria-expanded={selected?.lead.id === lead.id}><strong>{lead.name}</strong><span>{lead.email}</span><span>{lead.company || "Independent inquiry"} · {lead.service}</span><time dateTime={lead.createdAt}>{displayDate(lead.createdAt)}</time></button><span className="lead-type-badge">{lead.leadType}</span><button className="lead-delete" disabled={busyId === lead.id} onClick={() => void deleteLead(lead)}>Delete</button></article>)}{!filteredLeads.length && <p className="lead-empty">No inquiries match this view.</p>}</div>
    {selected && <article className="lead-detail"><div className="lead-detail-head"><div><p className="admin-kicker">Inquiry details</p><h3>{selected.lead.name}</h3></div><button className="admin-secondary" onClick={() => setSelected(null)}>Close details</button></div><dl><div><dt>Email</dt><dd><a href={`mailto:${selected.lead.email}`}>{selected.lead.email}</a></dd></div><div><dt>WhatsApp</dt><dd>{selected.lead.whatsapp || "Not provided"}</dd></div><div><dt>Company</dt><dd>{selected.lead.company || "Not provided"}</dd></div><div><dt>Website</dt><dd>{selected.lead.website ? <a href={selected.lead.website} target="_blank" rel="noreferrer">{selected.lead.website}</a> : "Not provided"}</dd></div><div><dt>Service</dt><dd>{selected.lead.service}</dd></div><div><dt>Package</dt><dd>{selected.lead.plan}</dd></div><div><dt>Target release</dt><dd>{selected.lead.timeline || "Not provided"}</dd></div><div><dt>Budget</dt><dd>{selected.lead.budget || "Not provided"}</dd></div><div><dt>Received</dt><dd>{displayDate(selected.lead.createdAt)}</dd></div><div><dt>Follow-up</dt><dd>{displayDateOnly(selected.lead.followUpAt)}</dd></div></dl><div className="lead-message"><strong>Project details</strong><p>{selected.lead.message}</p></div><div className="lead-crm-grid"><section><h4>Lead management</h4><label>Status<select value={selected.lead.status} disabled={busyId === selected.lead.id} onChange={event => void saveLead({ status: event.target.value as LeadStatus })}>{leadStatuses.map(item => <option key={item}>{item}</option>)}</select></label><label>Customer type<select value={selected.lead.leadType} disabled={busyId === selected.lead.id} onChange={event => void saveLead({ leadType: event.target.value as LeadType })}>{leadTypes.map(item => <option key={item}>{item}</option>)}</select></label><label>Next follow-up<input type="date" value={selected.lead.followUpAt.slice(0, 10)} disabled={busyId === selected.lead.id} onChange={event => void saveLead({ followUpAt: event.target.value })} /></label><button className="lead-clear-date" disabled={busyId === selected.lead.id || !selected.lead.followUpAt} onClick={() => void saveLead({ followUpAt: "" })}>Clear follow-up date</button></section><section><h4>Private notes</h4><textarea value={note} maxLength={4000} placeholder="Add a private follow-up, quote, or conversation note…" onChange={event => setNote(event.target.value)} /><button className="admin-button" disabled={busyId === selected.lead.id || !note.trim()} onClick={() => void addNote()}>Add private note</button><div className="lead-notes">{selected.notes.map(item => <article key={item.id}><strong>{item.author}</strong><time>{displayDate(item.createdAt)}</time><p>{item.note}</p></article>)}{!selected.notes.length && <p>No private notes yet.</p>}</div></section></div><section className="lead-activity"><h4>Activity history</h4>{selected.activity.map(item => <article key={item.id}><span aria-hidden="true">•</span><div><strong>{item.detail}</strong><p>{item.author} · {displayDate(item.createdAt)}</p></div></article>)}{!selected.activity.length && <p>No activity has been recorded yet.</p>}</section></article>}
  </section>;
}
