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
    if (!Array.isArray(reviews) || reviews.length === 0) return;

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
    const renderCards = () => {
      grid.replaceChildren();
      reviews.slice(0, visible).forEach((review) => {
        const card = make("article", "customer-review-card");
        const top = make("div", "customer-review-top");
        const rating = Math.max(1, Math.min(5, Number(review.rating) || 5));
        const stars = make("span", "customer-review-stars", "★".repeat(rating) + "☆".repeat(5 - rating));
        stars.setAttribute("aria-label", `${rating} out of 5 stars`);
        stars.setAttribute("role", "img");
        top.append(stars, make("span", "customer-review-mark", "“ ”"));
        const quote = make("blockquote", "customer-review-quote");
        quote.append(make("h3", "", review.headline));
        quote.append(make("p", "", review.body));
        const person = make("div", "customer-review-person");
        const image = document.createElement("img");
        image.src = review.imageUrl;
        image.alt = `${review.customerName}’s photo`;
        image.loading = "lazy";
        image.width = 52;
        image.height = 52;
        const details = make("div", "customer-review-person-details");
        details.append(make("strong", "", review.customerName));
        details.append(make("span", "", [review.role, review.company].filter(Boolean).join(" · ")));
        person.append(image, details);
        card.append(top, quote, person);
        grid.append(card);
      });
      more.hidden = visible >= reviews.length;
    };

    more.addEventListener("click", () => {
      visible += 6;
      renderCards();
    });
    wrap.append(header, grid, more);
    section.append(wrap);
    if (faq && faq.parentNode === main) main.insertBefore(section, faq);
    else main.append(section);
    renderCards();
  }

  fetch("/api/reviews", { cache: "no-store" })
    .then((response) => response.ok ? response.json() : [])
    .then(render)
    .catch(() => {});
})();
