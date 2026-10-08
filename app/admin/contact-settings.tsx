"use client";

import { FormEvent, useEffect, useState } from "react";

type ContactSettings = { recipientEmail: string; senderConfigured: boolean };

export function ContactSettingsEditor() {
  const [recipientEmail, setRecipientEmail] = useState("sqae001@gmail.com");
  const [senderConfigured, setSenderConfigured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Loading contact settings…");

  useEffect(() => {
    fetch("/api/admin/contact-settings", { cache: "no-store", credentials: "same-origin" })
      .then(async response => {
        const data = await response.json() as ContactSettings & { error?: string };
        if (!response.ok) throw new Error(data.error || "Contact settings could not be loaded.");
        setRecipientEmail(data.recipientEmail);
        setSenderConfigured(data.senderConfigured);
        setStatus(data.senderConfigured ? "Email delivery is configured." : "Receiving address is ready; email provider setup is still required.");
      })
      .catch(error => setStatus(error instanceof Error ? error.message : "Contact settings could not be loaded."));
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("Saving receiving email…");
    try {
      const response = await fetch("/api/admin/contact-settings", {
        method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail }),
      });
      const result = await response.json() as ContactSettings & { error?: string };
      if (!response.ok) throw new Error(result.error || "Receiving email could not be saved.");
      setSenderConfigured(result.senderConfigured);
      setStatus(result.senderConfigured ? "Saved. New inquiries will be sent to this email." : "Saved. Add the email provider setup to activate automatic delivery.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Receiving email could not be saved."); }
    finally { setBusy(false); }
  }

  return <section className="editor-section contact-settings-section">
    <div className="editor-title"><div><h2>Contact form email</h2><p>Choose the inbox that should receive new project inquiries.</p></div></div>
    <article className="edit-card"><form className="contact-settings-form" onSubmit={save}>
      <label htmlFor="contact-recipient-email">Receiving email</label>
      <div className="contact-settings-row"><input id="contact-recipient-email" type="email" required maxLength={254} value={recipientEmail} onChange={event => setRecipientEmail(event.target.value)} /><button className="admin-button" disabled={busy}>{busy ? "Saving…" : "Save receiving email"}</button></div>
      <p className="contact-settings-status" role="status">{status}</p>
      {!senderConfigured && <div className="contact-settings-help"><strong>One-time setup still needed</strong><span>Automatic sending needs a Resend API key and a verified sender email configured as secure Site settings: <code>RESEND_API_KEY</code> and <code>RESEND_FROM_EMAIL</code>. Keep the API key secret; never place it in website code.</span></div>}
      {senderConfigured && <p className="contact-settings-reply-note">Customer inquiries will be sent here, with the customer’s email set as Reply-To so you can respond directly.</p>}
    </form></article>
  </section>;
}
