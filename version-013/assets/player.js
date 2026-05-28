(function () {
  function startPlayback() {
    var video = document.getElementById("movie-video");
    var cover = document.getElementById("player-cover");
    var url = typeof activeVideoSource !== "undefined" ? activeVideoSource : "";
    if (!video || !url) {
      return;
    }
    if (!video.getAttribute("data-ready")) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
      } else if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
          maxBufferLength: 30,
          enableWorker: true
        });
        hls.loadSource(url);
        hls.attachMedia(video);
        video.hlsPlayer = hls;
      } else {
        video.src = url;
      }
      video.setAttribute("data-ready", "true");
    }
    if (cover) {
      cover.classList.add("is-hidden");
    }
    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {});
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var video = document.getElementById("movie-video");
    var cover = document.getElementById("player-cover");
    if (cover) {
      cover.addEventListener("click", startPlayback);
    }
    if (video) {
      video.addEventListener("click", function () {
        if (video.paused) {
          startPlayback();
        }
      });
      video.addEventListener("play", function () {
        if (cover) {
          cover.classList.add("is-hidden");
        }
      });
    }
  });
})();
