(function () {
  var body = document.body;
  var base = body ? body.getAttribute("data-base") || "." : ".";

  function joinBase(path) {
    return base.replace(/\/$/, "") + "/" + path.replace(/^\.\//, "");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function initMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var nav = document.querySelector("[data-mobile-nav]");
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
  }

  function initHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    var index = 0;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, current) {
        slide.classList.toggle("is-active", current === index);
      });
      dots.forEach(function (dot, current) {
        dot.classList.toggle("is-active", current === index);
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-slide")) || 0);
      });
    });

    if (slides.length > 1) {
      setInterval(function () {
        show(index + 1);
      }, 5200);
    }
  }

  function initSearch() {
    var forms = Array.prototype.slice.call(document.querySelectorAll("[data-search-form]"));
    var panel = document.getElementById("search-panel");
    if (!forms.length || !panel || !window.searchMovies) {
      return;
    }

    function render(query) {
      var normalized = query.trim().toLowerCase();
      if (!normalized) {
        panel.classList.remove("is-open");
        panel.innerHTML = "";
        return;
      }
      var items = window.searchMovies.filter(function (item) {
        var haystack = [item.title, item.region, item.type, item.year, item.genre, item.tags].join(" ").toLowerCase();
        return haystack.indexOf(normalized) !== -1;
      }).slice(0, 12);
      var content = items.length ? items.map(function (item) {
        return '<a class="search-item" href="' + joinBase(item.link) + '">' +
          '<img src="' + joinBase(item.cover) + '" alt="' + escapeHtml(item.title) + '" loading="lazy" />' +
          '<span><strong>' + escapeHtml(item.title) + '</strong><em>' + escapeHtml(item.year + ' · ' + item.region + ' · ' + item.genre) + '</em></span>' +
          '</a>';
      }).join("") : '<div class="empty-result">暂无匹配影片</div>';
      panel.innerHTML = '<div class="search-title"><span>搜索结果：' + escapeHtml(query) + '</span><button type="button" data-close-search>×</button></div><div class="search-results">' + content + '</div>';
      panel.classList.add("is-open");
      var close = panel.querySelector("[data-close-search]");
      if (close) {
        close.addEventListener("click", function () {
          panel.classList.remove("is-open");
        });
      }
    }

    forms.forEach(function (form) {
      var input = form.querySelector("input[type='search']");
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        render(input ? input.value : "");
      });
      if (input) {
        input.addEventListener("input", function () {
          render(input.value);
        });
      }
    });

    document.addEventListener("click", function (event) {
      if (!panel.contains(event.target) && !event.target.closest("[data-search-form]")) {
        panel.classList.remove("is-open");
      }
    });
  }

  function initFilters() {
    var bar = document.querySelector("[data-filter-bar]");
    var grid = document.querySelector("[data-filter-grid]");
    if (!bar || !grid) {
      return;
    }
    var chips = Array.prototype.slice.call(bar.querySelectorAll("[data-filter-chip]"));
    var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-card]"));

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var value = chip.getAttribute("data-filter-chip") || "全部";
        chips.forEach(function (item) {
          item.classList.toggle("is-active", item === chip);
        });
        cards.forEach(function (card) {
          var text = [
            card.getAttribute("data-title"),
            card.getAttribute("data-region"),
            card.getAttribute("data-type"),
            card.getAttribute("data-year"),
            card.getAttribute("data-genre"),
            card.getAttribute("data-tags")
          ].join(" ");
          var visible = value === "全部" || text.indexOf(value) !== -1;
          card.classList.toggle("is-hidden-card", !visible);
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMenu();
    initHero();
    initSearch();
    initFilters();
  });
})();
