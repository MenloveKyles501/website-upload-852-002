document.addEventListener('DOMContentLoaded', function () {
    var toggle = document.querySelector('[data-nav-toggle]');
    var menu = document.querySelector('[data-nav-menu]');

    if (toggle && menu) {
        toggle.addEventListener('click', function () {
            menu.classList.toggle('open');
        });
    }

    var hero = document.querySelector('[data-hero]');
    if (hero) {
        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        var current = 0;

        var showSlide = function (index) {
            current = index % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('active', dotIndex === current);
            });
        };

        dots.forEach(function (dot, index) {
            dot.addEventListener('click', function () {
                showSlide(index);
            });
        });

        if (slides.length > 1) {
            window.setInterval(function () {
                showSlide(current + 1);
            }, 5200);
        }
    }

    var globalSearch = document.querySelector('[data-global-search]');
    if (globalSearch) {
        var globalForm = globalSearch.closest('form');
        if (globalForm) {
            globalForm.addEventListener('submit', function (event) {
                event.preventDefault();
                var value = globalSearch.value.trim();
                var target = value ? 'search.html?q=' + encodeURIComponent(value) : 'search.html';
                window.location.href = target;
            });
        }
    }

    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
    var localSearch = document.querySelector('[data-local-search]');
    var sortSelect = document.querySelector('[data-sort-select]');
    var emptyState = document.querySelector('[data-empty-state]');

    var applyFilter = function () {
        if (!cards.length) {
            return;
        }

        var keyword = localSearch ? localSearch.value.trim().toLowerCase() : '';
        var visibleCount = 0;

        cards.forEach(function (card) {
            var text = [
                card.getAttribute('data-title') || '',
                card.getAttribute('data-year') || '',
                card.getAttribute('data-region') || '',
                card.getAttribute('data-type') || '',
                card.getAttribute('data-category') || '',
                card.textContent || ''
            ].join(' ').toLowerCase();

            var matched = keyword === '' || text.indexOf(keyword) !== -1;
            card.style.display = matched ? '' : 'none';
            if (matched) {
                visibleCount += 1;
            }
        });

        if (emptyState) {
            emptyState.classList.toggle('show', visibleCount === 0);
        }
    };

    var applySort = function () {
        if (!cards.length || !sortSelect) {
            return;
        }

        var grid = cards[0].parentElement;
        var mode = sortSelect.value;
        var sorted = cards.slice().sort(function (a, b) {
            if (mode === 'year-desc') {
                return parseInt(b.getAttribute('data-year'), 10) - parseInt(a.getAttribute('data-year'), 10);
            }
            if (mode === 'year-asc') {
                return parseInt(a.getAttribute('data-year'), 10) - parseInt(b.getAttribute('data-year'), 10);
            }
            return (a.getAttribute('data-title') || '').localeCompare(b.getAttribute('data-title') || '', 'zh-Hans-CN');
        });

        sorted.forEach(function (card) {
            grid.appendChild(card);
        });
    };

    if (localSearch) {
        var params = new URLSearchParams(window.location.search);
        var query = params.get('q');
        if (query) {
            localSearch.value = query;
        }
        localSearch.addEventListener('input', applyFilter);
        applyFilter();
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            applySort();
            applyFilter();
        });
    }
});
