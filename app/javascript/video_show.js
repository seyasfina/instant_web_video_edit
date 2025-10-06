import Sortable from "sortablejs"

document.addEventListener("DOMContentLoaded", () => {
  let ytPlayer;
  const clipForm = document.getElementById("clip-form");
  const clipList = document.getElementById("clip-list");
  const clipCountBadge = document.getElementById("clip-count");
  const videoId = clipForm?.dataset.videoId;
  let loopTimer = null;
  let activeClip = null;
  const loopEnabledByClipId = new Set();
  const favoriteButton = document.getElementById("favorite-toggle");

  if (document.body.classList.contains('logged-in') && videoId) {
    checkForLocalClipsAndShowDialog();
  } else {
    loadLocalClips();
  }

  function updateClipCount() {
    if (!clipList || !clipCountBadge) return;
    const count = clipList.querySelectorAll('.clip-item').length;
    clipCountBadge.textContent = `${count} 件`;
  }

  function collectLocalClipsBuckets() {
    const PREFIX = "clips_";
    const buckets = new Map();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(PREFIX)) continue;

      const videoId = key.slice(PREFIX.length);
      let arr;
      try {
        arr = JSON.parse(localStorage.getItem(key) || "[]");
      } catch {
        arr = [];
      }
      if (!Array.isArray(arr)) arr = [];

      const seen = new Set();
      const deduped = arr.filter(c => {
        if (seen.has(c.local_id)) return false;
        seen.add(c.local_id);
        return true;
      });

      buckets.set(videoId, deduped);
    }

    return buckets;
  }

  function summarizeBuckets(buckets) {
    const perVideo = [];
    let total = 0;
    for (const [videoId, clips] of buckets.entries()) {
      perVideo.push({ videoId, count: clips.length });
      total += clips.length;
    }
    perVideo.sort((a, b) => Number(a.videoId) - Number(b.videoId));
    return { total, perVideo };
  }

  function rewriteBuckets(buckets) {
    for (const [videoId, clips] of buckets.entries()) {
      localStorage.setItem(`clips_${videoId}`, JSON.stringify(clips));
    }
  }

  function clearBuckets(buckets) {
    for (const videoId of buckets.keys()) {
      localStorage.removeItem(`clips_${videoId}`);
    }
  }

  function checkForLocalClipsAndShowDialog() {
    const buckets = collectLocalClipsBuckets();
    const { total, perVideo } = summarizeBuckets(buckets);
    if (total <= 0) return;

    const currentClips = buckets.get(videoId) || [];

    const syncCurrent = async () => {
      if (currentClips.length > 0) {
        await syncClipsToServer(videoId, currentClips);
        localStorage.removeItem(`clips_${videoId}`);
      }
    };

    const syncAll = async () => {
      for (const [vid, clips] of buckets.entries()) {
        if (Array.isArray(clips) && clips.length > 0) {
          await syncClipsToServer(vid, clips);
        }
        localStorage.removeItem(`clips_${vid}`);
      }
    };

    const cancel = () => {
      rewriteBuckets(buckets);
    };

    showSyncConfirmDialog(total, perVideo, {
      onSyncCurrent: syncCurrent,
      onSyncAll: syncAll,
      onCancel: cancel
    });
  }

  function showSyncConfirmDialog(clipCount, perVideo, { onSyncCurrent, onSyncAll, onCancel }) {
    const dialog = document.createElement('div');
    dialog.className = 'sync-dialog';
    dialog.innerHTML = `
      <div class="sync-dialog-content">
        <h3>クリップの同期</h3>
        <p>ログイン前に作成した ${clipCount} 個のクリップが見つかりました。</p>
        <ul>
          ${perVideo.map(v => `<li>Video ${v.videoId}: ${v.count}件</li>`).join("")}
        </ul>
        <p>どの範囲を同期しますか？</p>
        <div class="sync-dialog-buttons">
          <button class="sync-current">この動画だけ同期</button>
          <button class="sync-all">全動画を同期</button>
          <button class="sync-cancel">今はしない</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);

    dialog.querySelector('.sync-current').addEventListener('click', () => {
      dialog.remove();
      onSyncCurrent?.();
    });
    dialog.querySelector('.sync-all').addEventListener('click', () => {
      dialog.remove();
      onSyncAll?.();
    });
    dialog.querySelector('.sync-cancel').addEventListener('click', () => {
      dialog.remove();
      onCancel?.();
    });
  }

  function syncClipsToServer(videoId, clips) {
    if (!Array.isArray(clips) || clips.length === 0) return Promise.resolve();
    return fetch(`/videos/${videoId}/clips/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfToken()
      },
      body: JSON.stringify({
       clips: clips.map(c => ({
         video_id: videoId,
         local_id: String(c.local_id),
         title: c.title ?? "",
         start_time: Number(c.start_time),
         end_time: Number(c.end_time),
       }))
     })
    })
    .then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || data?.message || '同期に失敗しました');
      return data;
    })
    .then(data => {
      showNotification(data.message || 'クリップを同期しました', 'success');
      if (clipList) {
        clipList.querySelectorAll('[data-local-clip-id]').forEach(el => el.remove());
      }
      data.synced_clips?.forEach(clip => {
        if (String(clip.video_id) === clipForm?.dataset.videoId)
          addClipToUI(clip);
        });
      return data;
    })
    .catch(error => {
      showNotification('同期中にエラーが発生しました。', 'error');
      throw error;
    });
  }

  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notification.style.opacity = '1';
    notification.style.transition = 'opacity 0.5s ease';
    
    document.querySelector('.video-container').insertAdjacentElement('afterbegin', notification);
    
    const fadeOutTimer = setTimeout(() => {
      notification.style.opacity = '0';
      
      const removeTimer = setTimeout(() => {
        notification.remove();
      }, 500);
      
      notification.dataset.removeTimer = removeTimer;
    }, 4500);
    
    notification.dataset.fadeOutTimer = fadeOutTimer;
  }

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
      const startTimeInput = document.getElementById("clip_start_time");
      if (startTimeInput) {
        startTimeInput.value = startTimeToHms;
      }
    });

    const endTimeBtn = document.getElementById("set-end-time");
    if (endTimeBtn) {
      endTimeBtn.addEventListener("click", () => {
        const endTime = ytPlayer.getCurrentTime();
        const endTimeToHms = secondsToHms(endTime);
        const endTimeInput = clipForm?.elements["clip[end_time]"];
        if (endTimeInput) {
          endTimeInput.value = endTimeToHms;
        }
      });
    }
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

    const clipData = {
      start_time: startTimeToSeconds,
      end_time: endTimeToSeconds,
      title: titleValue,
      video_id: videoId,
      created_at: new Date().toISOString()
    };

    if (isLoggedIn()) {
      let formData = new FormData();
      formData.set("clip[start_time]", startTimeToSeconds);
      formData.set("clip[end_time]", endTimeToSeconds);
      formData.set("clip[title]", titleValue);
      saveClip(formData);
    } else {
      // Rails UJSの処理が終わった後に実行するため、setTimeoutを使用
      setTimeout(() => {
        saveClipToLocalStorage(clipData);
        renderLocalClip(clipData);
        resetForm();
      }, 50);
    }
  }

  function isLoggedIn() {
    return document.body.classList.contains('logged-in');
  }

  function saveClipToLocalStorage(clipData) {
    const storageKey = `clips_${videoId}`;
    let clips = JSON.parse(localStorage.getItem(storageKey) || '[]');
    clipData.local_id = clips.length > 0 ? (Math.max(...clips.map(c => parseInt(c.local_id))) + 1) : 1;
    clipData.position = String(clips.length);
    clips.push(clipData);
    localStorage.setItem(storageKey, JSON.stringify(clips));
  }

  function renderLocalClip(clipData) {
    const clipElement = document.createElement('article');
    clipElement.className = 'clip-item group rounded-2xl border border-base-200 bg-base-100 p-4 shadow-sm transition hover:border-primary/60 hover:shadow-md local';
    clipElement.dataset.localClipId = clipData.local_id;

    const title = clipData.title || '';
    const start = Number(clipData.start_time);
    const end = Number(clipData.end_time);

    clipElement.innerHTML = `
      <div class="flex flex-col gap-3 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-3">
        <div class="flex min-w-0 flex-col gap-2">
          <p class="clip-title break-words text-base font-semibold text-base-content" data-clip-title="${title}">${title}</p>
          <dl class="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-sm text-base-content/70 sm:grid-cols-[auto_minmax(0,1fr)]">
            <dt class="font-medium text-base-content">開始</dt>
            <dd class="min-w-0">
              <span class="play-clip start-clip inline-flex items-center justify-center rounded-lg bg-base-200 px-3 py-1 font-mono text-sm tracking-tight text-base-content w-full sm:w-auto" data-start="${start}" data-end="${end}">
                <span class="tabular-nums">${secondsToHms(start)}</span>
              </span>
            </dd>
            <dt class="font-medium text-base-content">終了</dt>
            <dd class="min-w-0">
              <span class="play-clip inline-flex items-center justify-center rounded-lg bg-base-200 px-3 py-1 font-mono text-sm tracking-tight text-base-content w-full sm:w-auto" data-start="${start}" data-end="${end}">
                <span class="tabular-nums">${secondsToHms(end)}</span>
              </span>
            </dd>
          </dl>
        </div>
        <div class="drag-handle group/handle flex cursor-grab select-none items-center justify-end rounded-xl px-3 py-2 text-sm font-medium text-base-content/70 transition hover:bg-base-200 active:cursor-grabbing sm:h-full sm:min-h-[3.5rem]" role="button" tabindex="0" aria-label="ドラッグで並べ替え">
          <span class="hidden text-xs uppercase tracking-wide text-base-content/50 sm:inline">ドラッグ</span>
          <span aria-hidden="true" class="ml-2 text-base">⋮⋮</span>
        </div>
      </div>

      <div class="mt-3 grid gap-2 sm:grid-cols-2">
        <button class="play-clip start-clip btn btn-sm btn-primary w-full sm:w-auto" data-start="${start}" data-end="${end}" type="button">再生</button>
        <button class="loop-btn btn btn-sm btn-outline w-full sm:w-auto" type="button">ループ</button>
        <button class="edit-clip btn btn-sm btn-outline w-full sm:w-auto" type="button">編集</button>
        <button class="delete-clip btn btn-sm btn-outline btn-error w-full sm:w-auto" type="button">削除</button>
      </div>

      <form class="clip-edit-form mt-4 space-y-5 rounded-xl border border-base-200 bg-base-100 p-4 sm:p-5" hidden>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-semibold text-base-content">タイトル</label>
          <input name="clip[title]" value="" class="input input-bordered w-full" />
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-semibold text-base-content">開始</label>
            <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-3">
              <input name="clip[start_time]" value="" class="input input-bordered w-full" />
              <button type="button" class="btn btn-outline btn-sm h-10 min-h-0 use-current-start w-full sm:w-auto">▶ 今の位置</button>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-semibold text-base-content">終了</label>
            <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-3">
              <input name="clip[end_time]" value="" class="input input-bordered w-full" />
              <button type="button" class="btn btn-outline btn-sm h-10 min-h-0 use-current-end w-full sm:w-auto">▶ 今の位置</button>
            </div>
          </div>
        </div>

        <div class="errors space-y-1 text-sm text-error" aria-live="polite"></div>

        <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <button type="submit" class="btn btn-primary btn-sm w-full sm:w-auto">保存</button>
          <button type="button" class="cancel-edit btn btn-ghost btn-sm w-full sm:w-auto">キャンセル</button>
        </div>
      </form>
    `;

    clipList.appendChild(clipElement);
    updateClipCount();
  }

  function deleteLocalClip(localId, videoId) {
    const storageKey = `clips_${videoId}`;
    let clips = JSON.parse(localStorage.getItem(storageKey) || '[]');
    clips = clips.filter(clip => String(clip.local_id) !== localId);
    localStorage.setItem(storageKey, JSON.stringify(clips));
  }

  function loadLocalClips() {
    if (!isLoggedIn()) {
      const storageKey = `clips_${videoId}`;
      const clips = JSON.parse(localStorage.getItem(storageKey) || '[]');
      clips.sort((a, b) => a.position - b.position).forEach(clipData => renderLocalClip(clipData));
    }
    updateClipCount();
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
    const title = data.title || '';
    const start = Number(data.start_time);
    const end = Number(data.end_time);
    const newClip = document.createElement("article");
    newClip.className = 'clip-item group rounded-2xl border border-base-200 bg-base-100 p-4 shadow-sm transition hover:border-primary/60 hover:shadow-md';
    newClip.dataset.clipId = data.id;
    newClip.innerHTML = `
      <div class="flex flex-col gap-3 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-3">
        <div class="flex min-w-0 flex-col gap-2">
          <p class="clip-title break-words text-base font-semibold text-base-content" data-clip-title="${title}">${title}</p>
          <dl class="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-sm text-base-content/70 sm:grid-cols-[auto_minmax(0,1fr)]">
            <dt class="font-medium text-base-content">開始</dt>
            <dd class="min-w-0">
              <span class="play-clip start-clip inline-flex items-center justify-center rounded-lg bg-base-200 px-3 py-1 font-mono text-sm tracking-tight text-base-content w-full sm:w-auto" data-start="${start}" data-end="${end}">
                <span class="tabular-nums">${secondsToHms(start)}</span>
              </span>
            </dd>
            <dt class="font-medium text-base-content">終了</dt>
            <dd class="min-w-0">
              <span class="play-clip inline-flex items-center justify-center rounded-lg bg-base-200 px-3 py-1 font-mono text-sm tracking-tight text-base-content w-full sm:w-auto" data-start="${start}" data-end="${end}">
                <span class="tabular-nums">${secondsToHms(end)}</span>
              </span>
            </dd>
          </dl>
        </div>
        <div class="drag-handle group/handle flex cursor-grab select-none items-center justify-end rounded-xl px-3 py-2 text-sm font-medium text-base-content/70 transition hover:bg-base-200 active:cursor-grabbing sm:h-full sm:min-h-[3.5rem]" role="button" tabindex="0" aria-label="ドラッグで並べ替え">
          <span class="hidden text-xs uppercase tracking-wide text-base-content/50 sm:inline">ドラッグ</span>
          <span aria-hidden="true" class="ml-2 text-base">⋮⋮</span>
        </div>
      </div>

      <div class="mt-3 grid gap-2 sm:grid-cols-2">
        <button class="play-clip start-clip btn btn-sm btn-primary w-full sm:w-auto" data-start="${start}" data-end="${end}" type="button">再生</button>
        <button class="loop-btn btn btn-sm btn-outline w-full sm:w-auto" type="button">ループ</button>
        <button class="edit-clip btn btn-sm btn-outline w-full sm:w-auto" type="button">編集</button>
        <button class="delete-clip btn btn-sm btn-outline btn-error w-full sm:w-auto" type="button">削除</button>
      </div>

      <form class="clip-edit-form mt-4 space-y-5 rounded-xl border border-base-200 bg-base-100 p-4 sm:p-5" hidden>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-semibold text-base-content">タイトル</label>
          <input name="clip[title]" value="" class="input input-bordered w-full" />
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-semibold text-base-content">開始</label>
            <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-3">
              <input name="clip[start_time]" value="" class="input input-bordered w-full" />
              <button type="button" class="btn btn-outline btn-sm h-10 min-h-0 use-current-start w-full sm:w-auto">▶ 今の位置</button>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-semibold text-base-content">終了</label>
            <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-3">
              <input name="clip[end_time]" value="" class="input input-bordered w-full" />
              <button type="button" class="btn btn-outline btn-sm h-10 min-h-0 use-current-end w-full sm:w-auto">▶ 今の位置</button>
            </div>
          </div>
        </div>

        <div class="errors space-y-1 text-sm text-error" aria-live="polite"></div>

        <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <button type="submit" class="btn btn-primary btn-sm w-full sm:w-auto">保存</button>
          <button type="button" class="cancel-edit btn btn-ghost btn-sm w-full sm:w-auto">キャンセル</button>
        </div>
      </form>
    `;
    clipList.appendChild(newClip);
    updateClipCount();
  }

  function resetForm() {
    clipForm.reset();
    //Rails UJS による submit ボタンの無効化を解除
    clipForm.querySelector("input[type='submit']").disabled = false;
  }

  function handleClipDelete(e) {
    //特定の要素をクリックした場合のみ処理を実行
    if (!e.target.classList.contains("delete-clip")) return;

    const clipElement = e.target.closest("[data-clip-id]") || e.target.closest("[data-local-clip-id]");
    const clipId = clipElement.dataset.clipId || clipElement.dataset.localClipId;

    if (isLoggedIn()) {
      deleteClip(clipId, clipElement);
    } else {
      deleteLocalClip(clipElement.dataset.localClipId, videoId);
      clipElement.remove();
      updateClipCount();
    }
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
        updateClipCount();
      })
      .catch(error => console.error("❌ クリップ削除エラー:", error));
  }

  function handleClipPlay(e) {
    if (!e.target.classList.contains("play-clip")) return;

    const start = parseFloat(e.target.dataset.start);
    const end = parseFloat(e.target.dataset.end);
    stopLoopWatcher();
    const clipEl = e.target.closest("[data-clip-id]") || e.target.closest("[data-local-clip-id]");
    const clipId = clipEl?.dataset.clipId || clipEl?.dataset.localClipId;
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

    const clipId = btn.closest("[data-clip-id]")?.dataset.clipId || btn.closest("[data-local-clip-id]")?.dataset.localClipId;
    const willEnable = !loopEnabledByClipId.has(clipId);

    if (willEnable) {
      loopEnabledByClipId.add(clipId);
      btn.textContent = "ループ解除";
      btn.classList.add("is-looping");
      startLoopWatcher();
    } else {
      loopEnabledByClipId.delete(clipId);
      btn.textContent = "ループ";
      btn.classList.remove("is-looping");
      startLoopWatcher();
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

    const row = editButton.closest("[data-clip-id]") || editButton.closest("[data-local-clip-id]");
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

  function handleEditSubmit(e) {
    const form = e.target.closest(".clip-edit-form");
    if (!form) return;
    e.preventDefault();

    const row = form.closest("[data-clip-id]") || form.closest("[data-local-clip-id]");
    const clipId = row.dataset.clipId || row.dataset.localClipId;

    const title = form.querySelector('input[name="clip[title]"]').value.trim();
    const startHms = form.querySelector('input[name="clip[start_time]"]').value.trim();
    const endHms = form.querySelector('input[name="clip[end_time]"]').value.trim();

    const startSec = hmsToSeconds(startHms);
    const endSec = hmsToSeconds(endHms);

    const errs = [];
    if (Number.isNaN(startSec) || Number.isNaN(endSec)) errs.push("時刻の形式が不正です（mm:ss または hh:mm:ss）");
    if (startSec > endSec) errs.push("終了は開始より後である必要があります");

    const errBox = form.querySelector(".errors");
    errBox.innerHTML = errs.map(m => `<p>${m}</p>`).join("");
    if (errs.length) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    if (isLoggedIn()) {
      submitEditToServer(row, clipId, title, startSec, endSec, form, errBox, submitBtn);
    } else {
      submitEditToLocal(row, clipId, title, startSec, endSec, form, errBox, submitBtn);
    }
  }

  function submitEditToLocal(row, clipId, title, startSec, endSec, form, errBox, submitBtn) {
    const storageKey = `clips_${videoId}`;
    let clips = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const clipIndex = clips.findIndex(c => String(c.local_id) === clipId);
    if (clipIndex === -1) {
      errBox.innerHTML = `<p>クリップが見つかりません</p>`;
      submitBtn.disabled = false;
      return;
    }

    clips[clipIndex].title = title;
    clips[clipIndex].start_time = startSec;
    clips[clipIndex].end_time = endSec;
    localStorage.setItem(storageKey, JSON.stringify(clips));

    row.querySelector(".clip-title").textContent = title || "";
    const spans = row.querySelectorAll(".play-clip");
    spans.forEach(sp => {
      sp.dataset.start = startSec;
      sp.dataset.end = endSec;
    });

    const startTextEl = row.querySelector("span.play-clip.start-clip");
    const endTextEl = row.querySelector("span.play-clip:not(.start-clip)");
    if (startTextEl) startTextEl.textContent = secondsToHms(startSec);
    if (endTextEl) endTextEl.textContent = secondsToHms(endSec);

    if (activeClip?.clipId === clipId) {
      activeClip.start = startSec;
      activeClip.end = endSec;
      startLoopWatcher();
    }

    errBox.innerHTML = "";
    form.hidden = true;
    submitBtn.disabled = false;
  }

  async function submitEditToServer(row, clipId, title, startSec, endSec, form, errBox, submitBtn) {
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
    if (!isLoggedIn()) {
      alert("お気に入り機能を利用するにはログインが必要です。");
      return;
    }
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

  function initClipSortable() {
    if (!clipList || clipList.dataset.sortableInit === "1") return;
    clipList.dataset.sortableInit = "1";

    new Sortable(clipList, {
      animation: 150,
      handle: ".drag-handle",
      ghostClass: "sort-ghost",
      onEnd: () => {
        const nodes = clipList.querySelectorAll("[data-clip-id], [data-local-clip-id]");
        const ids = Array.from(nodes).map(el => el.dataset.clipId ?? el.dataset.localClipId);
        if (isLoggedIn()) {
          fetch(`/videos/${videoId}/clips/reorder`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": getCsrfToken(),
              "X-Requested-With": "XMLHttpRequest"
            },
            body: JSON.stringify({ order: ids })
          });
        } else {
          const storageKey = `clips_${videoId}`;
          let clips = JSON.parse(localStorage.getItem(storageKey) || '[]');
          clips.forEach(clip => {
            const newPosition = ids.indexOf(String(clip.local_id));
            if (newPosition !== -1) {
              clip.position = newPosition;
            }
          });
          localStorage.setItem(storageKey, JSON.stringify(clips));
        }
      }
    });
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

  initClipSortable();
  updateClipCount();
});
