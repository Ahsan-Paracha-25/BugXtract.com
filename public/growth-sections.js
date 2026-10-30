(() => {
  const form = document.getElementById("checklist-capture");
  if (!form) return;
  const email = document.getElementById("checklist-email");
  const status = document.getElementById("checklist-status");
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!email.value || !email.checkValidity()) {
      status.textContent = "Please enter a valid work email address.";
      email.focus();
      return;
    }
    const query = new URLSearchParams({ email: email.value.trim(), request: "prelaunch-checklist" });
    window.location.assign("/contact/?" + query.toString());
  });
})();
