(function () {
  var section = document.getElementById("founder-profile");
  function text(id, value) { var element = document.getElementById(id); if (element) element.textContent = value || ""; }
  function validImage(value) { return /^\/api\/founder\/images\/founder-[0-9a-f-]{36}\.(?:jpe?g|png|webp)$/i.test(value || "") || (function () { try { return new URL(value).protocol === "https:"; } catch (_) { return false; } }()); }
  function validHttps(value) { try { return new URL(value).protocol === "https:"; } catch (_) { return false; } }
  function toggle(id, show) { var element = document.getElementById(id); if (element) element.hidden = !show; return element; }
  fetch("/api/pricing", { cache: "no-store" }).then(function (response) { if (!response.ok) throw new Error("Founder profile unavailable"); return response.json(); }).then(function (content) {
    var founder = content && content.founderProfile;
    if (!founder) return;
    if (section && founder.visible && founder.name && founder.message) {
      text("founder-profile-title", founder.name);
      text("founder-profile-role", founder.role);
      text("founder-profile-introduction", founder.introduction);
      text("founder-profile-message", founder.message);
      var focus = document.getElementById("founder-profile-focus");
      if (focus) {
      focus.textContent = "";
      [founder.focusOne, founder.focusTwo, founder.focusThree].filter(Boolean).forEach(function (item) { var li = document.createElement("li"); li.textContent = item; focus.appendChild(li); });
      focus.hidden = focus.children.length === 0;
      }
      var cta = document.getElementById("founder-profile-cta");
      if (cta) { cta.href = founder.ctaUrl || "/contact/?request=founder-message"; cta.firstChild.nodeValue = (founder.ctaLabel || "Discuss your QA needs") + " "; }
      var photo = document.getElementById("founder-profile-photo");
      var image = document.getElementById("founder-profile-image");
      if (photo && image && validImage(founder.imageUrl)) { image.src = founder.imageUrl; image.alt = founder.name + ", " + (founder.role || "Founder"); photo.hidden = false; }
      var signature = toggle("founder-profile-signature", Boolean(founder.signatureName || founder.signatureRole));
      if (signature) { text("founder-profile-signature-name", founder.signatureName || founder.name); text("founder-profile-signature-role", founder.signatureRole || founder.role); }
      var quote = toggle("founder-profile-quote", Boolean(founder.quote));
      if (quote) { text("founder-profile-quote-text", founder.quote); text("founder-profile-quote-attribution", founder.quoteAttribution); }
      var linkedIn = toggle("founder-profile-linkedin", validHttps(founder.linkedInUrl)); if (linkedIn) linkedIn.href = founder.linkedInUrl;
      var video = toggle("founder-profile-video", validHttps(founder.videoUrl)); if (video) video.href = founder.videoUrl;
      var proof = document.getElementById("founder-profile-proof");
      if (proof) { proof.textContent = ""; [founder.proofOne, founder.proofTwo, founder.proofThree].filter(Boolean).forEach(function (item) { var li = document.createElement("li"); li.textContent = item; proof.appendChild(li); }); proof.hidden = proof.children.length === 0; }
      section.hidden = false;
    }
    var teaser = document.getElementById("founder-home-teaser");
    if (teaser && founder.homepageVisible && founder.visible && founder.name) {
      text("founder-home-teaser-title", founder.homepageTitle || "A practical QA partner for safer releases.");
      text("founder-home-teaser-message", founder.homepageMessage || "Meet the person behind BugXtract’s approach to thoughtful, evidence-led software testing.");
      var teaserLink = document.getElementById("founder-home-teaser-link");
      if (teaserLink) teaserLink.href = "/team#founder-profile";
      teaser.hidden = false;
    }
  }).catch(function () { /* The team page remains usable if optional content cannot load. */ });
}());
