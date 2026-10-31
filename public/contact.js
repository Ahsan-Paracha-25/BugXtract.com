const form = document.getElementById("inquiry");
if (form) {
  const service = document.getElementById("service");
  const planSelect = document.getElementById("plan");
  const message = document.getElementById("message");
  const params = new URLSearchParams(location.search);
  const emailInput = document.getElementById("email");
  const priceSummary = document.getElementById("selected-package-summary");
  const priceName = document.getElementById("selected-package-name");
  const priceLabel = document.getElementById("selected-package-price-label");
  const priceOriginal = document.getElementById("selected-package-original");
  const priceCurrent = document.getElementById("selected-package-current");
  const priceMeta = document.getElementById("selected-package-meta");
  const formStatus = document.getElementById("form-status");
  const downloadButton = document.getElementById("download-inquiry");
  const preview = document.getElementById("inquiry-preview");
  const submitButton = form.querySelector('button[type="submit"]');
  const messageCount = document.getElementById("message-count");
  const startedAt = document.getElementById("form_started_at");
  const sourceInput = document.getElementById("inquiry_source");
  const packages = new Map();
  let generatedMessage = "";
  let prepared = "";

  if (startedAt) startedAt.value = String(Date.now());
  if (sourceInput) {
    const landingSource = params.get("source") || params.get("utm_source");
    let referrerPath = "";
    try {
      const referrer = document.referrer ? new URL(document.referrer) : null;
      if (referrer && referrer.origin === location.origin) referrerPath = referrer.pathname + referrer.search;
    } catch { /* A missing or malformed referrer simply means a direct visit. */ }
    sourceInput.value = (landingSource || referrerPath || "Direct contact page").slice(0, 200);
  }

  function setFieldError(id, messageText) {
    const field = document.getElementById(id);
    const error = document.getElementById(id + "-error");
    if (!field || !error) return;
    error.textContent = messageText || "";
    field.setAttribute("aria-invalid", messageText ? "true" : "false");
  }

  function validateInquiry() {
    const values = new FormData(form);
    const name = String(values.get("name") || "").trim();
    const email = String(values.get("email") || "").trim();
    const whatsapp = String(values.get("whatsapp") || "").trim();
    const website = String(values.get("website") || "").trim();
    const serviceValue = String(values.get("service") || "").trim();
    const planValue = String(values.get("plan") || "").trim();
    const details = String(values.get("message") || "").trim();
    const consent = values.get("contact_consent") === "on";
    const errors = [];
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const phoneValid = !whatsapp || /^[+()\-\s\d]{7,30}$/.test(whatsapp) && /\d/.test(whatsapp);
    let websiteValid = true;
    if (website) { try { const url = new URL(website); websiteValid = url.protocol === "https:" || url.protocol === "http:"; } catch { websiteValid = false; } }
    setFieldError("name", name ? "" : "Enter your full name.");
    setFieldError("email", emailValid ? "" : "Enter a valid work email address.");
    setFieldError("whatsapp", phoneValid ? "" : "Use a valid number with country code.");
    setFieldError("website", websiteValid ? "" : "Enter a valid http:// or https:// URL.");
    setFieldError("service", serviceValue ? "" : "Choose a testing service.");
    setFieldError("plan", planValue ? "" : "Choose a package or select Help me choose.");
    setFieldError("message", details.length >= 25 ? "" : "Add at least 25 characters about your project.");
    const consentInput = document.getElementById("contact-consent");
    const consentError = document.getElementById("consent-error");
    if (consentInput && consentError) {
      consentError.textContent = consent ? "" : "Please confirm that we may contact you about this inquiry.";
      consentInput.setAttribute("aria-invalid", consent ? "false" : "true");
    }
    if (!name) errors.push("name"); if (!emailValid) errors.push("email"); if (!phoneValid) errors.push("whatsapp");
    if (!websiteValid) errors.push("website"); if (!serviceValue) errors.push("service"); if (!planValue) errors.push("plan");
    if (details.length < 25) errors.push("message"); if (!consent) errors.push("consent");
    return errors.length === 0;
  }

  function updateMessageCount() {
    if (messageCount) messageCount.textContent = String(message.value.length) + " / 5000";
  }
  updateMessageCount();

  const requestedResource = params.get("request");
  const requestedEmail = params.get("email");
  if (requestedEmail && emailInput) emailInput.value = requestedEmail;
  if (requestedResource === "prelaunch-checklist") {
    message.value = "Please send me the Pre-Launch QA Checklist.";
    formStatus.textContent = "Complete the remaining fields and submit your request. We’ll send the checklist to your work email.";
  } else if (requestedResource === "sample-qa-report") {
    message.value = "Please send me a sample QA report.";
    formStatus.textContent = "Complete the remaining fields and submit your request. We’ll send the sample report to your work email.";
  } else if (requestedResource === "free-qa-call") {
    message.value = "I would like to request a free 15-minute QA call.";
    formStatus.textContent = "Complete the remaining fields and submit your request. We’ll contact you to arrange a suitable time.";
  }

  function addOption(value, label) {
    const item = document.createElement("option");
    item.value = value;
    item.textContent = label;
    return item;
  }

  function planPrices(item) {
    const current = String(item.price || "").trim();
    const original = String(item.originalPrice || "").trim();
    return {
      current,
      original,
      discounted: Boolean(current && original && current !== original),
      display: current || original || "Price to be agreed",
    };
  }

  function priceText(item) {
    return String(item.price || "Price to be agreed").trim();
  }

  function packageLabel(item) {
    if (!item) return "Help me choose";
    if (item.kind === "retainer") {
      return item.name + " retainer — monthly price: " + priceText(item) + "; " + item.hours + " hours / month";
    }
    const prices = planPrices(item);
    const priceDescription = prices.discounted
      ? "discounted price: " + prices.current + " (original price: " + prices.original + ")"
      : prices.current
        ? "current price: " + prices.current
        : prices.original
          ? "original price: " + prices.original
          : "price: " + prices.display;
    const coverage = [item.hours, item.billing].filter(Boolean).join(" · ");
    return item.name + " — " + priceDescription + (coverage ? "; " + coverage : "");
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
      const prices = item.kind === "retainer" ? null : planPrices(item);
      priceCurrent.textContent = item.kind === "retainer" ? priceText(item) + " / month" : prices.display;
      const hasDiscount = item.kind !== "retainer" && prices.discounted;
      priceLabel.textContent = item.kind === "retainer" ? "Monthly price" : hasDiscount ? "Discounted price" : !prices.current && prices.original ? "Original price" : "Current price";
      priceOriginal.hidden = !hasDiscount;
      priceOriginal.textContent = hasDiscount ? prices.original : "";
      priceMeta.textContent = item.kind === "retainer"
        ? item.hours + " hours / month"
        : [item.hours, item.billing].filter(Boolean).join(" · ");
      const nextMessage = messageFor(item);
      if (updateMessage && (!message.value.trim() || message.value === generatedMessage)) {
        message.value = nextMessage;
        generatedMessage = nextMessage;
        updateMessageCount();
      }
    } else {
      priceSummary.hidden = true;
      if (updateMessage && message.value === generatedMessage) {
        message.value = "";
        generatedMessage = "";
        updateMessageCount();
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
      const prices = planPrices(plan);
      const priceOption = prices.discounted
        ? " — discounted: " + prices.current + " (original: " + prices.original + ")"
        : prices.current
          ? " — " + prices.current
          : prices.original
            ? " — original price: " + prices.original
            : " — Price to be agreed";
      planSelect.append(addOption(key, plan.name + priceOption));
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
    if (event.target === message) updateMessageCount();
    if (event.target && event.target.id) setFieldError(event.target.id, "");
    preview.hidden = true;
    downloadButton.hidden = true;
    formStatus.textContent = "";
    prepared = "";
  });
  form.addEventListener("change", function(event) {
    if (event.target && event.target.id === "contact-consent") {
      const consentError = document.getElementById("consent-error");
      if (event.target.checked) {
        event.target.setAttribute("aria-invalid", "false");
        if (consentError) consentError.textContent = "";
      }
    }
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

  form.addEventListener("submit", async function(event) {
    event.preventDefault();
    if (!validateInquiry()) {
      formStatus.textContent = "Please correct the highlighted fields before sending your inquiry.";
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid && typeof firstInvalid.focus === "function") firstInvalid.focus();
      return;
    }
    const data = new FormData(form);
    const selectedPackage = packages.get(planSelect.value);
    const inquiry = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      company: String(data.get("company") || "").trim(),
      whatsapp: String(data.get("whatsapp") || "").trim(),
      website: String(data.get("website") || "").trim(),
      service: String(data.get("service") || "").trim(),
      plan: packageLabel(selectedPackage),
      timeline: String(data.get("timeline") || "").trim(),
      budget: String(data.get("budget") || "").trim(),
      message: String(data.get("message") || "").trim(),
      fax_number: String(data.get("fax_number") || "").trim(),
      contact_consent: data.get("contact_consent") === "on",
      form_started_at: String(data.get("form_started_at") || ""),
      source: String(data.get("inquiry_source") || "Direct contact page").trim(),
    };
    prepared = "BugXtract.com — Project Inquiry\n\n" +
      [["Name", inquiry.name], ["Work email", inquiry.email], ["Company", inquiry.company], ["WhatsApp number", inquiry.whatsapp], ["Product URL", inquiry.website], ["Service", inquiry.service], ["Selected package / current price", inquiry.plan], ["Target release", inquiry.timeline], ["Budget", inquiry.budget], ["Project details", inquiry.message]]
        .map(function(entry) { return entry[0] + ": " + (entry[1] || "Not specified"); })
        .join("\n");
    preview.textContent = prepared;
    preview.hidden = false;
    downloadButton.hidden = false;
    submitButton.disabled = true;
    submitButton.textContent = "Sending inquiry…";
    formStatus.textContent = "Saving and sending your inquiry…";
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inquiry),
      });
      const rawResponse = await response.text();
      let result = {};
      try {
        result = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error(response.ok
          ? "The email service returned an unexpected response. Please try again."
          : `The contact service is unavailable right now (HTTP ${response.status}). Please try again shortly.`);
      }
      if (!response.ok && result.code === "provider_not_configured" && result.recipientEmail) {
        const subject = encodeURIComponent("BugXtract.com — " + (selectedPackage ? selectedPackage.name : "Project inquiry"));
        const body = encodeURIComponent(prepared);
        formStatus.textContent = "Automatic email setup is pending. Your email app is opening with the inquiry addressed to " + result.recipientEmail + ". Review it and press Send. If no email app opens, download the inquiry below.";
        window.location.href = "mailto:" + encodeURIComponent(result.recipientEmail) + "?subject=" + subject + "&body=" + body;
        return;
      }
      if (!response.ok) throw new Error(result.error || "Your inquiry could not be sent. Please try again.");
      formStatus.textContent = "Thank you — your QA inquiry has been received. We usually reply within one business day." + (result.confirmationSent ? " A confirmation email is on its way." : "");
      preview.hidden = true;
      downloadButton.hidden = true;
      form.reset();
      priceSummary.hidden = true;
      generatedMessage = "";
      prepared = "";
    } catch (error) {
      formStatus.textContent = error instanceof Error ? error.message : "Your inquiry could not be sent. Your details are still here—please try again.";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Send inquiry";
    }
  });

  downloadButton.addEventListener("click", function() {
    if (!prepared) return;
    const url = URL.createObjectURL(new Blob([prepared], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "bugxtract-project-inquiry.txt";
    link.click();
    setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    formStatus.textContent = "Inquiry downloaded. Keep it for your records, or retry the online send.";
  });
}
