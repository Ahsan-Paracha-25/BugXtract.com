(function () {
  if (location.pathname.indexOf("/admin") === 0 || !window.localStorage) return;
  var labels = { services: "Services", products: "Products", plans: "Our Plans", retainers: "Monthly Retainers", faq: "FAQs", contact: "Contact Us", team: "Our Team", hero: "Homepage" };
  var visitorKey = "bugxtract_visitor_id";
  var visitorId = localStorage.getItem(visitorKey);
  if (!visitorId) { visitorId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "v-" + Date.now() + "-" + Math.random().toString(36).slice(2); localStorage.setItem(visitorKey, visitorId); }
  var agent = navigator.userAgent || "";
  var device = /ipad|tablet/i.test(agent) ? "Tablet" : /mobi|iphone|android/i.test(agent) ? "Mobile" : "Desktop";
  var theme = matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "Dark" : "Light";
  var current = location.pathname === "/contact" ? "contact" : location.pathname === "/team" ? "team" : "hero";
  var ratios = {};
  function send(seconds) {
    if (document.visibilityState !== "visible") return;
    var label = labels[current] || "Website section";
    fetch("/api/analytics/section-activity", { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitorId: visitorId, path: location.pathname, sectionId: current, sectionLabel: label, device: device, theme: theme, seconds: seconds }) }).catch(function () {});
  }
  if (location.pathname === "/") {
    var targets = Object.keys(labels).filter(function (id) { return document.getElementById(id); }).map(function (id) { return document.getElementById(id); });
    if (targets.length && "IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { ratios[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0; });
        var best = Object.keys(ratios).sort(function (a, b) { return ratios[b] - ratios[a]; })[0];
        if (best && ratios[best] > 0.2 && best !== current) { current = best; send(0); }
      }, { threshold: [0.25, 0.5, 0.75] }).observe(targets[0]);
      targets.slice(1).forEach(function (target) { new IntersectionObserver(function (entries) { entries.forEach(function (entry) { ratios[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0; }); var best = Object.keys(ratios).sort(function (a, b) { return ratios[b] - ratios[a]; })[0]; if (best && ratios[best] > 0.2 && best !== current) { current = best; send(0); } }, { threshold: [0.25, 0.5, 0.75] }).observe(target); });
    }
  }
  send(0);
  window.setInterval(function () { send(30); }, 30000);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") send(0); });
})();
