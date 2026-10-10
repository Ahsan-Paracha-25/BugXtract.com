(() => {
  const targets = [
    ...["plans", "retainers"].map(id => document.getElementById(id)),
    ...document.querySelectorAll("#services .testing-tile, #services .flow-card"),
  ].filter(Boolean);
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach(target => target.classList.add("is-in-view"));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.classList.toggle("is-in-view", entry.isIntersecting);
    });
  }, { threshold: 0.1 });
  targets.forEach(target => observer.observe(target));
})();
