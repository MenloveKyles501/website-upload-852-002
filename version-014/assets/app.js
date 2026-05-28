
(function () {
  const doc = document;
  const win = window;

  function qs(selector, root = doc) {
    return root.querySelector(selector);
  }

  function qsa(selector, root = doc) {
    return Array.from(root.querySelectorAll(selector));
  }

  function debounce(fn, wait) {
    let t = null;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function normalize(str) {
    return String(str || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function setActiveNav() {
    const path = location.pathname.split("/").pop() || "index.html";
    qsa("[data-nav-link]").forEach((a) => {
      const href = a.getAttribute("href");
      const target = href ? href.split("/").pop() : "";
      if (target && target === path) {
        a.classList.add("active");
      }
    });
  }

  function initProgressBar() {
    const bar = qs("[data-progress]");
    if (!bar) return;
    const update = () => {
      const h = doc.documentElement;
      const scrolled = h.scrollTop || doc.body.scrollTop || 0;
      const height = Math.max(h.scrollHeight - h.clientHeight, 1);
      const pct = (scrolled / height) * 100;
      bar.style.width = pct.toFixed(2) + "%";
    };
    update();
    win.addEventListener("scroll", update, { passive: true });
    win.addEventListener("resize", update);
  }

  function initMobileNav() {
    const btn = qs("[data-menu-toggle]");
    const panel = qs("[data-mobile-panel]");
    if (!btn || !panel) return;
    btn.addEventListener("click", () => {
      const opened = panel.classList.toggle("open");
      btn.setAttribute("aria-expanded", opened ? "true" : "false");
    });
  }

  function initCarousel() {
    const root = qs("[data-carousel]");
    if (!root) return;

    const slides = qsa("[data-slide]", root);
    const dotsWrap = qs("[data-carousel-dots]", root);
    if (!slides.length) return;

    let active = 0;
    let timer = null;

    const setActive = (index) => {
      active = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        slide.classList.toggle("active", i === active);
      });
      if (dotsWrap) {
        qsa("[data-dot]", dotsWrap).forEach((dot, i) => {
          dot.classList.toggle("active", i === active);
          dot.setAttribute("aria-pressed", i === active ? "true" : "false");
        });
      }
    };

    if (dotsWrap && !dotsWrap.children.length) {
      slides.forEach((_, idx) => {
        const btn = doc.createElement("button");
        btn.type = "button";
        btn.className = "carousel-dot";
        btn.setAttribute("data-dot", "");
        btn.setAttribute("aria-label", `切换到第 ${idx + 1} 张`);
        btn.addEventListener("click", () => {
          setActive(idx);
          restart();
        });
        dotsWrap.appendChild(btn);
      });
    } else if (dotsWrap) {
      qsa("[data-dot]", dotsWrap).forEach((dot, idx) => {
        dot.addEventListener("click", () => {
          setActive(idx);
          restart();
        });
      });
    }

    const restart = () => {
      clearInterval(timer);
      timer = setInterval(() => setActive(active + 1), 5000);
    };

    setActive(0);
    restart();

    root.addEventListener("mouseenter", () => clearInterval(timer));
    root.addEventListener("mouseleave", restart);
    root.addEventListener("touchstart", () => clearInterval(timer), { passive: true });
    root.addEventListener("touchend", restart);
  }

  function initSearchFilter() {
    qsa("[data-search-root]").forEach((root) => {
      const input = qs("[data-search-input]", root);
      const cards = qsa("[data-filter-card]", root);
      const count = qs("[data-result-count]", root);
      const noResult = qs("[data-no-result]", root);
      const selects = qsa("[data-filter-select]", root);

      const apply = () => {
        const term = normalize(input ? input.value : "");
        const selectValues = selects.map((s) => normalize(s.value));
        let visible = 0;

        cards.forEach((card) => {
          const hay = normalize(
            [
              card.getAttribute("data-title"),
              card.getAttribute("data-region"),
              card.getAttribute("data-type"),
              card.getAttribute("data-year"),
              card.getAttribute("data-genres"),
              card.getAttribute("data-tags"),
              card.getAttribute("data-summary")
            ].join(" ")
          );

          const matchesTerm = !term || hay.includes(term);
          const matchesSelects = selects.every((select, i) => {
            const val = selectValues[i];
            if (!val || val === "all") return true;
            const key = normalize(select.getAttribute("data-filter-key"));
            const cardVal = normalize(card.getAttribute("data-" + key));
            return cardVal === val || cardVal.includes(val);
          });

          const show = matchesTerm && matchesSelects;
          card.classList.toggle("hidden", !show);
          if (show) visible += 1;
        });

        if (count) {
          count.textContent = String(visible);
        }
        if (noResult) {
          noResult.classList.toggle("hidden", visible !== 0);
        }
      };

      const run = debounce(apply, 120);
      if (input) {
        input.addEventListener("input", run);
      }
      selects.forEach((select) => select.addEventListener("change", apply));
      apply();
    });
  }

  function initPlayer() {
    qsa("[data-player-root]").forEach((root) => {
      const video = qs("video", root);
      const buttons = qsa("[data-source]", root);
      if (!video || !buttons.length) return;

      const playSource = (btn) => {
        const src = btn.getAttribute("data-source");
        const mime = btn.getAttribute("data-mime") || "video/mp4";

        buttons.forEach((b) => b.classList.toggle("active", b === btn));

        while (video.firstChild) {
          video.removeChild(video.firstChild);
        }

        const source = doc.createElement("source");
        source.src = src;
        source.type = mime;
        video.appendChild(source);
        video.load();

        const tryPlay = () => video.play().catch(() => {});
        if (video.readyState >= 2) {
          tryPlay();
        } else {
          video.addEventListener("canplay", tryPlay, { once: true });
        }
      };

      buttons.forEach((btn, idx) => {
        btn.addEventListener("click", () => playSource(btn));
        if (idx === 0) {
          btn.classList.add("active");
          playSource(btn);
        }
      });

      // HLS ready path: if a button points to m3u8 and Hls.js exists, use it.
      if (win.Hls && typeof win.Hls.isSupported === "function") {
        const hlsBtn = buttons.find((b) => (b.getAttribute("data-mime") || "").includes("mpegURL"));
        if (hlsBtn && win.Hls.isSupported()) {
          const src = hlsBtn.getAttribute("data-source");
          const hls = new win.Hls();
          hls.loadSource(src);
          hls.attachMedia(video);
        }
      }
    });
  }

  function initBackToTop() {
    const btn = qs("[data-back-to-top]");
    if (!btn) return;
    const update = () => {
      const y = win.scrollY || doc.documentElement.scrollTop || 0;
      btn.style.opacity = y > 300 ? "1" : "0";
      btn.style.pointerEvents = y > 300 ? "auto" : "none";
      btn.style.transform = y > 300 ? "translateY(0)" : "translateY(10px)";
    };
    update();
    win.addEventListener("scroll", update, { passive: true });
    btn.addEventListener("click", () => win.scrollTo({ top: 0, behavior: "smooth" }));
  }

  function initAutoCopyLinks() {
    qsa("[data-copy-link]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const text = btn.getAttribute("data-copy-link");
        try {
          await navigator.clipboard.writeText(text);
          btn.textContent = "已复制";
          setTimeout(() => (btn.textContent = "复制链接"), 1200);
        } catch (e) {
          window.prompt("复制链接", text);
        }
      });
    });
  }

  doc.addEventListener("DOMContentLoaded", () => {
    setActiveNav();
    initProgressBar();
    initMobileNav();
    initCarousel();
    initSearchFilter();
    initPlayer();
    initBackToTop();
    initAutoCopyLinks();
  });
})();
