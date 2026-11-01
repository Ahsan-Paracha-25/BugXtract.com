(function () {
  if (location.pathname.indexOf("/admin") === 0 || !window.localStorage) return;
  var visitorKey = "bugxtract_visitor_id";
  var visitorId = localStorage.getItem(visitorKey);
  if (!visitorId) {
    visitorId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "v-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    localStorage.setItem(visitorKey, visitorId);
  }
  var agent = navigator.userAgent || "";
  var device = /ipad|tablet/i.test(agent) ? "Tablet" : /mobi|iphone|android/i.test(agent) ? "Mobile" : "Desktop";
  var theme = matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "Dark" : "Light";
  function sendPresence() {
    if (document.visibilityState !== "visible") return;
    fetch("/api/analytics/presence", { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitorId: visitorId, path: location.pathname, device: device, theme: theme }) }).catch(function () {});
  }
  sendPresence();
  window.setInterval(sendPresence, 60000);
  document.addEventListener("visibilitychange", sendPresence);
})();
