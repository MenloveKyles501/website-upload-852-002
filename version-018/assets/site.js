
(function(){
  const ready = (fn) => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once:true });
    else fn();
  };

  const toLower = (v) => (v || '').toString().toLowerCase();
  const escapeReg = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function initMobileNav(){
    const btn = document.querySelector('[data-nav-toggle]');
    const nav = document.querySelector('[data-nav]');
    if(!btn || !nav) return;
    btn.addEventListener('click', () => nav.classList.toggle('is-open'));
  }

  function initSearchAndSort(){
    document.querySelectorAll('[data-filter-scope]').forEach(scope => {
      const input = scope.querySelector('[data-filter-input]');
      const sort = scope.querySelector('[data-sort]');
      const cards = Array.from(scope.querySelectorAll('[data-filter-item]'));
      const count = scope.querySelector('[data-filter-count]');
      if(!input && !sort) return;

      const apply = () => {
        const q = toLower(input ? input.value.trim() : '');
        const mode = sort ? sort.value : '';
        let visible = cards.slice();

        if(mode === 'year-desc') {
          visible.sort((a,b) => (+b.dataset.year||0) - (+a.dataset.year||0) || toLower(a.dataset.title).localeCompare(toLower(b.dataset.title), 'zh-Hans-CN'));
        } else if(mode === 'year-asc') {
          visible.sort((a,b) => (+a.dataset.year||0) - (+b.dataset.year||0) || toLower(a.dataset.title).localeCompare(toLower(b.dataset.title), 'zh-Hans-CN'));
        } else if(mode === 'title') {
          visible.sort((a,b) => toLower(a.dataset.title).localeCompare(toLower(b.dataset.title), 'zh-Hans-CN'));
        }

        let shown = 0;
        cards.forEach(card => {
          const hay = toLower(card.dataset.search || '');
          const ok = !q || hay.includes(q);
          card.style.display = ok ? '' : 'none';
          if(ok) shown += 1;
        });

        if(mode) {
          const parent = cards[0] && cards[0].parentElement;
          if(parent) {
            visible.forEach(card => parent.appendChild(card));
          }
        }
        if(count) count.textContent = shown.toString();
      };

      if(input) input.addEventListener('input', apply);
      if(sort) sort.addEventListener('change', apply);
      apply();
    });
  }

  function initHeroSlider(){
    document.querySelectorAll('[data-slider]').forEach(sliderWrap => {
      const slider = sliderWrap.querySelector('.slider');
      const prev = sliderWrap.querySelector('[data-prev]');
      const next = sliderWrap.querySelector('[data-next]');
      if(!slider) return;

      const shift = (dir) => {
        const card = slider.querySelector('.slide');
        const width = card ? card.getBoundingClientRect().width : slider.getBoundingClientRect().width;
        slider.scrollBy({ left: dir * (width + 14), behavior: 'smooth' });
      };

      prev && prev.addEventListener('click', () => shift(-1));
      next && next.addEventListener('click', () => shift(1));

      let timer = null;
      const start = () => {
        stop();
        timer = window.setInterval(() => {
          const max = slider.scrollWidth - slider.clientWidth - 4;
          const current = slider.scrollLeft;
          if (current >= max) slider.scrollTo({ left: 0, behavior: 'smooth' });
          else shift(1);
        }, 5500);
      };
      const stop = () => { if (timer) window.clearInterval(timer); timer = null; };
      sliderWrap.addEventListener('mouseenter', stop);
      sliderWrap.addEventListener('mouseleave', start);
      sliderWrap.addEventListener('focusin', stop);
      sliderWrap.addEventListener('focusout', start);
      start();
    });
  }

  function initPlayers(){
    document.querySelectorAll('[data-player]').forEach(player => {
      const video = player.querySelector('video');
      const overlay = player.querySelector('[data-player-overlay]');
      const playBtn = player.querySelector('[data-player-play]');
      if(!video) return;
      const src = player.dataset.src;
      let hls = null;
      let started = false;

      const hideOverlay = () => overlay && overlay.classList.add('is-hide');

      const bindSource = () => {
        if(started) return true;
        started = true;
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
          return true;
        }
        if (window.Hls && window.Hls.isSupported()) {
          hls = new Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.ERROR, function(_, data){
            if (data && data.fatal && hls) {
              try { hls.destroy(); } catch(e){}
            }
          });
          return true;
        }
        video.src = src;
        return true;
      };

      const play = async () => {
        bindSource();
        hideOverlay();
        try {
          await video.play();
        } catch (e) {}
      };

      overlay && overlay.addEventListener('click', play);
      playBtn && playBtn.addEventListener('click', play);
      video.addEventListener('click', play);

      player.addEventListener('keydown', (e) => {
        if(e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          play();
        }
      });
    });
  }

  function initRevealButtons(){
    document.querySelectorAll('[data-reveal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = document.querySelector(btn.dataset.reveal);
        if(target) target.scrollIntoView({behavior:'smooth', block:'start'});
      });
    });
  }

  ready(() => {
    initMobileNav();
    initSearchAndSort();
    initHeroSlider();
    initPlayers();
    initRevealButtons();
  });
})();
