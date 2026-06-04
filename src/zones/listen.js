/* ============================================================
 * SPURANA · zones/listen.js — Listen Together (synced audio).
 * Paste an audio URL; both partners hear it in sync. Local
 * play/pause/seek broadcasts via SP.shared.listen; remote
 * changes apply with drift correction. (Plain <audio>, no key.)
 * ============================================================ */
(function () {
  "use strict";
  Router.register("listen", function (root) {
    const conv = APP.activeConv; if (!conv) { Router.go("chat"); return {}; }
    const myId = APP.me.id;
    root.appendChild(topBar({ title: "Listen Together", back: true }));
    const body = H.el("div", { class: "pad scroll grow stack reveal" });
    root.appendChild(body);
    body.appendChild(H.el("div", { class: "row", style: "gap:8px" }, [
      H.el("input", { class: "input", id: "llink", placeholder: "Paste an audio link (mp3)\u2026", style: "flex:1" }),
      H.el("button", { class: "btn btn-primary", onClick: share }, "Share"),
    ]));
    const audio = H.el("audio", { controls: "true", style: "width:100%;margin-top:8px" });
    body.appendChild(audio);
    body.appendChild(H.el("p", { class: "center faint", style: "font-family:var(--f-soul);font-style:italic" }, "One song, two hearts in rhythm. Share a link to begin."));

    let applying = false, url = null, ch = null;
    function safeSet(f) { try { const r = SP.shared.listen.set(conv, f); if (r && r.then) r.then(function () {}, function () {}); } catch (e) {} }
    function send() { if (applying || !url) return; safeSet({ url: url, playing: !audio.paused, position: audio.currentTime || 0, ts: Date.now() }); }

    function load(u, position, play) {
      if (url !== u) { url = u; audio.src = u; }
      applying = true;
      try { if (typeof position === "number" && Math.abs((audio.currentTime || 0) - position) > 1.2) audio.currentTime = position; } catch (e) {}
      try { if (play) { const p = audio.play(); if (p && p.catch) p.catch(function () {}); } else audio.pause(); } catch (e) {}
      setTimeout(() => { applying = false; }, 700);
    }
    function share() {
      const v = document.getElementById("llink"); const u = (v && v.value || "").trim();
      if (!u) { toast("Paste an audio link.", true); return; } if (v) v.value = "";
      load(u, 0, false); safeSet({ url: u, playing: false, position: 0, ts: Date.now() });
    }
    function onRemote(row) {
      if (!row || !row.url) return; if (row.last_by && row.last_by === myId) return;
      let pos = Number(row.position) || 0; if (row.playing && row.ts) pos += Math.max(0, (Date.now() - Number(row.ts)) / 1000);
      load(row.url, pos, !!row.playing);
    }
    ["play", "pause", "seeked"].forEach((ev) => audio.addEventListener(ev, send));
    (async () => { try { const r = await SP.shared.listen.get(conv); if (r && r.data && r.data.url) onRemote(Object.assign({}, r.data, { last_by: null })); } catch (e) {} })();
    try { ch = SP.shared.listen.subscribe(conv, onRemote); } catch (e) {}
    return { teardown() { try { audio.pause(); } catch (e) {} try { if (ch && SP._sb) SP._sb.removeChannel(ch); } catch (e) {} } };
  });
})();
