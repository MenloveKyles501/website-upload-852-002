(function () {
    function selectAll(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function initMenu() {
        var button = document.querySelector('[data-menu-toggle]');
        if (!button) {
            return;
        }
        button.addEventListener('click', function () {
            document.body.classList.toggle('menu-open');
        });
    }

    function initHero() {
        var hero = document.querySelector('[data-hero]');
        if (!hero) {
            return;
        }
        var slides = selectAll('[data-hero-slide]', hero);
        var dots = selectAll('[data-hero-dot]', hero);
        var prev = hero.querySelector('[data-hero-prev]');
        var next = hero.querySelector('[data-hero-next]');
        var active = 0;
        var timer;

        function show(index) {
            if (!slides.length) {
                return;
            }
            active = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('active', slideIndex === active);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('active', dotIndex === active);
            });
        }

        function restart() {
            window.clearInterval(timer);
            timer = window.setInterval(function () {
                show(active + 1);
            }, 5200);
        }

        if (prev) {
            prev.addEventListener('click', function () {
                show(active - 1);
                restart();
            });
        }
        if (next) {
            next.addEventListener('click', function () {
                show(active + 1);
                restart();
            });
        }
        dots.forEach(function (dot, index) {
            dot.addEventListener('click', function () {
                show(index);
                restart();
            });
        });
        show(0);
        restart();
    }

    function initRows() {
        selectAll('[data-row]').forEach(function (row) {
            var target = row.querySelector('[data-row-track]');
            var left = row.querySelector('[data-row-left]');
            var right = row.querySelector('[data-row-right]');
            if (!target) {
                return;
            }
            if (left) {
                left.addEventListener('click', function () {
                    target.scrollBy({ left: -360, behavior: 'smooth' });
                });
            }
            if (right) {
                right.addEventListener('click', function () {
                    target.scrollBy({ left: 360, behavior: 'smooth' });
                });
            }
        });
    }

    function initSearch() {
        var input = document.querySelector('[data-live-search]');
        if (!input) {
            return;
        }
        var cards = selectAll('[data-search-card]');
        var empty = document.querySelector('[data-empty]');
        var params = new URLSearchParams(window.location.search);
        var initial = params.get('q') || '';

        function normalize(value) {
            return (value || '').toString().trim().toLowerCase();
        }

        function apply() {
            var keyword = normalize(input.value);
            var visible = 0;
            cards.forEach(function (card) {
                var haystack = normalize([
                    card.getAttribute('data-title'),
                    card.getAttribute('data-tags'),
                    card.getAttribute('data-year'),
                    card.getAttribute('data-region'),
                    card.getAttribute('data-genre')
                ].join(' '));
                var matched = !keyword || haystack.indexOf(keyword) !== -1;
                card.style.display = matched ? '' : 'none';
                if (matched) {
                    visible += 1;
                }
            });
            if (empty) {
                empty.classList.toggle('active', visible === 0);
            }
        }

        if (initial) {
            input.value = initial;
        }
        input.addEventListener('input', apply);
        apply();
    }

    function initPlayer() {
        var holder = document.querySelector('[data-stream]');
        if (!holder) {
            return;
        }
        var video = holder.querySelector('video');
        var overlay = holder.querySelector('.play-overlay');
        var stream = holder.getAttribute('data-stream');
        var loaded = false;
        var hlsPlayer = null;

        function loadStream() {
            if (loaded || !video || !stream) {
                return;
            }
            loaded = true;
            if (window.Hls && window.Hls.isSupported()) {
                hlsPlayer = new window.Hls({ enableWorker: true, lowLatencyMode: true });
                hlsPlayer.loadSource(stream);
                hlsPlayer.attachMedia(video);
            } else {
                video.src = stream;
                video.load();
            }
        }

        function playVideo() {
            loadStream();
            if (overlay) {
                overlay.classList.add('is-hidden');
            }
            var playing = video.play();
            if (playing && typeof playing.catch === 'function') {
                playing.catch(function () {});
            }
        }

        if (overlay) {
            overlay.addEventListener('click', function (event) {
                event.preventDefault();
                playVideo();
            });
        }
        if (video) {
            video.addEventListener('play', function () {
                if (overlay) {
                    overlay.classList.add('is-hidden');
                }
            });
            video.addEventListener('pause', function () {
                if (overlay && video.currentTime === 0) {
                    overlay.classList.remove('is-hidden');
                }
            });
            video.addEventListener('emptied', function () {
                if (hlsPlayer && typeof hlsPlayer.destroy === 'function') {
                    hlsPlayer.destroy();
                }
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        initMenu();
        initHero();
        initRows();
        initSearch();
        initPlayer();
    });
})();
