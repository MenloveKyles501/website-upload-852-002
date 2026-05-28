document.addEventListener('DOMContentLoaded', function () {
    var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));

    players.forEach(function (wrap) {
        var video = wrap.querySelector('video');
        var cover = wrap.querySelector('.play-cover');
        var mediaUrl = wrap.getAttribute('data-src');
        var ready = false;
        var hlsInstance = null;

        if (!video || !mediaUrl) {
            return;
        }

        var start = function () {
            if (!ready) {
                ready = true;
                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = mediaUrl;
                    video.play().catch(function () {});
                } else if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true,
                        backBufferLength: 90
                    });
                    hlsInstance.loadSource(mediaUrl);
                    hlsInstance.attachMedia(video);
                    hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        video.play().catch(function () {});
                    });
                } else {
                    video.src = mediaUrl;
                    video.play().catch(function () {});
                }
            } else {
                video.play().catch(function () {});
            }

            if (cover) {
                cover.classList.add('is-hidden');
            }
        };

        if (cover) {
            cover.addEventListener('click', start);
        }

        video.addEventListener('click', function () {
            if (!ready) {
                start();
            }
        });

        window.addEventListener('beforeunload', function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    });
});
