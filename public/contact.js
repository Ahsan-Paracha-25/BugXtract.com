const form = document.getElementById("inquiry");
if (form) {
  const service = document.getElementById("service");
  const planSelect = document.getElementById("plan");
  const message = document.getElementById("message");
  const params = new URLSearchParams(location.search);
  const priceSummary = document.getElementById("selected-package-summary");
  const priceName = document.getElementById("selected-package-name");
  const priceOriginal = document.getElementById("selected-package-original");
  const priceCurrent = document.getElementById("selected-package-current");
  const priceMeta = document.getElementById("selected-package-meta");
  const formStatus = document.getElementById("form-status");
  const downloadButton = document.getElementById("download-inquiry");
  const preview = document.getElementById("inquiry-preview");
  const packages = new Map();
  let generatedMessage = "";
  let prepared = "";

  function addOption(value, label) {
    const item = document.createElement("option");
    item.value = value;
    item.textContent = label;
    return item;
  }

  function priceText(item) {
    return String(item.price || "Price to be agreed").trim();
  }

  function packageLabel(item) {
    if (!item) return "Help me choose";
    if (item.kind === "retainer") {
      return item.name + " retainer — current price: " + priceText(item) + " / month; " + item.hours + " hours / month";
    }
    const original = item.originalPrice && item.originalPrice !== item.price
      ? "; original price: " + item.originalPrice : "";
    const coverage = [item.hours, item.billing].filter(Boolean).join(" · ");
    return item.name + " — current price: " + priceText(item) + original + (coverage ? "; " + coverage : "");
  }

  function messageFor(item) {
    return item
      ? "I am interested in the " + packageLabel(item) + ". Please contact me to discuss my project and testing scope."
      : "";
  }

  function updateSelectedPackage(updateMessage) {
    const item = packages.get(planSelect.value);
    if (item) {
      priceSummary.hidden = false;
      priceName.textContent = item.kind === "retainer" ? item.name + " retainer" : item.name;
      priceCurrent.textContent = item.kind === "retainer" ? priceText(item) + " / month" : priceText(item);
      const hasOriginal = item.kind !== "retainer" && item.originalPrice && item.originalPrice !== item.price;
      priceOriginal.hidden = !hasOriginal;
      priceOriginal.textContent = hasOriginal ? item.originalPrice : "";
      priceMeta.textContent = item.kind === "retainer"
        ? item.hours + " hours / month"
        : [item.hours, item.billing].filter(Boolean).join(" · ");
      const nextMessage = messageFor(item);
      if (updateMessage && (!message.value.trim() || message.value === generatedMessage)) {
        message.value = nextMessage;
        generatedMessage = nextMessage;
      }
    } else {
      priceSummary.hidden = true;
      if (updateMessage && message.value === generatedMessage) {
        message.value = "";
        generatedMessage = "";
      }
    }
  }

  function populatePackages(data) {
    if (!Array.isArray(data.plans) || !Array.isArray(data.retainers)) {
      throw new Error("Pricing data is incomplete.");
    }
    packages.clear();
    planSelect.replaceChildren(addOption("", "Select a package"));
    for (const plan of data.plans) {
      const key = "plan:" + plan.id;
      packages.set(key, Object.assign({ kind: "plan" }, plan));
      const was = plan.originalPrice && plan.originalPrice !== plan.price ? " · was " + plan.originalPrice : "";
      planSelect.append(addOption(key, plan.name + " — " + plan.price + was));
    }
    for (const retainer of data.retainers) {
      const key = "retainer:" + retainer.id;
      packages.set(key, Object.assign({ kind: "retainer" }, retainer));
      planSelect.append(addOption(key, retainer.name + " — " + retainer.price + " / month"));
    }
    planSelect.append(addOption("help", "Help me choose"));

    let selected = "";
    const requested = params.get("plan");
    if (params.get("assessment") === "free") {
      selected = "plan:free";
    } else if (requested === "retainer") {
      selected = "retainer:" + (params.get("level") || "");
    } else if (requested) {
      selected = "plan:" + requested;
    }
    if (selected && packages.has(selected)) {
      planSelect.value = selected;
      service.value = "Multiple Services";
      updateSelectedPackage(true);
    } else if (requested || params.get("assessment") === "free") {
      planSelect.value = "help";
      priceSummary.hidden = true;
      formStatus.textContent = "That package is no longer listed. Please choose a current package or select Help me choose.";
    }
  }

  planSelect.addEventListener("change", function() { updateSelectedPackage(true); });
  form.addEventListener("input", function(event) {
    if (event.target === message) generatedMessage = "";
    preview.hidden = true;
    downloadButton.hidden = true;
    formStatus.textContent = "";
    prepared = "";
  });

  fetch("/api/pricing", { cache: "no-store" })
    .then(function(response) {
      if (!response.ok) throw new Error("Live prices could not be loaded.");
      return response.json();
    })
    .then(populatePackages)
    .catch(function() {
      planSelect.replaceChildren(addOption("", "Live packages unavailable — please refresh"));
      planSelect.append(addOption("help", "Help me choose"));
      priceSummary.hidden = true;
      formStatus.textContent = "Current package prices could not be loaded. Please refresh the page before selecting a priced package.";
    });

  form.addEventListener("submit", function(event) {
    event.preventDefault();
    const data = new FormData(form);
    const selectedPackage = packages.get(planSelect.value);
    data.set("plan", packageLabel(selectedPackage));
    prepared = "BugXtract.com — Project Inquiry\n\n" +
      [["Name", "name"], ["Email", "email"], ["Company", "company"], ["WhatsApp number", "whatsapp"], ["Product URL", "website"], ["Service", "service"], ["Selected package / current price", "plan"], ["Target release", "timeline"], ["Budget", "budget"], ["Project details", "message"]]
        .map(function(entry) {
          const value = String(data.get(entry[1]) || "").trim() || "Not specified";
          return entry[0] + ": " + value;
        })
        .join("\n");
    preview.textContent = prepared;
    preview.hidden = false;
    downloadButton.hidden = false;
    formStatus.textContent = "Opening your email app with the inquiry addressed to sqae001@gmail.com. Review it and press Send.";
    const subject = encodeURIComponent("BugXtract.com — " + (selectedPackage ? selectedPackage.name : "Project inquiry"));
    const body = encodeURIComponent(prepared);
    window.location.href = "mailto:sqae001@gmail.com?subject=" + subject + "&body=" + body;
  });

  downloadButton.addEventListener("click", function() {
    if (!prepared) return;
    const url = URL.createObjectURL(new Blob([prepared], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "bugxtract-project-inquiry.txt";
    link.click();
    setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    formStatus.textContent = "Inquiry downloaded. You can attach it to an email to sqae001@gmail.com.";
  });
}