(function () {
    window.initMoviePlayer = function (elementId, streamUrl) {
        const shell = document.getElementById(elementId);

        if (!shell) {
            return;
        }

        const video = shell.querySelector("video");
        const cover = shell.querySelector(".player-cover");
        let hls = null;
        let loaded = false;

        const start = () => {
            shell.classList.add("is-playing");
            video.setAttribute("controls", "controls");

            if (!loaded) {
                loaded = true;

                if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = streamUrl;
                    video.play().catch(() => {});
                } else if (window.Hls && window.Hls.isSupported()) {
                    hls = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hls.loadSource(streamUrl);
                    hls.attachMedia(video);
                    hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
                        video.play().catch(() => {});
                    });
                } else {
                    video.src = streamUrl;
                    video.play().catch(() => {});
                }
            } else {
                video.play().catch(() => {});
            }
        };

        if (cover) {
            cover.addEventListener("click", start);
        }

        video.addEventListener("click", () => {
            if (video.paused) {
                start();
            }
        });

        window.addEventListener("pagehide", () => {
            if (hls) {
                hls.destroy();
                hls = null;
            }
        });
    };
}());
