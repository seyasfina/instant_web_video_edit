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
    const end = Number(data.end_time);
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
    <form class="clip-edit-form" hidden>
      <div>
        <label>タイトル</label>
        <input name="clip[title]" value="">
      </div>
      <div>
        <label>開始</label>
        <input name="clip[start_time]" value="" />
        <button type="button" class="use-current-start">▶ 今の位置を開始</button>
      </div>
      <div>
        <label>終了</label>
        <input name="clip[end_time]" value="" />
        <button type="button" class="use-current-end">▶ 今の位置を終了</button>
      </div>

      <div class="errors" aria-live="polite"></div>

      <div class="row">
        <button type="submit">保存</button>
        <button type="button" class="cancel-edit">キャンセル</button>
      </div>
    </form>
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
    startLoopWatcher();
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
      if (activeClip?.clipId === clipId) startLoopWatcher();
    }
  }

  function startLoopWatcher() {
    stopLoopWatcher();
    if (!activeClip) return;
    loopTimer = setInterval(() => {
      const state = ytPlayer?.getPlayerState?.();
      if (state !== YT.PlayerState.PLAYING) return;
      const t = ytPlayer.getCurrentTime();
      if (t >= activeClip.end) {
        const loopon = loopEnabledByClipId.has(activeClip.clipId);
        const autoStop = document.getElementById("stop-after-clip")?.checked;
        if (loopon) {
          ytPlayer.seekTo(activeClip.start, true);
          ytPlayer.playVideo();
        } else if (autoStop) {
          ytPlayer.pauseVideo();
          stopLoopWatcher();
        } else {
          stopLoopWatcher();
        }
      }
    }, 200);
  }

  function stopLoopWatcher() {
    if (loopTimer) { clearInterval(loopTimer); loopTimer = null; }
  }

  function closeAllEditForms() {
    clipList.querySelectorAll(".clip-edit-form").forEach(form => form.hidden = true);
  }

  function handleEditClick(e) {
    const editButton = e.target.closest(".edit-clip");
    if (!editButton) return;

    const row = editButton.closest("[data-clip-id]");
    const form = row.querySelector(".clip-edit-form");
    const isOpen = !form.hidden;

    closeAllEditForms();
    form.hidden = isOpen;

    if (!isOpen) {
      const startTime = row.querySelector(".play-clip").dataset.start;
      const endTime = row.querySelector(".play-clip").dataset.end;
      form.elements["clip[start_time]"].value = secondsToHms(startTime);
      form.elements["clip[end_time]"].value = secondsToHms(endTime);
      form.elements["clip[title]"].value = row.querySelector(".clip-title")?.textContent || "";
    }
  }

  function handleCancelEdit(e) {
    const cancelBtn = e.target.closest(".cancel-edit");
    if (!cancelBtn) return;

    const form = cancelBtn.closest(".clip-edit-form");
    form.hidden = true;
  }

  function handleUseCurrent(e) {
    const btnStart = e.target.closest(".use-current-start");
    const btnEnd = e.target.closest(".use-current-end");
    if (!btnStart && !btnEnd) return;

    const form = e.target.closest(".clip-edit-form");
    const nowHms = secondsToHms(ytPlayer.getCurrentTime());

    if (btnStart) {
      form.querySelector('input[name="clip[start_time]"]').value = nowHms;
    }
    if (btnEnd) {
      form.querySelector('input[name="clip[end_time]"]').value = nowHms;
    }
  }

  async function handleEditSubmit(e) {
    const form = e.target.closest(".clip-edit-form");
    if (!form) return;
    e.preventDefault();

    const row = form.closest("[data-clip-id]");
    const clipId = row.dataset.clipId;

    const title = form.querySelector('input[name="clip[title]"]').value.trim();
    const startHms = form.querySelector('input[name="clip[start_time]"]').value.trim();
    const endHms = form.querySelector('input[name="clip[end_time]"]').value.trim();

    const startSec = hmsToSeconds(startHms);
    const endSec = hmsToSeconds(endHms);

    const errs = [];
    if (Number.isNaN(startSec) || Number.isNaN(endSec)) errs.push("時刻の形式が不正です（mm:ss または hh:mm:ss）");
    if (startSec >= endSec) errs.push("終了は開始より後である必要があります");

    const errBox = form.querySelector(".errors");
    errBox.innerHTML = errs.map(m => `<p>${m}</p>`).join("");
    if (errs.length) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      const res = await fetch(`/videos/${videoId}/clips/${clipId}`, {
        method: "PATCH",
        headers: {
          "X-CSRF-Token": getCsrfToken(),
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify({ clip: { title, start_time: startSec, end_time: endSec } })
      });

      const data = await res.json();

      if (!res.ok) {
        errBox.innerHTML = (data.errors || ["更新に失敗しました"]).map(m => `<p>${m}</p>`).join("");
        return;
      }

      row.querySelector(".clip-title").textContent = data.title || "";
      const spans = row.querySelectorAll(".play-clip");
      spans.forEach(sp => {
        sp.dataset.start = data.start_time;
        sp.dataset.end = data.end_time;
      });

      const startTextEl = row.querySelector("span.play-clip.start-clip");
      const endTextEl = row.querySelector("span.play-clip:not(.start-clip)");
      if (startTextEl) startTextEl.textContent = secondsToHms(Number(data.start_time));
      if (endTextEl) endTextEl.textContent = secondsToHms(Number(data.end_time));

      if (activeClip?.clipId === clipId) {
        activeClip.start = Number(data.start_time);
        activeClip.end = Number(data.end_time);
        startLoopWatcher();
      }

      errBox.innerHTML = "";
      form.hidden = true;
    } catch (err) {
      errBox.innerHTML = `<p>通信に失敗しました</p>`;
    } finally {
      submitBtn.disabled = false;
    }
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
  clipList?.addEventListener("click", handleEditClick);
  clipList?.addEventListener("click", handleCancelEdit);
  clipList?.addEventListener("click", handleUseCurrent);
  clipList?.addEventListener("submit", handleEditSubmit);
  favoriteButton?.addEventListener("click", toggleFavoriteButton);
});
