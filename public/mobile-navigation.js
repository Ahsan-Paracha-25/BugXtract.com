(() => {
  const navigation = document.querySelector("header .navlinks");
  const nav = navigation?.closest("nav");
  if (!navigation || !nav) return;

  navigation.id = "primary-navigation";
  const toggle = document.createElement("button");
  toggle.className = "mobile-nav-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "primary-navigation");
  toggle.innerHTML = '<span class="sr-only">Open navigation</span><i aria-hidden="true"></i><i aria-hidden="true"></i><i aria-hidden="true"></i>';
  navigation.before(toggle);

  const close = () => {
    navigation.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.querySelector(".sr-only").textContent = "Open navigation";
  };
  const open = () => {
    navigation.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.querySelector(".sr-only").textContent = "Close navigation";
  };

  toggle.addEventListener("click", () => navigation.classList.contains("is-open") ? close() : open());
  navigation.querySelectorAll("a").forEach(link => link.addEventListener("click", close));
  window.addEventListener("keydown", event => { if (event.key === "Escape") close(); });
  window.addEventListener("resize", () => { if (window.innerWidth > 700) close(); });
})();
