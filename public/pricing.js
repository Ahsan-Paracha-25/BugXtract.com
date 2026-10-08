(() => {
  const featureLabels = ["Functional & exploratory", "Smoke & usability checks", "Browser / device coverage", "Regression testing", "API & integration testing", "Roles, permissions & UAT", "Bug reports with evidence", "Fix verification", "Test documentation"];
  const make = (tag, cls, value) => { const node = document.createElement(tag); if (cls) node.className = cls; if (value !== undefined) node.textContent = value; return node; };
  const addCell = (row, tag, value, scope) => { const cell = make(tag, scope ? "" : undefined, value); if (scope) cell.scope = scope; row.append(cell); return cell; };
  function renderPlans(data) {
    const table = document.querySelector("#plans table");
    if (!table || !Array.isArray(data.plans)) return;
    table.replaceChildren();
    const caption = make("caption", "sr-only", "QA plans, prices in US dollars, hours and included services"); table.append(caption);
    const head = make("thead"), header = make("tr"); addCell(header, "th", "Features & inclusions", "col");
    for (const plan of data.plans) {
      const th = make("th", plan.popular ? "popular-plan" : ""); th.scope = "col";
      const badgeSlot = make("span", "plan-badge-slot");
      if (plan.popular) badgeSlot.append(make("span", "popular-badge", "MOST POPULAR"));
      th.append(badgeSlot, make("span", "plan-name", plan.name));
      const originalPriceSlot = make("span", "plan-original-price-slot");
      if (typeof plan.originalPrice === "string" && plan.originalPrice.trim()) originalPriceSlot.append(make("del", "plan-original-price", plan.originalPrice));
      th.append(originalPriceSlot);
      th.append(make("strong", "", plan.price)); th.append(make("small", "", plan.billing)); header.append(th);
    }
    head.append(header); table.append(head);
    const body = make("tbody");
    const rows = [["Best suited for", p => p.audience], ["Testing time", p => p.hours], ...featureLabels.map((label, i) => [label, p => p.features?.[i] ?? "—"])];
    for (const [label, get] of rows) { const row = make("tr"); addCell(row, "th", label, "row"); for (const plan of data.plans) addCell(row, "td", get(plan)); body.append(row); }
    table.append(body);
    const foot = make("tfoot"), actions = make("tr"); addCell(actions, "td", "Find your starting point");
    for (const plan of data.plans) { const td = make("td"), link = make("a", "btn", plan.id === "free" ? "Explore trial" : `Choose ${plan.name}`); link.href = `/contact/?plan=${encodeURIComponent(plan.id)}`; td.append(link); actions.append(td); }
    foot.append(actions); table.append(foot);
  }
  function renderRetainers(data) {
    const box = document.querySelector("#retainer-options");
    if (!box || !Array.isArray(data.retainers)) return;
    box.replaceChildren();
    for (const plan of data.retainers) {
      const row = make("div", "retainer-row"), info = make("div"), name = make("strong", "", plan.name), details = make("span", "", `${plan.hours} hours / month · ${plan.price} / month`), desc = make("span", "", plan.description), link = make("a", "retainer-choice", "Choose this retainer");
      info.append(name, details); link.href = `/contact/?plan=retainer&level=${encodeURIComponent(plan.id)}`; row.append(info, desc, link); box.append(row);
    }
    const note = make("p", "micro", "Prices are in USD per month. Response windows and rollover terms are agreed in your retainer scope. Extra hours require approval. Production checks use an agreed, non-disruptive test plan."); note.style.margin = "20px 0 0"; box.append(note);
  }
  fetch("/api/pricing", { cache: "no-store" }).then(response => { if (!response.ok) throw new Error("Unable to load plans"); return response.json(); }).then(data => { renderPlans(data); renderRetainers(data); }).catch(() => {});
})();
