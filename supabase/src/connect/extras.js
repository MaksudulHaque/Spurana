/* ============================================================
 * SPURANA · connect/extras.js — Vanish Mode · Pratidhwani · Track
 *  • Vanish: ephemeral chat over realtime BROADCAST — never
 *    written to the DB; bubbles fade and are gone on leave.
 *  • Pratidhwani: messages to your future selves, released on a
 *    chosen date (stored as type 'echo', excluded from chat).
 *  • Track Souls: opt-in live location shared ephemerally; shows
 *    the distance between you (no map key, nothing stored).
 * ============================================================ */
(function () {
  "use strict";
  function needConv() { if (!APP.activeConv) { Router.go("chat"); return null; } return APP.activeConv; }
  const me = () => (APP.me && APP.me.id);

  // ── Vanish Mode ──
  Router.register("vanish", function (root) {
    const conv = needConv(); if (!conv) return {};
    root.appendChild(topBar({ title: "Vanish Mode", back: true }));
    root.appendChild(H.el("div", { class: "vanish-note" }, "Nothing here is saved. When you leave, it's gone."));
    const msgs = H.el("div", { class: "msgs", style: "padding-top:8px" });
    root.appendChild(msgs);
    const input = H.el("textarea", { rows: "1", placeholder: "Say something that won't last\u2026" });
    const send = H.el("button", { class: "send", onClick: fire }, "\u27a4");
    root.appendChild(H.el("div", { class: "composer" }, [H.el("div", { class: "wrap" }, input), send]));

    function bubble(text, mine) {
      const row = H.el("div", { class: "row " + (mine ? "me" : "them") + " fresh vanishing" }, H.el("div", { class: "bubble" }, text));
      msgs.appendChild(row); msgs.scrollTop = msgs.scrollHeight;
      setTimeout(() => { row.classList.add("gone"); setTimeout(() => row.remove(), 900); }, 14000);
    }
    let ch = null;
    try {
      ch = SP._sb.channel("vanish:" + conv, { config: { broadcast: { self: false } } })
        .on("broadcast", { event: "msg" }, (p) => { if (p && p.payload && p.payload.uid !== me()) bubble(p.payload.text, false); })
        .subscribe();
    } catch (e) {}
    function fire() {
      const t = input.value.trim(); if (!t) return; input.value = "";
      bubble(t, true);
      try { ch && ch.send({ type: "broadcast", event: "msg", payload: { text: t, uid: me(), ts: Date.now() } }); } catch (e) {}
    }
    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); fire(); } });
    return { teardown() { try { if (ch && SP._sb) SP._sb.removeChannel(ch); } catch (e) {} } };
  });

  // ── Pratidhwani (spaced echo) ──
  Router.register("pratidhwani", function (root) {
    const conv = needConv(); if (!conv) return {};
    root.appendChild(topBar({ title: "Pratidhwani", back: true }));
    const body = H.el("div", { class: "pad scroll grow stack reveal" });
    root.appendChild(body);
    body.appendChild(H.el("p", { class: "center", style: "font-family:var(--f-soul);font-style:italic;color:var(--text-dim)" }, "An echo \u2014 a message to your future selves, returning on the day you choose."));

    const ta = H.el("textarea", { class: "input", rows: "3", placeholder: "Words for a future day\u2026", style: "resize:none" });
    const when = H.el("input", { class: "input", type: "date" });
    const sendBtn = H.el("button", { class: "btn btn-primary btn-block", onClick: release }, "Release to the future \u2726");
    body.appendChild(H.el("div", { class: "card stack" }, [ta, when, sendBtn]));
    const listEl = H.el("div", { class: "stack" }); body.appendChild(listEl);

    function parse(m) { try { return JSON.parse(m.text); } catch (e) { return { b: m.text || "", r: 0 }; } }
    function card(m) {
      const o = parse(m); const due = Number(o.r) || 0; const ready = due <= Date.now();
      const days = Math.ceil((due - Date.now()) / 86400000);
      return H.el("div", { class: "card" }, ready
        ? [H.el("div", { style: "font-family:var(--f-soul);font-size:18px;color:#eaccff" }, o.b),
           H.el("div", { class: "zc-desc", style: "margin-top:6px" }, "echoed back \u00b7 " + new Date(due).toLocaleDateString())]
        : [H.el("div", { class: "row spread" }, [H.el("div", { class: "zc-title", style: "font-size:15px" }, "\uD83D\uDD12 A sealed echo"), H.el("div", { class: "day-count" }, "in " + days + "d")]),
           H.el("div", { class: "zc-desc" }, "returns " + new Date(due).toLocaleDateString())]);
    }
    function sortItems(items) { return items.slice().sort((a, b) => (parse(a).r || 0) - (parse(b).r || 0)); }
    function render(items) { H.clear(listEl); sortItems(items).forEach((m) => listEl.appendChild(card(m))); }
    async function release() {
      const b = ta.value.trim(); if (!b) { toast("Write your echo."); return; } if (!when.value) { toast("Choose a return date."); return; }
      const r = new Date(when.value + "T09:00:00").getTime();
      const m = await Keepsake.add(conv, "echo", { text: JSON.stringify({ b: b, r: r }) });
      if (m) { ta.value = ""; when.value = ""; render(await Keepsake.list(conv, "echo")); toast("Sealed \u2726"); } else toast("Couldn't seal.", true);
    }
    let ch = null;
    (async () => { render(await Keepsake.list(conv, "echo")); ch = Keepsake.subscribe(conv, "echo", async () => render(await Keepsake.list(conv, "echo"))); })();
    return { teardown() { Keepsake.unsub(ch); } };
  });

  // ── Track Souls ──
  function dist(a, b) {
    const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLon = (b.lng - a.lng) * Math.PI / 180;
    const la1 = a.lat * Math.PI / 180, la2 = b.lat * Math.PI / 180;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }
  Router.register("track", function (root) {
    const conv = needConv(); if (!conv) return {};
    root.appendChild(topBar({ title: "Track Souls", back: true }));
    const body = H.el("div", { class: "pad scroll grow reveal", style: "display:flex;flex-direction:column;align-items:center;gap:18px;justify-content:center;min-height:55vh" });
    root.appendChild(body);
    const dot = H.el("div", { class: "track-orb" });
    const distEl = H.el("div", { class: "track-dist" }, "\u2014");
    const note = H.el("p", { class: "center muted", style: "font-family:var(--f-soul);font-style:italic;max-width:300px" }, "Share your location to feel how far apart you are. Opt-in, never stored.");
    const btn = H.el("button", { class: "sacred-btn", onClick: toggle }, "Share my location");
    body.append(dot, distEl, note, btn);

    let ch = null, watchId = null, mine = null, theirs = null, sharing = false;
    function update() {
      if (mine && theirs) { const d = dist(mine, theirs); distEl.textContent = d < 0.05 ? "Together \u2726" : d < 1 ? Math.round(d * 1000) + " m apart" : d.toFixed(d < 10 ? 1 : 0) + " km apart"; note.textContent = "The distance between two souls, in this moment."; }
      else if (sharing) distEl.textContent = "waiting for them\u2026";
    }
    try {
      ch = SP._sb.channel("loc:" + conv, { config: { broadcast: { self: false } } })
        .on("broadcast", { event: "loc" }, (p) => { if (p && p.payload && p.payload.uid !== me()) { theirs = p.payload; update(); } })
        .subscribe();
    } catch (e) {}
    function toggle() {
      if (sharing) { stop(); return; }
      if (!navigator.geolocation) { toast("Location isn't available on this device.", true); return; }
      sharing = true; btn.textContent = "Stop sharing"; dot.classList.add("live"); update();
      watchId = navigator.geolocation.watchPosition((pos) => {
        mine = { lat: pos.coords.latitude, lng: pos.coords.longitude, uid: me() }; update();
        try { ch && ch.send({ type: "broadcast", event: "loc", payload: mine }); } catch (e) {}
      }, () => { toast("Location permission needed.", true); stop(); }, { enableHighAccuracy: false, maximumAge: 30000, timeout: 12000 });
    }
    function stop() { sharing = false; btn.textContent = "Share my location"; dot.classList.remove("live"); if (watchId != null && navigator.geolocation) navigator.geolocation.clearWatch(watchId); watchId = null; }
    return { teardown() { stop(); try { if (ch && SP._sb) SP._sb.removeChannel(ch); } catch (e) {} } };
  });
})();
