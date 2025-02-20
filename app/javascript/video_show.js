document.addEventListener("DOMContentLoaded", () => {
  //console.log("🔄 ページがロードされました");

  let ytPlayer;
  const clipForm = document.getElementById("clip-form");
  const clipList = document.getElementById("clip-list");
  const videoId = clipForm?.dataset.videoId;

  //console.log("✅ clipForm:", clipForm);
  //console.log("✅ videoId:", videoId);
  //console.log("✅ clipList:", clipList);

  // ✅ YouTube API のロード確認・リセット
  if (!window.YT || !window.YT.Player) {
    //console.log("⏳ YouTube API をロードします...");
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  } else {
    //console.log("✅ YouTube API は既にロード済み");
  }

  window.onYouTubeIframeAPIReady = function () {
    //console.log("✅ YouTube API Ready");
    ytPlayer = new YT.Player("player", {
      events: {
        "onReady": onPlayerReady
      }
    });
  };

  function onPlayerReady() {
    //console.log("✅ YouTube Player Ready:", ytPlayer);

    document.getElementById("set-start-time")?.addEventListener("click", () => {
      const startTime = ytPlayer.getCurrentTime();
      //console.log("✅ set-start-time:", startTime);
      document.getElementById("clip_start_time").value = startTime.toFixed(2);
    });

    document.getElementById("set-end-time")?.addEventListener("click", () => {
      const endTime = ytPlayer.getCurrentTime();
      //console.log("✅ set-end-time:", endTime);
      document.getElementById("clip_end_time").value = endTime.toFixed(2);
    });
  }

  // ✅ クリップの保存
  function handleFormSubmit(event) {
    event.preventDefault();
    //console.log("📡 フォーム送信イベント発生:", clipForm.action);

    let formData = new FormData(clipForm);
    saveClip(formData);
  }

  function saveClip(formData) {
    //console.log("📡 `fetch()` を実行");
    fetch(clipForm.action, {
      method: "POST",
      body: formData,
      headers: {
        "X-CSRF-Token": getCsrfToken(),
        "X-Requested-With": "XMLHttpRequest"
      }
    })
    .then(response => {
      //console.log("📡 サーバーレスポンス:", response);
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
    .catch(error => {
      //console.error("❌ クリップ作成エラー:", error);
      clipForm.querySelector("input[type='submit']").disabled = false;
    });
  }

  // エラー表示用の関数
  function displayErrors(errors) {
    const errorDiv = document.getElementById("clip-errors");
    errorDiv.innerHTML = "";
    errors.forEach(message => {
      errorDiv.innerHTML += `<p>${message}</p>`;
    });
  }

  function addClipToUI(data) {
    //console.log("✅ Clip created:", data);

    const newClip = document.createElement("li");
    newClip.dataset.clipId = data.id;
    newClip.innerHTML = `
      <span>(開始: ${data.start_time.toFixed(2)} 秒, 終了: ${data.end_time.toFixed(2)} 秒)</span>
      <div>
        <button class="play-clip" data-start="${data.start_time}" data-end="${data.end_time}">再生</button>
        <button class="delete-clip">削除</button>
      </div>
    `;

    clipList?.appendChild(newClip);
  }

  function resetForm() {
    clipForm.reset();
    //console.log("📄 フォームをリセットしました");
  
    // ✅ `submit` ボタンを有効化
    //Rails UJS による submit ボタンの無効化を解除
    clipForm.querySelector("input[type='submit']").disabled = false;
    //console.log("✅ `submit` ボタンを有効化");
  }  

  // ✅ クリップの削除
  function handleClipDelete(e) {
    //特定の要素をクリックした場合のみ処理を実行
    if (!e.target.classList.contains("delete-clip")) return;

    const clipElement = e.target.closest("li");
    const clipId = clipElement.dataset.clipId;
    //console.log(`🗑 Deleting clip: ${clipId}`);

    deleteClip(clipId, clipElement);
  }

  function deleteClip(clipId, clipElement) {
    fetch(`/videos/${videoId}/clips/${clipId}`, {
      method: "DELETE",
      headers: {
        "X-CSRF-Token": getCsrfToken(),
        "Content-Type": "application/json"
      }
    })
    .then(response => {
      if (!response.ok) throw new Error(`HTTPエラー！ステータス: ${response.status}`);
      clipElement.remove();
      //console.log(`✅ Clip ${clipId} deleted`);
    })
    .catch(error => console.error("❌ クリップ削除エラー:", error));
  }

  // ✅ クリップの再生
  function handleClipPlay(e) {
    if (!e.target.classList.contains("play-clip")) return;

    const start = parseFloat(e.target.dataset.start);
    const end = parseFloat(e.target.dataset.end);
    //console.log(`▶️ Playing clip from ${start} to ${end}`);
    //console.log("🎯 e.target.dataset.start の値:", e.target.dataset.start);
    //console.log("🔍 e.target.dataset.start の型:", typeof e.target.dataset.start);

    ytPlayer.seekTo(start, true);
    ytPlayer.playVideo();

    // ⏹ クリップ再生終了時の処理、選択できるようになった際に有効化
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

  // ✅ CSRFトークン取得関数
  function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.content || "";
  }

  // ✅ イベントリスナー登録
  if (clipForm) {
    clipForm.addEventListener("submit", handleFormSubmit);
  }
  
  clipList?.addEventListener("click", handleClipDelete);
  clipList?.addEventListener("click", handleClipPlay);

  clipForm?.addEventListener("ajax:error", event => {
    //console.error("❌ ajax:error イベント発火:", event.detail);
  });
});
