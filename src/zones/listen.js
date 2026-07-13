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
      H.el("input", { class: "input", id: "llink", placeholder: "Paste Spotify, YouTube, or audio link\u2026", style: "flex:1" }),
      H.el("button", { class: "btn btn-primary", onClick: share }, "Share"),
    ]));
    const audio = H.el("audio", { controls: "true", style: "width:100%;margin-top:8px;display:none" });
    const embed = H.el("div", { class: "listen-embed", style: "margin-top:8px" });
    body.appendChild(audio);
    body.appendChild(embed);
    body.appendChild(H.el("p", { class: "center faint", style: "font-family:var(--f-soul);font-style:italic" }, "One song, two hearts in rhythm. Share a Spotify or YouTube link to begin."));

    // ── link kind detection + embedding ──
    function detectKind(u) {
      if (/open\.spotify\.com|spotify:/i.test(u)) return "spotify";
      if (/youtube\.com|youtu\.be/i.test(u)) return "youtube";
      return "audio";
    }
    function spotifyEmbed(u) {
      var m = u.match(/(track|album|playlist|episode|show)[/:]([A-Za-z0-9]+)/);
      if (!m) return null;
      return "https://open.spotify.com/embed/" + m[1] + "/" + m[2];
    }
    function ytId(u) {
      var m = u.match(/(?:v=|youtu\.be\/|\/embed\/)([A-Za-z0-9_-]{11})/);
      return m ? m[1] : null;
    }
    function renderEmbed(u) {
      var kind = detectKind(u);
      embed.innerHTML = ""; audio.style.display = "none"; embed.style.display = "block";
      if (kind === "spotify") {
        var se = spotifyEmbed(u); if (!se) { toast("Couldn't read that Spotify link.", true); return false; }
        embed.appendChild(H.el("iframe", { src: se, style: "width:100%;height:152px;border:0;border-radius:14px", allow: "autoplay; encrypted-media", loading: "lazy" }));
        return true;
      }
      if (kind === "youtube") {
        var id = ytId(u); if (!id) { toast("Couldn't read that YouTube link.", true); return false; }
        embed.appendChild(H.el("iframe", { src: "https://www.youtube.com/embed/" + id, style: "width:100%;aspect-ratio:16/9;border:0;border-radius:14px", allow: "autoplay; encrypted-media", allowfullscreen: "" }));
        return true;
      }
      // plain audio
      embed.style.display = "none"; audio.style.display = "block";
      return true;
    }
    // ── live chat, same page (shared with the conversation) ──
    const chatList = H.el("div", { class: "watch-chat-list" });
    const chatInput = H.el("input", { class: "input", placeholder: "Say something\u2026", style: "flex:1" });
    body.appendChild(H.el("div", { class: "watch-chat" }, [chatList, H.el("div", { class: "row", style: "gap:8px;padding:8px" }, [chatInput, H.el("button", { class: "btn btn-primary", onClick: fireChat }, "\u27A4")])]));
    function addMsg(m) { if (!m || (m.conv_id && m.conv_id !== conv) || m.deleted) return; const mine = m.uid === myId; chatList.appendChild(H.el("div", { class: "wc-row " + (mine ? "me" : "them") }, H.el("div", { class: "wc-bubble" }, m.text || ""))); chatList.scrollTop = chatList.scrollHeight; }
    async function fireChat() { const t = (chatInput.value || "").trim(); if (!t) return; chatInput.value = ""; try { await SP.chat.send(conv, { text: t }); } catch (e) {} }
    chatInput.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); fireChat(); } });
    (async () => { try { const r = await SP.chat.history(conv, 30); if (r && r.data) r.data.forEach(addMsg); } catch (e) {} })();
    let chatCh = null; try { chatCh = SP._sb.channel("lchat:" + conv).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: "conv_id=eq." + conv }, (pl) => addMsg(pl.new)).subscribe(); } catch (e) {}

    let applying = false, url = null, ch = null;
    function safeSet(f) { try { const r = SP.shared.listen.set(conv, f); if (r && r.then) r.then(function () {}, function () {}); } catch (e) {} }
    function send() { if (applying || !url) return; safeSet({ url: url, playing: !audio.paused, position: audio.currentTime || 0, ts: Date.now() }); }

    function load(u, position, play) {
      var kind = detectKind(u);
      if (kind !== "audio") {
        if (url !== u) { url = u; renderEmbed(u); }
        return; // embeds sync the track, not the timeline (platform limitation)
      }
      if (url !== u) { url = u; audio.src = u; audio.style.display = "block"; embed.style.display = "none"; }
      applying = true;
      try { if (typeof position === "number" && Math.abs((audio.currentTime || 0) - position) > 1.2) audio.currentTime = position; } catch (e) {}
      try { if (play) { const p = audio.play(); if (p && p.catch) p.catch(function () {}); } else audio.pause(); } catch (e) {}
      setTimeout(() => { applying = false; }, 700);
    }
    function share() {
      const v = document.getElementById("llink"); const u = (v && v.value || "").trim();
      if (!u) { toast("Paste a Spotify, YouTube, or audio link.", true); return; } if (v) v.value = "";
      load(u, 0, false); safeSet({ url: u, playing: false, position: 0, ts: Date.now() });
      var k = detectKind(u);
      if (k !== "audio") toast("Shared \u2014 you both have the same track \u2726");
    }
    function onRemote(row) {
      if (!row || !row.url) return; if (row.last_by && row.last_by === myId) return;
      let pos = Number(row.position) || 0; if (row.playing && row.ts) pos += Math.max(0, (Date.now() - Number(row.ts)) / 1000);
      load(row.url, pos, !!row.playing);
    }
    ["play", "pause", "seeked"].forEach((ev) => audio.addEventListener(ev, send));
    (async () => { try { const r = await SP.shared.listen.get(conv); if (r && r.data && r.data.url) onRemote(Object.assign({}, r.data, { last_by: null })); } catch (e) {} })();
    try { ch = SP.shared.listen.subscribe(conv, onRemote); } catch (e) {}
    return { teardown() { try { audio.pause(); } catch (e) {} try { if (ch && SP._sb) SP._sb.removeChannel(ch); } catch (e) {} try { if (chatCh && SP._sb) SP._sb.removeChannel(chatCh); } catch (e) {} } };
  });
})();
