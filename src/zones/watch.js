/* ============================================================
 * SPURANA · zones/watch.js  (STEP 8 — Watch Together, synced)
 * Paste a YouTube link; both partners load it and stay in sync.
 * Local play/pause/seek broadcasts {video_id, playing, position,
 * ts} via SP.shared.watch; remote changes are applied with drift
 * correction (accounting for time elapsed since the write).
 * ============================================================ */
(function () {
  "use strict";

  function ytId(url) {
    if (!url) return null;
    const m = String(url).match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
    return /^[A-Za-z0-9_-]{11}$/.test(String(url).trim()) ? url.trim() : null;
  }
  function loadYT() {
    return new Promise((res) => {
      if (window.YT && window.YT.Player) return res();
      window.__ytCbs = window.__ytCbs || [];
      window.__ytCbs.push(res);
      if (window.__ytLoading) return;
      window.__ytLoading = true;
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () { if (prev) { try { prev(); } catch (e) {} } (window.__ytCbs || []).forEach((f) => f()); window.__ytCbs = []; };
      const s = document.createElement("script"); s.src = "https://www.youtube.com/iframe_api";
      (document.body || document.documentElement).appendChild(s);
    });
  }

  Router.register("watch", function (root) {
    const conv = APP.activeConv;
    if (!conv) { Router.go("chat"); return {}; }
    const myId = APP.me.id;
    root.appendChild(topBar({ title: "Watch Together", back: true }));
    const body = H.el("div", { class: "grow scroll", style: "display:flex;flex-direction:column" });
    root.appendChild(body);

    const share = H.el("div", { class: "pad row", style: "gap:8px" }, [
      H.el("input", { class: "input", id: "wlink", placeholder: "Paste a YouTube link\u2026", style: "flex:1" }),
      H.el("button", { class: "btn btn-primary", onClick: shareLink }, "Share"),
    ]);
    body.appendChild(share);
    const stageHost = H.el("div", { class: "watch-stage" }, H.el("div", { id: "ytplayer" }));
    const hint = H.el("div", { class: "pad center faint", style: "font-family:var(--f-soul);font-style:italic" }, "Share a link to begin \u2014 play, pause and seek stay in sync for you both.");
    body.append(stageHost, hint);

    let player = null, videoId = null, applying = false, ready = false, ch = null;

    function safeSet(fields) { try { const r = SP.shared.watch.set(conv, fields); if (r && r.then) r.then(function () {}, function () {}); } catch (e) {} }
    function send() {
      if (applying || !player || !videoId) return;
      let playing = false, position = 0;
      try { playing = player.getPlayerState() === 1; position = player.getCurrentTime() || 0; } catch (e) {}
      safeSet({ video_id: videoId, playing: playing, position: position, ts: Date.now() });
    }

    async function ensurePlayer(id, startAt, play) {
      await loadYT();
      hint.classList.add("hidden");
      if (player && videoId === id) { applyState(startAt, play); return; }
      videoId = id;
      if (player && player.loadVideoById) { applying = true; player.loadVideoById({ videoId: id, startSeconds: startAt || 0 }); if (!play) try { player.pauseVideo(); } catch (e) {} setTimeout(() => { applying = false; }, 600); return; }
      player = new YT.Player("ytplayer", {
        videoId: id, playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => { ready = true; if (startAt) try { player.seekTo(startAt, true); } catch (e) {} if (!play) try { player.pauseVideo(); } catch (e) {} },
          onStateChange: (e) => { if (applying) return; if (e.data === 1 || e.data === 2) send(); },
        },
      });
    }
    function applyState(position, play) {
      if (!player) return; applying = true;
      try { if (typeof position === "number") { const cur = player.getCurrentTime ? player.getCurrentTime() : 0; if (Math.abs(cur - position) > 1.5) player.seekTo(position, true); } } catch (e) {}
      try { if (play) player.playVideo(); else player.pauseVideo(); } catch (e) {}
      setTimeout(() => { applying = false; }, 700);
    }

    async function shareLink() {
      const v = document.getElementById("wlink");
      const id = ytId(v && v.value);
      if (!id) { toast("Paste a valid YouTube link.", true); return; }
      if (v) v.value = "";
      safeSet({ video_id: id, playing: false, position: 0, ts: Date.now() });
      await ensurePlayer(id, 0, false);
    }

    function onRemote(row) {
      if (!row || !row.video_id) return;
      if (row.last_by && row.last_by === myId) return;     // ignore our own writes
      let pos = Number(row.position) || 0;
      if (row.playing && row.ts) pos += Math.max(0, (Date.now() - Number(row.ts)) / 1000);  // drift since write
      ensurePlayer(row.video_id, pos, !!row.playing).then(() => applyState(pos, !!row.playing));
    }

    (async () => { try { const r = await SP.shared.watch.get(conv); if (r && r.data && r.data.video_id) onRemote(Object.assign({}, r.data, { last_by: null })); } catch (e) {} })();
    try { ch = SP.shared.watch.subscribe(conv, onRemote); } catch (e) {}

    return { teardown() { try { if (player && player.destroy) player.destroy(); } catch (e) {} try { if (ch && SP._sb) SP._sb.removeChannel(ch); } catch (e) {} } };
  });
})();
