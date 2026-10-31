(function () {
  var section = document.getElementById("founder-profile");
  if (!section) return;
  function text(id, value) { var element = document.getElementById(id); if (element) element.textContent = value || ""; }
  function validImage(value) { try { return new URL(value).protocol === "https:"; } catch (_) { return false; } }
  fetch("/api/pricing", { cache: "no-store" }).then(function (response) { if (!response.ok) throw new Error("Founder profile unavailable"); return response.json(); }).then(function (content) {
    var founder = content && content.founderProfile;
    if (!founder || !founder.visible || !founder.name || !founder.message) return;
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
    section.hidden = false;
  }).catch(function () { /* The team page remains usable if optional content cannot load. */ });
}());
