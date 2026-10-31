(() => {
  if (window.location.pathname !== "/" || document.getElementById("visitor-reach")) return;

  fetch("/api/analytics/public", { cache: "no-store", credentials: "same-origin" })
    .then(response => response.ok ? response.json() : null)
    .then(data => {
      if (!data?.enabled || !Number.isFinite(data.visitors) || data.visitors < 1) return;
      const footer = document.querySelector("footer");
      if (!footer || document.getElementById("visitor-reach")) return;

      const section = document.createElement("section");
      section.id = "visitor-reach";
      section.className = "visitor-reach";
      section.setAttribute("aria-label", "BugXtract visitor reach");
      const content = document.createElement("div");
      content.className = "visitor-reach__content";
      const eyebrow = document.createElement("p");
      eyebrow.className = "visitor-reach__eyebrow";
      eyebrow.textContent = "GROWING WITH CONFIDENCE";
      const title = document.createElement("h2");
      title.textContent = "Trusted by teams building better software.";
      const description = document.createElement("p");
      description.className = "visitor-reach__description";
      description.textContent = "Anonymous, aggregate reach from the last 30 days.";
      const stats = document.createElement("div");
      stats.className = "visitor-reach__stats";
      const visitorStat = document.createElement("article");
      const visitorValue = document.createElement("strong");
      visitorValue.textContent = String(data.visitors);
      const visitorLabel = document.createElement("span");
      visitorLabel.textContent = "Visitors";
      visitorStat.append(visitorValue, visitorLabel);
      stats.append(visitorStat);
      if (Number.isFinite(data.countries) && data.countries > 0) {
        const countryStat = document.createElement("article");
        const countryValue = document.createElement("strong");
        countryValue.textContent = String(data.countries);
        const countryLabel = document.createElement("span");
        countryLabel.textContent = "Countries reached";
        countryStat.append(countryValue, countryLabel);
        stats.append(countryStat);
      }
      content.append(eyebrow, title, description, stats);
      section.append(content);
      footer.parentNode.insertBefore(section, footer);
    })
    .catch(() => {});
})();
