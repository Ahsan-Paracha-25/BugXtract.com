(() => {
  const visual = document.querySelector(".qa-command-center");
  if (!visual) return;

  document.querySelectorAll(".reference-hero > .qa-visual-slide").forEach(slide => visual.append(slide));
})();
