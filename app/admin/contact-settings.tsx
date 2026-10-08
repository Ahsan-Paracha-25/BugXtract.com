"use client";

import { FormEvent, useEffect, useState } from "react";

type ContactSettings = { recipientEmail: string; relayUrl: string; senderConfigured: boolean; deliveryProvider?: string };

export function ContactSettingsEditor() {
  const [recipientEmail, setRecipientEmail] = useState("sqae001@gmail.com");
  const [relayUrl, setRelayUrl] = useState("");
  const [senderConfigured, setSenderConfigured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Loading contact settings…");

  useEffect(() => {
    fetch("/api/admin/contact-settings", { cache: "no-store", credentials: "same-origin" })
      .then(async response => {
        const data = await response.json() as ContactSettings & { error?: string };
        if (!response.ok) throw new Error(data.error || "Contact settings could not be loaded.");
        setRecipientEmail(data.recipientEmail);
        setRelayUrl(data.relayUrl || "");
        setSenderConfigured(data.senderConfigured);
        setStatus(data.senderConfigured ? "Gmail relay URL is saved. Submit a test inquiry to verify delivery." : "Receiving email is saved; connect your Gmail delivery below.");
      })
      .catch(error => setStatus(error instanceof Error ? error.message : "Contact settings could not be loaded."));
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("Saving email settings…");
    try {
      const response = await fetch("/api/admin/contact-settings", {
        method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail, relayUrl }),
      });
      const result = await response.json() as ContactSettings & { error?: string };
      if (!response.ok) throw new Error(result.error || "Email settings could not be saved.");
      setRelayUrl(result.relayUrl || "");
      setSenderConfigured(result.senderConfigured);
      setStatus(result.senderConfigured ? "Saved. Submit a test inquiry to verify delivery through your Gmail account." : "Receiving email saved. Complete Gmail setup below to activate automatic delivery.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Email settings could not be saved."); }
    finally { setBusy(false); }
  }

  return <section className="editor-section contact-settings-section">
    <div className="editor-title"><div><h2>Contact form email</h2><p>Choose the inbox that should receive new project inquiries.</p></div></div>
    <article className="edit-card"><form className="contact-settings-form" onSubmit={save}>
      <label htmlFor="contact-recipient-email">Receiving email</label>
      <div className="contact-settings-row"><input id="contact-recipient-email" type="email" required maxLength={254} value={recipientEmail} onChange={event => setRecipientEmail(event.target.value)} /><button className="admin-button" disabled={busy}>{busy ? "Saving…" : "Save email settings"}</button></div>
      <label htmlFor="gmail-relay-url">Google Apps Script Web App URL</label>
      <input id="gmail-relay-url" type="url" inputMode="url" placeholder="https://script.google.com/macros/s/.../exec" maxLength={500} value={relayUrl} onChange={event => setRelayUrl(event.target.value)} />
      <p className="contact-settings-status" role="status">{status}</p>
      {!senderConfigured && <div className="contact-settings-help gmail-setup"><strong>Connect your own Gmail (one-time setup)</strong><span>1. Open <a href="https://script.google.com/home" target="_blank" rel="noreferrer">Google Apps Script</a> and create a project.</span><span>2. Download the ready script below, open it, copy its contents into the project, and save.</span><span>3. Select <strong>Deploy → New deployment → Web app</strong>. Set “Execute as” to yourself and access to “Anyone”, then authorize Google Mail access.</span><span>4. Copy the Web App URL ending in <code>/exec</code>, paste it above, and save. Keep that URL private; it lets the website send inquiries through your Gmail.</span><a href="/bugxtract-gmail-relay.gs" download>Download ready-to-paste Gmail script</a></div>}
      {senderConfigured && <p className="contact-settings-reply-note">New inquiries go to this inbox through your connected Gmail account. The customer’s email is set as Reply-To so you can respond directly.</p>}
    </form></article>
  </section>;
}
