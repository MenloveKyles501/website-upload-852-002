(function () {
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function initNavigation() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var mobile = document.querySelector('[data-mobile-nav]');
    if (!toggle || !mobile) {
      return;
    }
    toggle.addEventListener('click', function () {
      mobile.classList.toggle('is-open');
    });
  }

  function initImages() {
    var images = document.querySelectorAll('img');
    images.forEach(function (image) {
      image.addEventListener('error', function () {
        image.classList.add('is-missing');
        image.removeAttribute('src');
      }, { once: true });
    });
  }

  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(target) {
      if (!slides.length) {
        return;
      }
      index = (target + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 6000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function initFilters() {
    var panels = document.querySelectorAll('[data-filter-panel]');
    panels.forEach(function (panel) {
      var scope = panel.parentElement || document;
      var input = panel.querySelector('[data-filter-input]');
      var selects = panel.querySelectorAll('[data-filter-select]');
      var reset = panel.querySelector('[data-reset-filters]');
      var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-card]'));

      function value(name) {
        var select = panel.querySelector('[data-filter-select="' + name + '"]');
        return select ? select.value.trim().toLowerCase() : '';
      }

      function apply() {
        var q = input ? input.value.trim().toLowerCase() : '';
        var region = value('region');
        var type = value('type');
        cards.forEach(function (card) {
          var haystack = (card.getAttribute('data-search') || '').toLowerCase();
          var cardRegion = (card.getAttribute('data-region') || '').toLowerCase();
          var cardType = (card.getAttribute('data-type') || '').toLowerCase();
          var matched = true;
          if (q && haystack.indexOf(q) === -1) {
            matched = false;
          }
          if (region && cardRegion.indexOf(region) === -1) {
            matched = false;
          }
          if (type && cardType.indexOf(type) === -1) {
            matched = false;
          }
          card.hidden = !matched;
        });
      }

      if (input) {
        input.addEventListener('input', apply);
      }
      selects.forEach(function (select) {
        select.addEventListener('change', apply);
      });
      if (reset) {
        reset.addEventListener('click', function () {
          if (input) {
            input.value = '';
          }
          selects.forEach(function (select) {
            select.value = '';
          });
          apply();
        });
      }
    });
  }

  function initPlayers() {
    var players = document.querySelectorAll('[data-player]');
    players.forEach(function (box) {
      var video = box.querySelector('video');
      var button = box.querySelector('[data-play-button]');
      var status = box.querySelector('[data-player-status]');
      if (!video || !button) {
        return;
      }
      var m3u8 = video.getAttribute('data-m3u8');
      var mp4 = video.getAttribute('data-mp4');
      var hls = null;
      var loaded = false;

      function setStatus(text) {
        if (status) {
          status.textContent = text;
        }
      }

      function loadSource() {
        if (loaded) {
          return;
        }
        loaded = true;
        if (window.location.protocol !== 'file:' && window.Hls && window.Hls.isSupported() && m3u8) {
          hls = new window.Hls({ enableWorker: true });
          hls.loadSource(m3u8);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            setStatus('高清线路');
          });
          hls.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal && mp4) {
              hls.destroy();
              video.src = mp4;
              setStatus('备用线路');
            }
          });
        } else if (m3u8 && video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = m3u8;
          setStatus('高清线路');
        } else if (mp4) {
          video.src = mp4;
          setStatus('高清线路');
        }
      }

      function togglePlay() {
        loadSource();
        if (video.paused) {
          video.play().then(function () {
            button.classList.add('is-hidden');
          }).catch(function () {
            button.classList.remove('is-hidden');
          });
        } else {
          video.pause();
          button.classList.remove('is-hidden');
        }
      }

      button.addEventListener('click', togglePlay);
      video.addEventListener('click', togglePlay);
      video.addEventListener('play', function () {
        button.classList.add('is-hidden');
      });
      video.addEventListener('pause', function () {
        button.classList.remove('is-hidden');
      });
      video.addEventListener('ended', function () {
        button.classList.remove('is-hidden');
      });
      video.addEventListener('error', function () {
        if (mp4 && video.src.indexOf(mp4) === -1) {
          video.src = mp4;
          setStatus('备用线路');
        }
      });
    });
  }

  ready(function () {
    initNavigation();
    initImages();
    initHero();
    initFilters();
    initPlayers();
  });
})();
