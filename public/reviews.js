(() => {
  const faq = document.querySelector("#faq");
  const main = document.querySelector("main");
  if (!main || document.querySelector("#customer-reviews")) return;

  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function render(reviews) {
    if (!Array.isArray(reviews)) return;
    reviews = reviews.filter((review) => review && [review.customerName, review.role, review.company, review.headline, review.body, review.imageUrl].some(Boolean) || Number(review?.rating) > 0);
    if (reviews.length === 0) return;

    const section = make("section", "customer-reviews");
    section.id = "customer-reviews";
    section.setAttribute("aria-labelledby", "customer-reviews-title");
    const wrap = make("div", "wrap");
    const header = make("div", "customer-reviews-heading");
    header.append(make("div", "eyebrow", "Customer reviews"));
    const title = make("h2", "", "Quality work. Trusted teams.");
    title.id = "customer-reviews-title";
    header.append(title);
    header.append(make("p", "", "Feedback shared by customers we’ve worked with."));
    const grid = make("div", "customer-reviews-grid");
    grid.setAttribute("aria-live", "polite");
    const more = make("button", "customer-reviews-more", "Show more reviews");
    more.type = "button";

    let visible = 6;
    let autoScrollTimer = 0;
    let scrollDirection = 1;
    let sectionVisible = false;
    let pointerInside = false;
    const renderCards = () => {
      grid.replaceChildren();
      reviews.slice(0, visible).forEach((review) => {
        const card = make("article", "customer-review-card");
        const top = make("div", "customer-review-top");
        const rating = Math.max(0, Math.min(5, Number(review.rating) || 0));
        if (rating) {
          const stars = make("span", "customer-review-stars", "★★★★★");
          stars.style.backgroundImage = `linear-gradient(to right, #d48b1f ${rating / 5 * 100}%, #d8e1e9 ${rating / 5 * 100}%)`;
          stars.setAttribute("aria-label", `${rating} out of 5 stars`);
          stars.setAttribute("role", "img");
          top.append(stars, make("span", "customer-review-rating-value", `${rating.toFixed(1)} / 5`));
        }
        top.append(make("span", "customer-review-mark", "“ ”"));
        const quote = make("blockquote", "customer-review-quote");
        if (review.headline) quote.append(make("h3", "", review.headline));
        if (review.body) quote.append(make("p", "", review.body));
        const person = make("div", "customer-review-person");
        if (review.imageUrl) {
          const image = document.createElement("img");
          image.src = review.imageUrl;
          image.alt = review.customerName ? `${review.customerName}’s photo` : "Customer thumbnail";
          image.loading = "lazy";
          image.width = 52;
          image.height = 52;
          person.append(image);
        }
        if (review.customerName || review.role || review.company) {
          const details = make("div", "customer-review-person-details");
          if (review.customerName) details.append(make("strong", "", review.customerName));
          const description = [review.role, review.company].filter(Boolean).join(" · ");
          if (description) details.append(make("span", "", description));
          person.append(details);
        }
        card.append(top);
        if (review.headline || review.body) card.append(quote);
        if (person.childElementCount) card.append(person);
        grid.append(card);
      });
      more.hidden = visible >= reviews.length;
    };

    const stopAutoScroll = () => {
      if (autoScrollTimer) window.clearInterval(autoScrollTimer);
      autoScrollTimer = 0;
    };
    const startAutoScroll = () => {
      stopAutoScroll();
      if (!sectionVisible || pointerInside || grid.contains(document.activeElement) || document.hidden ||
          window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      autoScrollTimer = window.setInterval(() => {
        const maxScroll = grid.scrollWidth - grid.clientWidth;
        if (maxScroll <= 4) return;
        const firstCard = grid.querySelector(".customer-review-card");
        const step = (firstCard?.getBoundingClientRect().width || grid.clientWidth) + 18;
        if (grid.scrollLeft >= maxScroll - 4) scrollDirection = -1;
        if (grid.scrollLeft <= 4) scrollDirection = 1;
        grid.scrollBy({ left: scrollDirection * step, behavior: "smooth" });
      }, 4200);
    };

    more.addEventListener("click", () => {
      visible += 6;
      renderCards();
      startAutoScroll();
    });
    grid.addEventListener("mouseenter", () => { pointerInside = true; stopAutoScroll(); });
    grid.addEventListener("mouseleave", () => { pointerInside = false; startAutoScroll(); });
    grid.addEventListener("focusin", stopAutoScroll);
    grid.addEventListener("focusout", (event) => {
      if (!grid.contains(event.relatedTarget)) startAutoScroll();
    });
    wrap.append(header, grid, more);
    section.append(wrap);
    if (faq) faq.before(section);
    else main.append(section);
    renderCards();
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(entries => {
        sectionVisible = entries[0].isIntersecting;
        section.classList.toggle("is-in-view", sectionVisible);
        if (sectionVisible) startAutoScroll();
        else stopAutoScroll();
      }, { threshold: 0.12 });
      observer.observe(section);
    } else {
      sectionVisible = true;
      section.classList.add("is-in-view");
      startAutoScroll();
    }
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAutoScroll();
      else startAutoScroll();
    });
  }

  fetch("/api/reviews", { cache: "no-store" })
    .then((response) => response.ok ? response.json() : [])
    .then(render)
    .catch(() => {});
})();
