"use client";

import type { FounderProfile } from "../../lib/pricing-defaults";
import "./founder-editor.css";

export function FounderEditor({ founder, onChange }: { founder: FounderProfile; onChange: (founder: FounderProfile) => void }) {
  function update(patch: Partial<FounderProfile>) { onChange({ ...founder, ...patch }); }

  return <section className="editor-section founder-admin-section">
    <div className="editor-title"><div><h2>Founder profile</h2><p>Show an optional founder message on the public Our Team page.</p></div></div>
    <p className="founder-admin-note">Keep this private until it is ready. Turn on “Show on Our Team page” only when every public detail is accurate and approved.</p>
    <article className="edit-card founder-admin-card">
      <label className="founder-visible"><input type="checkbox" checked={founder.visible} onChange={event => update({ visible: event.target.checked })} /> <span><strong>Show on Our Team page</strong><small>{founder.visible ? "This founder profile will appear publicly after you save." : "This profile is hidden from visitors."}</small></span></label>
      <div className="edit-grid founder-fields">
        <label>Founder name<input maxLength={120} value={founder.name} onChange={event => update({ name: event.target.value })} placeholder="Your full name" /></label>
        <label>Role / title<input maxLength={140} value={founder.role} onChange={event => update({ role: event.target.value })} placeholder="Founder, BugXtract.com" /></label>
        <label className="wide">Founder photo URL <span>(optional)</span><input type="url" maxLength={1000} value={founder.imageUrl} onChange={event => update({ imageUrl: event.target.value })} placeholder="https://…" /><small>Use a public HTTPS image link. A square professional headshot works best.</small></label>
        <label className="wide">Short introduction<input maxLength={240} value={founder.introduction} onChange={event => update({ introduction: event.target.value })} placeholder="A brief one-line introduction visitors see first." /></label>
        <label className="wide">Founder message<textarea rows={5} maxLength={1800} value={founder.message} onChange={event => update({ message: event.target.value })} placeholder="Explain your mission, the QA services you provide, and what customers can expect." /></label>
        <label>Focus point 1<input maxLength={120} value={founder.focusOne} onChange={event => update({ focusOne: event.target.value })} placeholder="Example: Practical release confidence" /></label>
        <label>Focus point 2<input maxLength={120} value={founder.focusTwo} onChange={event => update({ focusTwo: event.target.value })} placeholder="Example: Clear, evidence-based findings" /></label>
        <label>Focus point 3<input maxLength={120} value={founder.focusThree} onChange={event => update({ focusThree: event.target.value })} placeholder="Example: Coverage matched to real users" /></label>
        <label>Button label<input maxLength={80} value={founder.ctaLabel} onChange={event => update({ ctaLabel: event.target.value })} placeholder="Discuss your QA needs" /></label>
        <label>Button destination<input maxLength={500} value={founder.ctaUrl} onChange={event => update({ ctaUrl: event.target.value })} placeholder="/contact/?request=founder-message" /></label>
        <label>Signature name <span>(optional)</span><input maxLength={120} value={founder.signatureName} onChange={event => update({ signatureName: event.target.value })} placeholder="Your full name" /></label>
        <label>Signature role <span>(optional)</span><input maxLength={140} value={founder.signatureRole} onChange={event => update({ signatureRole: event.target.value })} placeholder="Founder, BugXtract.com" /></label>
        <label>LinkedIn profile <span>(optional)</span><input type="url" maxLength={1000} value={founder.linkedInUrl} onChange={event => update({ linkedInUrl: event.target.value })} placeholder="https://www.linkedin.com/in/…" /></label>
        <label>Video introduction link <span>(optional)</span><input type="url" maxLength={1000} value={founder.videoUrl} onChange={event => update({ videoUrl: event.target.value })} placeholder="https://www.youtube.com/…" /><small>Visitors will see a safe external “Watch introduction” link, not an auto-playing video.</small></label>
      </div>
      <div className="founder-admin-divider"><strong>Homepage teaser — Version 3</strong><span>Optional short founder introduction on the homepage. It links visitors to the full Our Team profile.</span></div>
      <label className="founder-visible"><input type="checkbox" checked={founder.homepageVisible} onChange={event => update({ homepageVisible: event.target.checked })} /> <span><strong>Show founder teaser on homepage</strong><small>{founder.homepageVisible ? "The teaser will be public after you save." : "The homepage teaser is hidden."}</small></span></label>
      <div className="edit-grid founder-fields">
        <label className="wide">Homepage teaser title<input maxLength={180} value={founder.homepageTitle} onChange={event => update({ homepageTitle: event.target.value })} placeholder="A practical QA partner for safer releases." /></label>
        <label className="wide">Homepage teaser message<textarea rows={3} maxLength={500} value={founder.homepageMessage} onChange={event => update({ homepageMessage: event.target.value })} placeholder="A concise invitation to read the founder’s full message." /></label>
      </div>
      <div className="founder-admin-divider"><strong>Credibility &amp; trust — Version 4</strong><span>Use only genuine, verifiable facts. Leave any item blank to keep it hidden.</span></div>
      <div className="edit-grid founder-fields">
        <label className="wide">Founder quote <span>(optional)</span><textarea rows={3} maxLength={500} value={founder.quote} onChange={event => update({ quote: event.target.value })} placeholder="A concise belief or promise about quality and releases." /></label>
        <label>Quote attribution <span>(optional)</span><input maxLength={180} value={founder.quoteAttribution} onChange={event => update({ quoteAttribution: event.target.value })} placeholder="Name · Founder, BugXtract.com" /></label>
        <label>Verified highlight 1<input maxLength={160} value={founder.proofOne} onChange={event => update({ proofOne: event.target.value })} placeholder="Example: Manual QA for web and mobile products" /></label>
        <label>Verified highlight 2<input maxLength={160} value={founder.proofTwo} onChange={event => update({ proofTwo: event.target.value })} placeholder="Add only a fact you can verify" /></label>
        <label>Verified highlight 3<input maxLength={160} value={founder.proofThree} onChange={event => update({ proofThree: event.target.value })} placeholder="Add only a fact you can verify" /></label>
      </div>
    </article>
  </section>;
}
