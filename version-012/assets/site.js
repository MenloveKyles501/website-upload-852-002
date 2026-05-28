
import { H as Hls } from './video-vendor-dru42stk.js';

function qs(sel, root = document) {
  return root.querySelector(sel);
}

function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function getSearchParams() {
  return new URLSearchParams(window.location.search);
}

function highlightActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  qsa('[data-nav-link]').forEach((link) => {
    try {
      const href = new URL(link.getAttribute('href'), window.location.href).pathname.split('/').pop() || 'index.html';
      if (href === path) {
        link.classList.add('active');
      }
    } catch (err) {}
  });
}

function initMobileNav() {
  const toggle = qs('[data-mobile-toggle]');
  const panel = qs('[data-mobile-nav]');
  if (!toggle || !panel) return;
  toggle.addEventListener('click', () => {
    panel.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', panel.classList.contains('is-open') ? 'true' : 'false');
  });
}

function initHeroCarousel() {
  const carousel = qs('[data-hero-carousel]');
  if (!carousel) return;
  const track = qs('[data-carousel-track]', carousel);
  const slides = qsa('[data-carousel-slide]', carousel);
  const dotsWrap = qs('[data-carousel-dots]', carousel);
  const prevBtn = qs('[data-carousel-prev]', carousel);
  const nextBtn = qs('[data-carousel-next]', carousel);
  if (!track || slides.length <= 1) return;

  let index = 0;
  const dots = slides.map((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `切换到第 ${i + 1} 张推荐`);
    b.addEventListener('click', () => go(i));
    dotsWrap && dotsWrap.appendChild(b);
    return b;
  });

  function render() {
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  }

  function go(next) {
    index = (next + slides.length) % slides.length;
    render();
  }

  prevBtn && prevBtn.addEventListener('click', () => go(index - 1));
  nextBtn && nextBtn.addEventListener('click', () => go(index + 1));

  let timer = window.setInterval(() => go(index + 1), 5600);
  carousel.addEventListener('mouseenter', () => window.clearInterval(timer));
  carousel.addEventListener('mouseleave', () => {
    timer = window.setInterval(() => go(index + 1), 5600);
  });

  render();
}

function initFilterAndSort() {
  const form = qs('[data-filter-form]');
  if (!form) return;
  const input = qs('[data-filter-input]', form);
  const select = qs('[data-sort-select]', form);
  const cards = qsa('[data-movie-card]', form.closest('.section') || document);
  if (!input && !select) return;

  function normalize(value) {
    return (value || '').toString().toLowerCase();
  }

  function apply() {
    const query = normalize(input ? input.value : '');
    const sort = select ? select.value : 'default';

    cards.forEach((card) => {
      const hay = normalize([
        card.dataset.title,
        card.dataset.year,
        card.dataset.genre,
        card.dataset.tags,
        card.dataset.region,
        card.dataset.type,
        card.dataset.score
      ].join(' '));
      const show = !query || hay.includes(query);
      card.classList.toggle('hidden', !show);
    });

    if (sort !== 'default') {
      const list = cards[0] && cards[0].parentElement;
      if (list) {
        const visibleCards = cards.filter((card) => !card.classList.contains('hidden'));
        visibleCards.sort((a, b) => {
          if (sort === 'year-desc') return Number(b.dataset.year || 0) - Number(a.dataset.year || 0);
          if (sort === 'year-asc') return Number(a.dataset.year || 0) - Number(b.dataset.year || 0);
          if (sort === 'score-desc') return Number(b.dataset.score || 0) - Number(a.dataset.score || 0);
          if (sort === 'title-asc') return (a.dataset.title || '').localeCompare(b.dataset.title || '', 'zh-Hans-CN');
          return 0;
        });
        visibleCards.forEach((card) => list.appendChild(card));
      }
    }
  }

  input && input.addEventListener('input', apply);
  select && select.addEventListener('change', apply);
  apply();
}

function initPlayer() {
  const shell = qs('[data-player-shell]');
  if (!shell) return;
  const video = qs('video', shell);
  const button = qs('[data-player-overlay]', shell);
  if (!video || !button) return;

  const hlsSrc = video.dataset.hlsSrc;
  const mp4Src = video.dataset.mp4Src || '';
  let hls = null;
  let started = false;

  function playVideo() {
    if (started) {
      video.play().catch(() => {});
      button.classList.add('hidden');
      return;
    }

    started = true;
    button.classList.add('hidden');

    if (hlsSrc && Hls && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false
      });
      hls.loadSource(hlsSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, function (event, data) {
        console.warn('HLS error', data);
        if (data && data.fatal) {
          if (mp4Src) {
            video.src = mp4Src;
            video.play().catch(() => {});
          }
        }
      });
      video.addEventListener('canplay', () => {
        video.play().catch(() => {});
      }, { once: true });
    } else if (hlsSrc && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsSrc;
      video.play().catch(() => {});
    } else if (mp4Src) {
      video.src = mp4Src;
      video.play().catch(() => {});
    } else {
      console.warn('No playable source found.');
    }
  }

  button.addEventListener('click', playVideo);
  video.addEventListener('click', () => {
    if (video.paused) {
      playVideo();
    }
  });
}

async function initSearchPage() {
  const mount = qs('[data-search-results]');
  if (!mount) return;

  const params = getSearchParams();
  const initialQuery = (params.get('q') || '').trim().toLowerCase();
  const input = qs('[data-search-input]');
  const dataUrl = mount.dataset.source;
  let data = Array.isArray(window.__MOVIES_INDEX__) ? window.__MOVIES_INDEX__ : [];
  if (!data.length && dataUrl) {
    try {
      const resp = await fetch(dataUrl, { cache: 'no-cache' });
      data = await resp.json();
    } catch (err) {
      mount.innerHTML = '<div class="panel">搜索数据加载失败。</div>';
      return;
    }
  }

  function normalize(value) {
    return (value || '').toString().toLowerCase();
  }

  function scoreText(movie) {
    return [
      movie.title,
      movie.year,
      movie.region,
      movie.type,
      movie.genre,
      movie.tags,
      movie.one_line,
      movie.category
    ].join(' ');
  }

  function render(list) {
    if (!list.length) {
      mount.innerHTML = '<div class="panel">没有匹配结果。</div>';
      return;
    }

    mount.innerHTML = list.slice(0, 120).map((m, i) => `
      <article class="search-item">
        <a href="${m.page}">
          <img src="${m.poster}" alt="${m.title}">
        </a>
        <div>
          <h3><a href="${m.page}">${m.title}</a></h3>
          <p>${m.one_line || ''}</p>
          <div class="meta">
            <span>${m.year || ''}</span>
            <span>${m.region || ''}</span>
            <span>${m.type || ''}</span>
            <span>${m.genre || ''}</span>
            <span>${m.category || ''}</span>
          </div>
        </div>
        <div class="action">
          <a class="btn btn-primary" href="${m.page}">查看详情</a>
        </div>
      </article>
    `).join('');
  }

  function apply() {
    const query = normalize(input ? input.value : initialQuery);
    const filtered = data.filter((movie) => !query || normalize(scoreText(movie)).includes(query));
    filtered.sort((a, b) => (Number(b.score || 0) - Number(a.score || 0)));
    render(filtered);
  }

  if (input) {
    input.value = initialQuery;
    input.addEventListener('input', apply);
  }
  apply();
}

function initDetailsJump() {
  qsa('[data-jump]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.jump);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  highlightActiveNav();
  initMobileNav();
  initHeroCarousel();
  initFilterAndSort();
  initPlayer();
  initSearchPage();
  initDetailsJump();
});
