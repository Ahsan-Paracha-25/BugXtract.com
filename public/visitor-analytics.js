(function () {
  if (location.pathname.indexOf("/admin") === 0 || !window.localStorage) return;
  var visitorKey = "bugxtract_visitor_id";
  var visitKey = "bugxtract_last_view_" + location.pathname;
  var visitorId = localStorage.getItem(visitorKey);
  if (!visitorId) {
    visitorId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "v-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    localStorage.setItem(visitorKey, visitorId);
  }
  var lastView = Number(sessionStorage.getItem(visitKey) || 0);
  if (Date.now() - lastView < 30 * 60 * 1000) return;
  sessionStorage.setItem(visitKey, String(Date.now()));
  var referrer = document.referrer;
  var source = "Direct";
  try {
    if (referrer) {
      var host = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
      if (host === location.hostname.replace(/^www\./, "").toLowerCase()) source = "Internal navigation";
      else if (host.indexOf("google.") >= 0) source = "Google";
      else if (host.indexOf("facebook.") >= 0 || host.indexOf("instagram.") >= 0) source = "Meta";
      else if (host.indexOf("linkedin.") >= 0) source = "LinkedIn";
      else if (host.indexOf("youtube.") >= 0) source = "YouTube";
      else if (host.indexOf("tiktok.") >= 0) source = "TikTok";
      else source = host.slice(0, 160);
    }
  } catch (_) { /* Direct is a safe fallback. */ }
  var agent = navigator.userAgent || "";
  var device = /ipad|tablet/i.test(agent) ? "Tablet" : /mobi|iphone|android/i.test(agent) ? "Mobile" : "Desktop";
  var theme = matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "Dark" : "Light";
  fetch("/api/analytics/track", { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitorId: visitorId, path: location.pathname, source: source, device: device, theme: theme }) }).catch(function () {});
})();
