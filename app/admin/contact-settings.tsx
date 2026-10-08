"use client";

import { FormEvent, useEffect, useState } from "react";

type ContactSettings = { recipientEmail: string; senderConfigured: boolean; deliveryProvider?: string; activationStepRequired?: boolean };

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
        setStatus(data.activationStepRequired ? "Automatic delivery is ready. Send one test inquiry and confirm the activation email in this inbox." : "Automatic email delivery is configured.");
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
      setStatus(result.activationStepRequired ? "Saved. Send one test inquiry and confirm the activation email sent to this inbox." : "Saved. New inquiries will be sent to this email.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Receiving email could not be saved."); }
    finally { setBusy(false); }
  }

  return <section className="editor-section contact-settings-section">
    <div className="editor-title"><div><h2>Contact form email</h2><p>Choose the inbox that should receive new project inquiries.</p></div></div>
    <article className="edit-card"><form className="contact-settings-form" onSubmit={save}>
      <label htmlFor="contact-recipient-email">Receiving email</label>
      <div className="contact-settings-row"><input id="contact-recipient-email" type="email" required maxLength={254} value={recipientEmail} onChange={event => setRecipientEmail(event.target.value)} /><button className="admin-button" disabled={busy}>{busy ? "Saving…" : "Save receiving email"}</button></div>
      <p className="contact-settings-status" role="status">{status}</p>
      {senderConfigured && <div className={status.includes("activation") ? "contact-settings-help" : "contact-settings-reply-note"}>
        {status.includes("activation")
          ? <><strong>One-time Gmail confirmation</strong><span>Submit one test inquiry from the Contact Us page. FormSubmit will send an activation link to this inbox; click it to start receiving submissions. If you change this address later, confirm the new inbox too. The email service may retain submissions for up to 30 days.</span></>
          : <>Customer inquiries are sent here, with the customer’s email set as Reply-To so you can respond directly.</>}
      </div>}
    </form></article>
  </section>;
}
