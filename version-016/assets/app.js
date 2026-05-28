
(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function isVisible(el) {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }

  function setupMobileNav() {
    var toggle = qs('[data-menu-toggle]');
    var drawer = qs('[data-mobile-drawer]');
    if (!toggle || !drawer) return;

    toggle.addEventListener('click', function () {
      var open = drawer.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    qsa('[data-mobile-drawer] a').forEach(function (link) {
      link.addEventListener('click', function () {
        drawer.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function setupSearch() {
    qsa('[data-search-input]').forEach(function (input) {
      input.addEventListener('input', function () {
        var term = input.value.trim().toLowerCase();
        var scope = input.getAttribute('data-search-scope');
        var root = scope ? qs(scope) : document;
        var cards = qsa('[data-card]', root);
        var visible = 0;

        cards.forEach(function (card) {
          var hay = (card.getAttribute('data-search') || card.textContent || '').toLowerCase();
          var show = !term || hay.indexOf(term) !== -1;
          card.style.display = show ? '' : 'none';
          if (show) visible++;
        });

        qsa('[data-empty]', root).forEach(function (empty) {
          empty.style.display = visible ? 'none' : '';
        });
      });
    });
  }

  function setupHeroSlider() {
    var slider = qs('[data-hero-slider]');
    if (!slider) return;

    var slides = qsa('[data-hero-slide]', slider);
    var dots = qsa('[data-hero-dot]', slider);
    var prev = qs('[data-hero-prev]', slider);
    var next = qs('[data-hero-next]', slider);
    if (!slides.length) return;

    var current = 0;
    var timer = null;
    var paused = false;

    function render(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === current);
        dot.setAttribute('aria-pressed', i === current ? 'true' : 'false');
      });
    }

    function go(step) {
      render(current + step);
    }

    function start() {
      if (timer || slides.length < 2) return;
      timer = window.setInterval(function () {
        if (!paused) go(1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    slides.forEach(function (slide) {
      slide.classList.add('animate-fade-in');
    });

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        render(i);
      });
    });

    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });

    slider.addEventListener('mouseenter', function () { paused = true; });
    slider.addEventListener('mouseleave', function () { paused = false; });

    render(0);
    start();
  }

  function setupPlayer() {
    var container = qs('[data-player]');
    if (!container) return;

    var video = qs('video', container);
    var overlay = qs('[data-player-overlay]', container);
    var playButton = qs('[data-play-button]', container);
    var sourceButtons = qsa('[data-source-btn]', container);
    var sourceLabel = qs('[data-current-source]', container);

    if (!video || !sourceButtons.length) return;

    var sources = sourceButtons.map(function (btn) {
      return {
        label: btn.textContent.trim(),
        src: btn.getAttribute('data-src')
      };
    });

    var hls = null;
    var current = 0;
    var trying = false;

    function destroyHls() {
      if (hls && typeof hls.destroy === 'function') {
        hls.destroy();
      }
      hls = null;
    }

    function updateActive(index) {
      sourceButtons.forEach(function (btn, i) {
        btn.classList.toggle('is-active', i === index);
        btn.setAttribute('aria-pressed', i === index ? 'true' : 'false');
      });
      if (sourceLabel) {
        sourceLabel.textContent = sources[index].label;
      }
    }

    function attachSource(index, shouldPlay) {
      if (!sources[index]) return;
      current = index;
      updateActive(index);
      destroyHls();
      var src = sources[index].src;
      video.pause();
      video.removeAttribute('src');
      video.load();

      if (window.Hls && window.Hls.isSupported && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal && !trying) {
            trying = true;
            var next = (current + 1) % sources.length;
            setTimeout(function () {
              trying = false;
              attachSource(next, true);
            }, 200);
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      } else {
        video.src = src;
      }

      if (shouldPlay) {
        var p = video.play();
        if (p && typeof p.catch === 'function') {
          p.catch(function () {});
        }
      }
    }

    function playCurrent() {
      attachSource(current, true);
      if (overlay) overlay.classList.add('is-playing');
    }

    sourceButtons.forEach(function (btn, index) {
      btn.addEventListener('click', function () {
        attachSource(index, true);
        if (overlay) overlay.classList.add('is-playing');
      });
    });

    if (playButton) {
      playButton.addEventListener('click', function (e) {
        e.preventDefault();
        playCurrent();
      });
    }

    video.addEventListener('play', function () {
      if (overlay) overlay.classList.add('is-playing');
    });

    video.addEventListener('pause', function () {
      if (overlay) overlay.classList.remove('is-playing');
    });

    video.addEventListener('error', function () {
      if (!trying && sources.length > 1) {
        trying = true;
        var next = (current + 1) % sources.length;
        setTimeout(function () {
          trying = false;
          attachSource(next, true);
        }, 250);
      }
    });

    if (overlay) {
      overlay.addEventListener('click', function () {
        playCurrent();
      });
    }

    container.addEventListener('click', function (e) {
      if (e.target.closest('button, a, input, select, textarea')) return;
      if (!isVisible(container)) return;
      playCurrent();
    });

    attachSource(0, false);
  }

  function setupReveal() {
    var items = qsa('[data-reveal]');
    if (!('IntersectionObserver' in window) || !items.length) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMobileNav();
    setupSearch();
    setupHeroSlider();
    setupPlayer();
    setupReveal();
  });
})();
