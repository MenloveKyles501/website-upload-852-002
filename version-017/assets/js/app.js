const body = document.body;
const menuToggle = document.querySelector(".menu-toggle");

if (menuToggle) {
    menuToggle.addEventListener("click", () => {
        const open = body.classList.toggle("menu-open");
        menuToggle.setAttribute("aria-expanded", String(open));
    });
}

const hero = document.querySelector("[data-hero-slider]");

if (hero) {
    const slides = Array.from(hero.querySelectorAll(".hero-slide"));
    const dots = Array.from(hero.querySelectorAll(".hero-dot"));
    const prev = hero.querySelector(".hero-prev");
    const next = hero.querySelector(".hero-next");
    let current = 0;

    const show = (index) => {
        current = (index + slides.length) % slides.length;
        slides.forEach((slide, i) => slide.classList.toggle("active", i === current));
        dots.forEach((dot, i) => dot.classList.toggle("active", i === current));
    };

    dots.forEach((dot, index) => {
        dot.addEventListener("click", () => show(index));
    });

    if (prev) {
        prev.addEventListener("click", () => show(current - 1));
    }

    if (next) {
        next.addEventListener("click", () => show(current + 1));
    }

    window.setInterval(() => show(current + 1), 5200);
}

const normalize = (value) => String(value || "").toLowerCase().trim();

const applyFilter = (scope, keyword) => {
    const cards = Array.from(scope.querySelectorAll(".movie-card"));
    const query = normalize(keyword);

    cards.forEach((card) => {
        const text = normalize([
            card.dataset.title,
            card.dataset.region,
            card.dataset.type,
            card.dataset.year,
            card.dataset.genre,
            card.dataset.tags,
            card.textContent
        ].join(" "));
        card.classList.toggle("hidden-by-filter", query.length > 0 && !text.includes(query));
    });
};

const setupFilterForm = (form) => {
    const scope = document.querySelector("[data-filter-grid]");
    const input = form.querySelector("input[type='search']");

    if (!scope || !input) {
        return;
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        applyFilter(scope, input.value);
    });

    input.addEventListener("input", () => {
        applyFilter(scope, input.value);
    });
};

document.querySelectorAll("[data-card-filter]").forEach(setupFilterForm);

const searchForm = document.querySelector(".search-page-form");

if (searchForm) {
    const input = searchForm.querySelector("input[name='q']");
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q") || "";

    if (input && query) {
        input.value = query;
        const scope = document.querySelector("[data-filter-grid]");
        if (scope) {
            applyFilter(scope, query);
        }
    }
}
