/* ============================================================
 * SPURANA · chat/thread.js  (STEP 4 — messenger-grade)
 * Active conversation: grouped bubbles + tails, day separators,
 * live presence + typing in the header, typing dots, read-ticks
 * (via partner last_seen), jump-to-bottom pill, double-tap hearts.
 * Realtime is scoped to THIS conv; teardown frees every channel.
 * ============================================================ */
(function () {
  "use strict";

  function dayLabel(ts) {
    const d = new Date(Number(ts)); const now = new Date();
    const sameDay = (a, b) => a.toDateString() === b.toDateString();
    if (sameDay(d, now)) return "Today";
    const y = new Date(now); y.setDate(now.getDate() - 1);
    if (sameDay(d, y)) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: d.getFullYear() === now.getFullYear() ? undefined : "numeric" });
  }
  function relSeen(ms) {
    if (!ms) return "offline";
    const m = Math.max(0, Date.now() - Number(ms)) / 60000;
    if (m < 1) return "last seen just now";
    if (m < 60) return "last seen " + Math.floor(m) + "m ago";
    const h = m / 60; if (h < 24) return "last seen " + Math.floor(h) + "h ago";
    return "last seen " + new Date(Number(ms)).toLocaleDateString([], { month: "short", day: "numeric" });
  }

  Router.register("thread", function (root, query) {
    const convId = (query && query.c) || APP.activeConv;
    if (!convId) { Router.go("chat"); return {}; }
    APP.activeConv = convId;
    const myId = APP.me.id;
    const partner = APP.partner || { uid: null, name: "Your beloved" };

    const stDot = H.el("span", { class: "dot" });
    const stText = H.el("span", null, "\u2026");
    const status = H.el("div", { class: "st" }, [stDot, stText]);
    const head = H.el("div", { class: "chat-head" }, [
      H.el("button", { class: "iconbtn", title: "Back", onClick: () => Router.go("chat") }, "\u2039"),
      H.el("div", { class: "ava" }, H.initials(partner.name)),
      H.el("div", { class: "who" }, [H.el("div", { class: "nm" }, partner.name), status]),
      H.el("button", { class: "iconbtn", title: "Voice call", onClick: () => { if (window.Calls) Calls.start(convId, "audio", partner); } }, "\u260E"),
      H.el("button", { class: "iconbtn", title: "Video call", onClick: () => { if (window.Calls) Calls.start(convId, "video", partner); } }, "\uD83C\uDF9E"),
      H.el("button", { class: "iconbtn", title: "Together", onClick: () => Router.go("zones") }, "\u2726"),
    ]);
    root.appendChild(head);
    if (window.Calls) Calls.listen(convId);

    const msgs = H.el("div", { class: "msgs", id: "msgs" });
    const typingRow = H.el("div", { class: "typing-row" }, [H.el("i"), H.el("i"), H.el("i")]);
    const jumpBadge = H.el("span", { class: "badge hidden" }, "0");
    const jump = H.el("button", { class: "jump", onClick: () => scrollDown(true) }, [H.el("span", null, "\u2193"), jumpBadge]);
    msgs.appendChild(typingRow);
    root.append(msgs, jump);

    const seen = new Set(), byId = {}, ownTicks = [];
    let lastUid = null, lastTs = 0, partnerLastSeen = 0, partnerOnline = false, unreadWhileUp = 0;

    function atBottom() { return msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 90; }
    function scrollDown(force) { if (force || atBottom()) { msgs.scrollTop = msgs.scrollHeight; unreadWhileUp = 0; jump.classList.remove("on"); jumpBadge.classList.add("hidden"); } }
    function cssId(id) { return (window.CSS && CSS.escape) ? CSS.escape(id) : String(id).replace(/"/g, '\\"'); }

    function tickEl(m) { const s = partnerLastSeen && m.ts <= partnerLastSeen; return H.el("span", { class: "tick" + (s ? " seen" : "") }, s ? "\u2713\u2713" : "\u2713"); }
    function updateTicks() { ownTicks.forEach((o) => { const s = partnerLastSeen && o.ts <= partnerLastSeen; o.el.className = "tick" + (s ? " seen" : ""); o.el.textContent = s ? "\u2713\u2713" : "\u2713"; }); }

    function reactionChip(m) {
      let map = m.reactions; if (!map) return null; if (typeof map === "string") { try { map = JSON.parse(map); } catch (e) { return null; } }
      const keys = Object.keys(map || {}).filter((k) => (map[k] || []).length);
      if (!keys.length) return null;
      return H.el("div", { class: "react" }, keys.map((k) => k + " " + map[k].length).join("  "));
    }
    function renderRow(m) {
      const mine = m.uid === myId;
      const grp = (m.uid === lastUid) && (m.ts - lastTs < 5 * 60000);
      const row = H.el("div", { class: "row " + (mine ? "me" : "them") + " " + (grp ? "grp" : "fresh"), "data-id": m.id });
      let bubble;
      const mediaNode = (!m.deleted && window.Media && (m.type === "image" || m.type === "voice" || m.type === "ptt")) ? Media.bubbleContent(m) : null;
      if (mediaNode) { bubble = H.el("div", { class: "bubble media" }, mediaNode); }
      else {
        const text = m.deleted ? "this whisper was withdrawn" : (m.text || "");
        bubble = H.el("div", { class: "bubble" + (m.deleted ? " deleted" : "") }, text);
      }
      row.appendChild(bubble);
      const rc = reactionChip(m); if (rc) row.appendChild(rc);
      const meta = H.el("div", { class: "meta" }, H.timeLabel(m.ts));
      if (mine && !m.deleted) { const t = tickEl(m); meta.appendChild(t); ownTicks.push({ ts: m.ts, el: t }); }
      row.appendChild(meta);
      let lastTap = 0;
      bubble.addEventListener("click", () => { const n = Date.now(); if (n - lastTap < 320) toggleHeart(m, row); lastTap = n; });
      lastUid = m.uid; lastTs = m.ts;
      return row;
    }

    async function toggleHeart(m, row) {
      let map = m.reactions || {}; if (typeof map === "string") { try { map = JSON.parse(map); } catch (e) { map = {}; } }
      const arr = map["\u2764\uFE0F"] || []; const i = arr.indexOf(myId);
      if (i >= 0) arr.splice(i, 1); else { arr.push(myId); popHeart(row); }
      map["\u2764\uFE0F"] = arr; m.reactions = map;
      const { error } = await SP.chat.react(m.id, map);
      if (error) toast("Couldn't react.", true); else replaceRow(m);
    }
    function popHeart(row) {
      if (document.documentElement.getAttribute("data-perf") === "lite") return;
      const h = H.el("div", { class: "heart-pop" }, "\u2764\uFE0F"); row.appendChild(h); setTimeout(() => h.remove(), 720);
    }

    function add(m, live) {
      if (!m || seen.has(m.id)) return;
      if (m.type && ["letter", "memory", "gratitude", "sacred_day", "reflection", "echo", "mood", "reminder"].indexOf(m.type) >= 0) return;  // keepsakes live in REMEMBER, not chat
      seen.add(m.id); byId[m.id] = m;
      const stick = atBottom();
      const dl = dayLabel(m.ts);
      if (dl !== add._day) { add._day = dl; msgs.insertBefore(H.el("div", { class: "day" }, dl), typingRow); }
      msgs.insertBefore(renderRow(m), typingRow);
      if (stick || m.uid === myId) scrollDown(true);
      else { unreadWhileUp++; jumpBadge.textContent = String(unreadWhileUp); jumpBadge.classList.remove("hidden"); jump.classList.add("on"); }
      if (live && m.uid !== myId) { try { Audio2.received(); } catch (e) {} if (document.hidden && window.Notify) Notify.fire(partner.name || "Spurana", m.text || "New message \u2726"); if (atBottom()) markRead(); }
    }
    function replaceRow(m) {
      byId[m.id] = m;
      const node = msgs.querySelector('[data-id="' + cssId(m.id) + '"]'); if (!node) return;
      const su = lastUid, st = lastTs; lastUid = null; lastTs = 0;
      node.replaceWith(renderRow(m)); lastUid = su; lastTs = st;
    }
    async function markRead() { try { await SP.chat.markRead(convId); } catch (e) {} }

    let typingHide = null;
    function setStatus() {
      status.className = "st" + (typingHide ? " typing" : partnerOnline ? " live" : "");
      stText.textContent = typingHide ? "is present\u2026" : partnerOnline ? "present" : relSeen(partnerLastSeen);
      stDot.style.display = (partnerOnline || typingHide) ? "" : "none";
    }
    function onPresence(p) { if (!p) return; partnerOnline = !!p.online; if (p.last_seen) partnerLastSeen = Number(p.last_seen); setStatus(); updateTicks(); }
    function onTyping(t) {
      if (!t) { return; }
      const recent = t.updated_at ? (Date.now() - new Date(t.updated_at).getTime() < 6000) : true;
      if (t.is_typing && recent) {
        typingRow.classList.add("on"); if (atBottom()) scrollDown(true);
        clearTimeout(typingHide); typingHide = setTimeout(() => { typingHide = null; typingRow.classList.remove("on"); setStatus(); }, 5000);
      } else { clearTimeout(typingHide); typingHide = null; typingRow.classList.remove("on"); }
      setStatus();
    }

    let pCh = null;
    function watchPartner() {
      if (!partner.uid) return;
      (async () => {
        try { const r = await SP._sb.from("presence").select("*").eq("uid", partner.uid).maybeSingle(); onPresence(r && r.data); } catch (e) {}
        try { const t = await SP._sb.from("typing").select("*").eq("uid", partner.uid).maybeSingle(); onTyping(t && t.data); } catch (e) {}
      })();
      pCh = SP._sb.channel("watch:" + partner.uid)
        .on("postgres_changes", { event: "*", schema: "public", table: "presence", filter: "uid=eq." + partner.uid }, (p) => onPresence(p.new))
        .on("postgres_changes", { event: "*", schema: "public", table: "typing", filter: "uid=eq." + partner.uid }, (p) => onTyping(p.new))
        .subscribe();
    }

    msgs.addEventListener("scroll", () => { if (atBottom()) { unreadWhileUp = 0; jump.classList.remove("on"); jumpBadge.classList.add("hidden"); } });

    async function load() {
      const { data, error } = await SP.chat.history(convId, CFG.HISTORY_LIMIT);
      if (error) msgs.insertBefore(H.el("div", { class: "day" }, "could not load history"), typingRow);
      else if (!data || !data.length) msgs.insertBefore(H.el("div", { class: "empty" }, [
        H.el("div", { class: "big" }, "\u2726"),
        H.el("p", { class: "muted", style: "font-family:var(--f-soul);font-style:italic" }, "The beginning of your shared silence. Break it gently."),
      ]), typingRow);
      else data.forEach((m) => add(m, false));
      scrollDown(true); markRead();
    }

    SP.chat.join(convId, (m) => add(m, true), (m) => replaceRow(m));
    try { SP.presence.setOnline(true); } catch (e) {}
    watchPartner(); setStatus();
    root.appendChild(Composer.build(convId, { onSent: (m) => add(m, false), convId: convId }));

    // (chat is kept clean — PTT & live actions live in the Connect wing, not floating here)
    load();

    return {
      teardown() {
        SP.chat.leave();
        try { if (pCh) SP._sb.removeChannel(pCh); } catch (e) {}
        clearTimeout(typingHide);
        try { SP.presence.setTyping(false); } catch (e) {}
      },
    };
  });
})();
