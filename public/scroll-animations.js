(() => {
  const sections = ["plans", "retainers"]
    .map(id => document.getElementById(id))
    .filter(Boolean);
  if (!sections.length) return;

  if (!("IntersectionObserver" in window)) {
    sections.forEach(section => section.classList.add("is-in-view"));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.classList.toggle("is-in-view", entry.isIntersecting);
    });
  }, { threshold: 0.1 });
  sections.forEach(section => observer.observe(section));
})();
