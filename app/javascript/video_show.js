document.addEventListener("DOMContentLoaded", () => {

  let ytPlayer;
  const clipForm = document.getElementById("clip-form");
  const clipList = document.getElementById("clip-list");
  const videoId = clipForm?.dataset.videoId;
  let loopTimer = null;
  let activeClip = null;
  const loopEnabledByClipId = new Set();
  const favoriteButton = document.getElementById("favorite-toggle");

  window.onYouTubeIframeAPIReady = function () {
    const playerEl = document.getElementById("player");
    if (!playerEl) {
      return;
    } 
    ytPlayer = new YT.Player("player", {
      events: {
        "onReady": onPlayerReady
      }
    });
  };

  if (!window.YT?.Player) {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  }

  function onPlayerReady() {
    document.getElementById("set-start-time")?.addEventListener("click", () => {
      const startTime = ytPlayer.getCurrentTime();
      const startTimeToHms = secondsToHms(startTime);
      document.getElementById("clip_start_time").value = startTimeToHms;
    });

    document.getElementById("set-end-time")?.addEventListener("click", () => {
      const endTime = ytPlayer.getCurrentTime();
      const endTimeToHms = secondsToHms(endTime);
      document.getElementById("clip_end_time").value = endTimeToHms;
    });
  }

  function secondsToHms(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const hStr = h.toString().padStart(2, '0');
    const mStr = m.toString().padStart(2, '0');
    const sStr = s.toFixed(2).padStart(5, '0');

    if (h === 0) {
      return `${mStr}:${sStr}`;
    }
    return `${hStr}:${mStr}:${sStr}`;
  }

  function hmsToSeconds(hms) {
    const parts = hms.split(":").map(parseFloat);
    let seconds = 0;
  
    if (parts.length === 3) {
      const [h, m, s] = parts;
      seconds = h * 3600 + m * 60 + s;
    } else if (parts.length === 2) {
      const [m, s] = parts;
      seconds = m * 60 + s;
    }
    
    return seconds;
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    const startTimeValue = clipForm.elements["clip[start_time]"].value;
    const endTimeValue = clipForm.elements["clip[end_time]"].value;
    const titleValue = clipForm.elements["clip[title]"].value;
    const startTimeToSeconds = hmsToSeconds(startTimeValue);
    const endTimeToSeconds = hmsToSeconds(endTimeValue);
    let formData = new FormData();
    formData.set("clip[start_time]", startTimeToSeconds);
    formData.set("clip[end_time]", endTimeToSeconds);
    formData.set("clip[title]", titleValue);
    saveClip(formData);
  }

  function saveClip(formData) {
    fetch(clipForm.action, {
      method: "POST",
      body: formData,
      headers: {
        "X-CSRF-Token": getCsrfToken(),
        "X-Requested-With": "XMLHttpRequest"
      }
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(errData => {
          displayErrors(errData.errors);
          throw new Error(`HTTPエラー！ステータス: ${response.status}`);
        });
      }
      return response.json();
    })
    .then(data => {
      document.getElementById("clip-errors").innerHTML = "";
      addClipToUI(data);
      resetForm();
    })
    .catch(() => {
      clipForm.querySelector("input[type='submit']").disabled = false;
    });
  }

  function displayErrors(errors) {
    const errorDiv = document.getElementById("clip-errors");
    errorDiv.innerHTML = "";
    errors.forEach(message => {
      errorDiv.innerHTML += `<p>${message}</p>`;
    });
  }

  function addClipToUI(data) {
    const title = data.title;
    const start = Number(data.start_time);
    const end   = Number(data.end_time);
    const newClip = document.createElement("div");
    newClip.dataset.clipId = data.id;
    newClip.innerHTML = `
    <p>${title}</p>
    <p>
      Start:
      <span class="play-clip start-clip" data-start="${start}" data-end="${end}">
        ${secondsToHms(start)}
      </span>
    </p>
    <p>
      End:
      <span class="play-clip" data-start="${start}" data-end="${end}">
        ${secondsToHms(end)}
      </span>
    </p>
    <div>
      <button class="play-clip start-clip" data-start="${start}" data-end="${end}" type="button">再生</button>
      <button class="delete-clip">削除</button>
      <button class="edit-clip">編集</button>
      <button class="loop-btn" type="button">ループ</button>
    </div>
    `;
    clipList.appendChild(newClip);
  }

  function resetForm() {
    clipForm.reset();
    //Rails UJS による submit ボタンの無効化を解除
    clipForm.querySelector("input[type='submit']").disabled = false;
  }  

  function handleClipDelete(e) {
    //特定の要素をクリックした場合のみ処理を実行
    if (!e.target.classList.contains("delete-clip")) return;

    const clipElement = e.target.closest("[data-clip-id]");
    const clipId = clipElement.dataset.clipId;

    deleteClip(clipId, clipElement);
  }

  function deleteClip(clipId, clipElement) {
    fetch(`/videos/${videoId}/clips/${clipId}`, {
      method: "DELETE",
      headers: {
        "X-CSRF-Token": getCsrfToken(),
      }
    })
    .then(response => {
      if (!response.ok) throw new Error(`HTTPエラー！ステータス: ${response.status}`);
      loopEnabledByClipId.delete(clipId);
      if (activeClip?.clipId === clipId) {
        stopLoopWatcher();
        activeClip = null;
      }
      clipElement.remove();
    })
    .catch(error => console.error("❌ クリップ削除エラー:", error));
  }

  function handleClipPlay(e) {
    if (!e.target.classList.contains("play-clip")) return;

    const start = parseFloat(e.target.dataset.start);
    const end = parseFloat(e.target.dataset.end);
    //ブラウザの自動再生ポリシーにより、ユーザーが最初に動画プレイヤーをクリックする必要がある
    stopLoopWatcher();
    const clipEl = e.target.closest("[data-clip-id]");
    const clipId = clipEl?.dataset.clipId;
    activeClip = { start, end, clipId };
    if (e.target.classList.contains("start-clip")) {
      ytPlayer.seekTo(start, true);
      ytPlayer.playVideo();
    } else {
      ytPlayer.seekTo(end, true);
      ytPlayer.playVideo();
    }

    if (clipId && loopEnabledByClipId.has(clipId)) {
      startLoopWatcher();
    }

    //クリップ再生終了時の処理、選択できるようになった際に有効化
    /*
    const interval = setInterval(() => {
      if (ytPlayer.getCurrentTime() >= end) {
        ytPlayer.pauseVideo();
        clearInterval(interval);
        console.log("⏹ Clip playback finished");
      }
    }, 500);
    */
  }

  function handleLoopClip(e) {
    const btn = e.target.closest(".loop-btn");
    if (!btn) return;

    const clipId = btn.closest("[data-clip-id]")?.dataset.clipId;
    const willEnable = !loopEnabledByClipId.has(clipId);

    if (willEnable) {
      loopEnabledByClipId.add(clipId);
      btn.textContent = "ループ解除";
      btn.classList.add("is-looping");
      if (activeClip?.clipId === clipId) startLoopWatcher();
    } else {
      loopEnabledByClipId.delete(clipId);
      btn.textContent = "ループ";
      btn.classList.remove("is-looping");
      if (activeClip?.clipId === clipId) {
        stopLoopWatcher();
        activeClip = null;
      }
    }
  }

  function startLoopWatcher() {
    stopLoopWatcher();
    if (!activeClip) return;
    if (!loopEnabledByClipId.has(activeClip.clipId)) return;
    loopTimer = setInterval(() => {
      const state = ytPlayer?.getPlayerState?.();
      if (state !== YT.PlayerState.PLAYING) return;
      const t = ytPlayer.getCurrentTime();
      if (t >= activeClip.end) {
        ytPlayer.seekTo(activeClip.start, true);
        ytPlayer.playVideo();
      }
    }, 200);
  }

  function stopLoopWatcher() {
    if (loopTimer) { clearInterval(loopTimer); loopTimer = null; }
  }

  function toggleFavoriteButton() {
    if (favoriteButton.classList.contains("favorited")) {
      unfavoriteVideo(videoId);
    } else {
      favoriteVideo(videoId);
    }
  }

  function favoriteVideo(videoId) {
    fetch(`/videos/${videoId}/video_favorite`, {
      method: "POST",
      headers: {
        "X-CSRF-Token": getCsrfToken(),
      },
    })
    .then(response => response.json())
    .then(data => {
      if (data.id) {
        favoriteButton.textContent = "お気に入り解除";
        favoriteButton.classList.add("favorited");
        }
      })
    .catch(error => console.error("エラー:", error));
  }

  function unfavoriteVideo(videoId) {
    fetch(`/videos/${videoId}/video_favorite`, {
      method: "DELETE",
      headers: {
        "X-CSRF-Token": getCsrfToken(),
      },
    })
    .then(response => response.json())
    .then(data => {
      if (data.message) {
        favoriteButton.textContent = "お気に入り登録";
        favoriteButton.classList.remove("favorited");
      }
    })
    .catch(error => console.error("エラー:", error));
  }

  function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.content || "";
  }

  clipForm?.addEventListener("submit", handleFormSubmit);
  clipList?.addEventListener("click", handleClipDelete);
  clipList?.addEventListener("click", handleClipPlay);
  clipList?.addEventListener("click", handleLoopClip);
  favoriteButton?.addEventListener("click", toggleFavoriteButton);
});
