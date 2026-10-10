(() => {
  const section = document.querySelector("#trust-metrics");
  const grid = document.querySelector("#trust-metrics-grid");
  if (!section || !grid) return;

  const defaults = [
    { id: "happy-customers", value: "50+", label: "Happy Customers", icon: "users", visible: true },
    { id: "projects-delivered", value: "100+", label: "Projects Delivered", icon: "document", visible: true },
    { id: "average-rating", value: "4.9/5", label: "Average Rating", icon: "stars", visible: true },
    { id: "response-time", value: "24h", label: "Response Time", icon: "lightning", visible: true },
  ];
  const icons = {
    users: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="17" cy="17" r="5"/><path d="M5 37v-4c0-6 5-10 12-10s12 4 12 10v4"/><path d="M33 12a5 5 0 0 1 0 10m3 5c4 1 7 4 7 9v1"/></svg>',
    document: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5h17l8 8v29H12a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3Z"/><path d="M29 5v9h8M17 23h14M17 30h14M17 37h10"/></svg>',
    stars: '<svg class="trust-star-cluster" viewBox="0 0 74 64" fill="currentColor" aria-hidden="true"><path d="M13 6 15.9 12l6.6 1-4.8 4.7 1.1 6.6L13 21.2 7.2 24.3l1.1-6.6L3.5 13l6.6-1Z"/><path d="M37 6 39.9 12l6.6 1-4.8 4.7 1.1 6.6L37 21.2l-5.8 3.1 1.1-6.6-4.8-4.7 6.6-1Z"/><path d="M61 6 63.9 12l6.6 1-4.8 4.7 1.1 6.6L61 21.2l-5.8 3.1 1.1-6.6-4.8-4.7 6.6-1Z"/><path d="M25 32 27.9 38l6.6 1-4.8 4.7 1.1 6.6L25 47.2l-5.8 3.1 1.1-6.6-4.8-4.7 6.6-1Z"/><path d="M49 32 51.9 38l6.6 1-4.8 4.7 1.1 6.6L49 47.2l-5.8 3.1 1.1-6.6-4.8-4.7 6.6-1Z"/></svg>',
    lightning: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M27 3 8 26h14l-2 19 20-25H26l1-17Z"/></svg>',
  };
  const make = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  };

  let observer;
  let animated = false;
  function animateCount(node, value) {
    const match = /^(\d+(?:\.\d+)?)(.*)$/.exec(value);
    if (!match || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = Number(match[1]);
    if (!Number.isFinite(target) || target > 10000) return;
    const decimals = match[1].includes(".") ? match[1].split(".")[1].length : 0;
    const suffix = match[2];
    const start = performance.now();
    const duration = 1200;
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      node.textContent = `${(target * eased).toFixed(decimals)}${suffix}`;
      if (progress < 1 && node.isConnected) requestAnimationFrame(tick);
      else node.textContent = value;
    }
    requestAnimationFrame(tick);
  }

  function reveal() {
    if (animated) return;
    animated = true;
    section.classList.add("is-in-view");
    grid.querySelectorAll(".trust-metric-value").forEach(node => animateCount(node, node.dataset.value || node.textContent));
    observer?.disconnect();
  }

  function render(metrics) {
    const visible = metrics.filter(metric => metric && metric.visible === true &&
      typeof metric.value === "string" && typeof metric.label === "string" &&
      Object.prototype.hasOwnProperty.call(icons, metric.icon)).slice(0, 8);
    section.hidden = visible.length === 0;
    grid.replaceChildren();
    if (!visible.length) return;
    visible.forEach((metric, index) => {
      const card = make("article", `trust-metric-card trust-metric-${metric.icon}`);
      card.style.setProperty("--card-index", index);
      const icon = make("span", "trust-metric-icon");
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML = icons[metric.icon];
      if (metric.icon === "stars") {
        const petals = make("span", "trust-bloom-petals");
        for (let i = 0; i < 8; i++) {
          const petal = make("i", "trust-bloom-petal");
          petal.style.setProperty("--petal-index", i);
          petals.append(petal);
        }
        icon.append(petals);
      }
      const copy = make("span", "trust-metric-copy");
      const value = make("strong", "trust-metric-value", metric.value);
      value.dataset.value = metric.value;
      copy.append(value, make("span", "trust-metric-label", metric.label));
      card.append(icon, copy);
      grid.append(card);
    });
    if (animated) {
      section.classList.add("is-in-view");
      grid.querySelectorAll(".trust-metric-value").forEach(node => animateCount(node, node.dataset.value || node.textContent));
    } else if ("IntersectionObserver" in window) {
      observer?.disconnect();
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) reveal();
      }, { threshold: 0.18 });
      observer.observe(section);
    } else reveal();
  }

  render(defaults);
  fetch("/api/pricing", { cache: "no-store" })
    .then(response => { if (!response.ok) throw new Error("Metrics unavailable"); return response.json(); })
    .then(data => { if (Array.isArray(data.trustMetrics)) render(data.trustMetrics); })
    .catch(() => { /* Keep the approved starting values visible when the API is unavailable. */ });
})();
