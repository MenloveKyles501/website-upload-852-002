(function () {
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function setupMobileNav() {
    const toggle = $('[data-nav-toggle]');
    const nav = $('#site-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function setupHeroCarousel() {
    const carousel = $('[data-hero-carousel]');
    if (!carousel) return;

    const slides = $all('[data-hero-slide]', carousel);
    const dots = $all('[data-hero-dot]', carousel);
    let index = 0;
    let timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.hidden = i !== index;
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
        dot.setAttribute('aria-pressed', i === index ? 'true' : 'false');
      });
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        restart();
      });
    });

    function restart() {
      if (timer) window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(index + 1);
      }, 4500);
    }

    show(0);
    restart();
  }

  function renderSearchResults(items, query) {
    const wrap = $('[data-search-results]');
    const count = $('[data-search-count]');
    if (!wrap || !count) return;

    count.textContent = String(items.length);
    if (!items.length) {
      wrap.innerHTML = '<div class="empty-state">没有找到匹配结果，试试更短的关键词或切换到“全部影片”浏览。</div>';
      return;
    }

    wrap.innerHTML = items.map(function (movie) {
      const genres = (movie.genres || []).slice(0, 2).join(' · ');
      return `
        <article class="movie-card">
          <a class="card-link" href="detail/${movie.id}.html">
            <div class="movie-poster">
              <img src="${movie.cover}" alt="${movie.title}">
              <div class="movie-badges">
                <span class="movie-badge">${movie.year}</span>
                <span class="movie-badge">#${movie.id}</span>
              </div>
            </div>
            <div class="movie-body">
              <h3 class="movie-title">${movie.title}</h3>
              <div class="movie-meta">
                <span>${movie.region}</span>
                <span>${movie.type}</span>
                <span>${genres}</span>
              </div>
              <p class="movie-desc">${movie.oneLine}</p>
            </div>
          </a>
        </article>
      `;
    }).join('');
  }

  function setupSearchPage() {
    const results = $('[data-search-results]');
    if (!results || !window.MOVIES) return;

    const input = $('[data-search-input]');
    const params = new URLSearchParams(window.location.search);
    const initial = (params.get('q') || '').trim();
    const type = (params.get('type') || '').trim();
    const year = (params.get('year') || '').trim();

    if (input) input.value = initial;
    const doFilter = function () {
      const q = (input && input.value ? input.value : initial).trim().toLowerCase();
      let items = window.MOVIES.slice();

      if (type) {
        items = items.filter(function (m) { return m.type === type; });
      }
      if (year) {
        items = items.filter(function (m) { return m.year === year; });
      }

      if (q) {
        items = items.filter(function (m) {
          const hay = [
            m.title,
            m.region,
            m.type,
            m.year,
            (m.genres || []).join(' '),
            (m.tags || []).join(' '),
            m.oneLine
          ].join(' ').toLowerCase();
          return hay.indexOf(q) !== -1;
        });
      }

      renderSearchResults(items.slice(0, 120), q);
    };

    if (input) {
      input.addEventListener('input', doFilter);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          doFilter();
        }
      });
    }

    doFilter();
  }

  function setupPlayer() {
    const video = $('[data-player]');
    if (!video) return;

    let sources = [];
    try {
      sources = JSON.parse(video.getAttribute('data-streams') || '[]');
    } catch (err) {
      sources = [];
    }
    if (!sources.length) return;

    const buttons = $all('[data-stream-btn]');
    let current = 0;
    let hls = null;

    function bindButtons(activeIndex) {
      buttons.forEach(function (btn, i) {
        btn.classList.toggle('active', i === activeIndex);
        btn.setAttribute('aria-pressed', i === activeIndex ? 'true' : 'false');
      });
    }

    function play(index) {
      current = index % sources.length;
      const url = sources[current];

      if (hls) {
        try { hls.destroy(); } catch (e) {}
        hls = null;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(url);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
      } else {
        video.src = url;
      }

      bindButtons(current);
      video.play().catch(function () {});
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const idx = Number(btn.getAttribute('data-stream-btn'));
        if (Number.isFinite(idx)) play(idx);
      });
    });

    play(0);
  }

  function init() {
    setupMobileNav();
    setupHeroCarousel();
    setupSearchPage();
    setupPlayer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
