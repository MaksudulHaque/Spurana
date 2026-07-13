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

    // ── audio / video echo capture ──
    let mediaBlob = null, mediaKind = null, rec = null, stream = null, recording = false;
    const mediaPreview = H.el("div", { class: "echo-media", style: "display:none" });
    const recRow = H.el("div", { class: "row", style: "gap:8px" });
    const aBtn = H.el("button", { class: "btn btn-ghost", style: "flex:1" }, "\uD83C\uDF99 Voice echo");
    const vBtn = H.el("button", { class: "btn btn-ghost", style: "flex:1" }, "\uD83D\uDCF9 Video echo");
    recRow.append(aBtn, vBtn);

    async function startRec(kind) {
      if (recording) { stopRec(); return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia(kind === "video" ? { audio: true, video: { facingMode: "user" } } : { audio: true });
      } catch (e) { toast("Permission needed for " + kind + ".", true); return; }
      mediaKind = kind; recording = true;
      var mime = kind === "video"
        ? (MediaRecorder.isTypeSupported("video/webm") ? "video/webm" : "")
        : (MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "");
      var chunks = [];
      rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = function () {
        try { stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
        mediaBlob = new Blob(chunks, { type: (rec && rec.mimeType) || (kind === "video" ? "video/webm" : "audio/webm") });
        recording = false;
        (kind === "video" ? vBtn : aBtn).textContent = (kind === "video" ? "\uD83D\uDCF9 Video echo" : "\uD83C\uDF99 Voice echo");
        (kind === "video" ? aBtn : vBtn).textContent = (kind === "video" ? "\uD83C\uDF99 Voice echo" : "\uD83D\uDCF9 Video echo");
        // preview
        mediaPreview.innerHTML = ""; mediaPreview.style.display = "block";
        var url = URL.createObjectURL(mediaBlob);
        var el = kind === "video" ? H.el("video", { src: url, controls: "", playsinline: "", style: "width:100%;border-radius:14px;max-height:220px" })
                                  : H.el("audio", { src: url, controls: "", style: "width:100%" });
        mediaPreview.appendChild(el);
        mediaPreview.appendChild(H.el("div", { class: "zc-desc", style: "margin-top:4px" }, "\u2713 " + kind + " echo ready to seal"));
      };
      rec.start();
      (kind === "video" ? vBtn : aBtn).textContent = "\u25A0 Stop recording";
    }
    function stopRec() { try { if (rec) rec.stop(); } catch (e) {} }
    aBtn.onclick = function () { startRec("audio"); };
    vBtn.onclick = function () { startRec("video"); };

    const sendBtn = H.el("button", { class: "btn btn-primary btn-block", onClick: release }, "Release to the future \u2726");
    body.appendChild(H.el("div", { class: "card stack" }, [ta, recRow, mediaPreview, when, sendBtn]));
    const listEl = H.el("div", { class: "stack" }); body.appendChild(listEl);

    function parse(m) { try { return JSON.parse(m.text); } catch (e) { return { b: m.text || "", r: 0 }; } }
    function card(m) {
      const o = parse(m); const due = Number(o.r) || 0; const ready = due <= Date.now();
      const days = Math.ceil((due - Date.now()) / 86400000);
      if (ready) {
        var kids = [];
        if (o.b) kids.push(H.el("div", { style: "font-family:var(--f-soul);font-size:18px;color:#eaccff" }, o.b));
        if (o.media && o.kind) {
          // resolve the stored media path to a playable url
          var holder = H.el("div", { style: "margin-top:8px" }, "\u2026");
          SP.media.signedUrl(o.media, 3600).then(function (r) {
            holder.innerHTML = "";
            if (r && r.data) {
              var el = o.kind === "video" ? H.el("video", { src: r.data, controls: "", playsinline: "", style: "width:100%;border-radius:14px;max-height:260px" })
                                          : H.el("audio", { src: r.data, controls: "", style: "width:100%" });
              holder.appendChild(el);
            }
          });
          kids.push(holder);
        }
        kids.push(H.el("div", { class: "zc-desc", style: "margin-top:6px" }, "echoed back \u00b7 " + new Date(due).toLocaleDateString()));
        return H.el("div", { class: "card" }, kids);
      }
      var label = o.kind === "video" ? "\uD83D\uDD12 A sealed video echo" : o.kind === "audio" ? "\uD83D\uDD12 A sealed voice echo" : "\uD83D\uDD12 A sealed echo";
      return H.el("div", { class: "card" }, [
        H.el("div", { class: "row spread" }, [H.el("div", { class: "zc-title", style: "font-size:15px" }, label), H.el("div", { class: "day-count" }, "in " + days + "d")]),
        H.el("div", { class: "zc-desc" }, "returns " + new Date(due).toLocaleDateString())]);
    }
    function sortItems(items) { return items.slice().sort((a, b) => (parse(a).r || 0) - (parse(b).r || 0)); }
    function render(items) { H.clear(listEl); sortItems(items).forEach((m) => listEl.appendChild(card(m))); }
    async function release() {
      const b = ta.value.trim();
      if (!b && !mediaBlob) { toast("Write or record your echo."); return; }
      if (!when.value) { toast("Choose a return date."); return; }
      const r = new Date(when.value + "T09:00:00").getTime();
      let mediaPath = null;
      if (mediaBlob) {
        toast("Sealing your " + mediaKind + " echo\u2026");
        try {
          var fname = "echo." + (mediaKind === "video" ? "webm" : "webm");
          var file = window.File ? new File([mediaBlob], fname, { type: mediaBlob.type }) : mediaBlob;
          var up = await SP.media.upload(conv, file);
          if (up && up.data && up.data.path) mediaPath = up.data.path;
        } catch (e) { toast("Media upload failed.", true); return; }
      }
      const payload = { b: b, r: r };
      if (mediaPath) { payload.media = mediaPath; payload.kind = mediaKind; }
      const m = await Keepsake.add(conv, "echo", { text: JSON.stringify(payload) });
      if (m) { ta.value = ""; when.value = ""; mediaBlob = null; mediaKind = null; mediaPreview.style.display = "none"; mediaPreview.innerHTML = ""; render(await Keepsake.list(conv, "echo")); toast("Sealed \u2726"); } else toast("Couldn't seal.", true);
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
    root.appendChild(topBar({ title: "Track Souls", back: true }));
    const body = H.el("div", { class: "pad scroll grow reveal", style: "display:flex;flex-direction:column;align-items:center;gap:16px;justify-content:center;min-height:58vh" });
    root.appendChild(body);

    const dot = H.el("div", { class: "track-orb" });
    const arrow = H.el("div", { style: "font-size:30px;transition:transform .8s ease;line-height:1" }, "\u2191");
    const distEl = H.el("div", { class: "track-dist" }, "\u2014");
    const dirEl = H.el("div", { class: "muted", style: "font-family:var(--f-ui);font-size:12px;letter-spacing:.18em;text-transform:uppercase" }, "");
    const fresh = H.el("div", { class: "muted", style: "font-size:12px" }, "");
    const note = H.el("p", { class: "center muted", style: "font-family:var(--f-soul);font-style:italic;max-width:300px" }, "Share your location while the app is open. Only your bonded soul can see it. Opt-in, always.");
    const btn = H.el("button", { class: "sacred-btn", onClick: toggle }, "\u2026");
    body.append(dot, arrow, distEl, dirEl, fresh, note, btn);

    let mine = window.SoulLoc ? SoulLoc.mine() : null, theirs = null, theirTs = 0, pname = "them";
    let chDb = null, chLive = null, tick = null;

    function bearing(a, b) {
      const f1 = a.lat * Math.PI / 180, f2 = b.lat * Math.PI / 180, dl = (b.lng - a.lng) * Math.PI / 180;
      const y = Math.sin(dl) * Math.cos(f2), x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl);
      return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    }
    function cardinal(d) { return ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"][Math.round(d / 45) % 8]; }
    function ago(ts) { const s = Math.max(0, (Date.now() - ts) / 1000 | 0); return s < 8 ? "just now" : s < 60 ? s + "s ago" : s < 3600 ? (s / 60 | 0) + "m ago" : (s / 3600 | 0) + "h ago"; }

    function update() {
      const sharing = window.SoulLoc && SoulLoc.on();
      btn.textContent = sharing ? "Stop sharing" : "Share my location";
      dot.classList.toggle("live", !!(sharing && SoulLoc.active()));
      if (mine && theirs) {
        const d = dist(mine, theirs), b = bearing(mine, theirs);
        distEl.textContent = d < 0.05 ? "Together \u2726" : d < 1 ? Math.round(d * 1000) + " m apart" : d.toFixed(d < 10 ? 1 : 0) + " km apart";
        dirEl.textContent = pname + " is to the " + cardinal(b);
        arrow.style.transform = "rotate(" + b.toFixed(0) + "deg)";
        fresh.textContent = theirTs ? "their light: " + ago(theirTs) : "";
        note.textContent = "The distance between two souls, in this moment.";
      } else if (theirs) {
        dirEl.textContent = "";
        distEl.textContent = "they are sharing \u2726";
        fresh.textContent = theirTs ? "their light: " + ago(theirTs) : "";
        note.textContent = sharing ? "Waiting for your first fix\u2026" : "Share yours to feel the distance.";
      } else {
        distEl.textContent = sharing ? "waiting for them\u2026" : "\u2014";
        dirEl.textContent = ""; fresh.textContent = "";
      }
    }
    function toggle() { if (!window.SoulLoc) return; SoulLoc.set(!SoulLoc.on()); update(); }

    if (window.SoulLoc) SoulLoc.onChange(function (m) { mine = m || mine; update(); });

    (async () => {
      try {
        const { data } = await SP.contacts.list();
        const c = (data || [])[0]; if (!c) { toast("Bond with a soul first \u2726"); return; }
        const puid = c.contact_uid;
        pname = c.contact_name || c.name || "them";
        const r = await SP._sb.from("locations").select("*").eq("uid", puid).maybeSingle();
        if (r && r.data) { theirs = { lat: r.data.lat, lng: r.data.lng }; theirTs = new Date(r.data.updated_at).getTime(); }
        update();
        chDb = SP._sb.channel("locdb:" + puid)
          .on("postgres_changes", { event: "*", schema: "public", table: "locations", filter: "uid=eq." + puid },
            (pl) => { const n = pl && pl.new; if (n) { theirs = { lat: n.lat, lng: n.lng }; theirTs = new Date(n.updated_at).getTime(); update(); try { if (window.SoulLoc && SoulLoc.on() && Date.now() - (window.__slPulse || 0) > 30000) { window.__slPulse = Date.now(); if (window.Native && Native.pattern) Native.pattern([45, 80, 45]); } } catch (e) {} } })
          .subscribe();
      } catch (e) {}
    })();

    tick = setInterval(update, 5000);
    update();
    return { teardown() { clearInterval(tick); try { if (chDb && SP._sb) SP._sb.removeChannel(chDb); } catch (e) {} try { if (chLive && SP._sb) SP._sb.removeChannel(chLive); } catch (e) {} } };
  });

  Router.register("tides", function (root) {
    root.appendChild(topBar({ title: "Soul Tides", back: true }));
    var body = H.el("div", { class: "pad scroll grow reveal", style: "display:flex;flex-direction:column;gap:16px" });
    root.appendChild(body);

    var pname = (window.Tides && Tides.partnerName && Tides.partnerName()) || "them";

    var card = H.el("div", { class: "card stack", style: "gap:14px;align-items:center;text-align:center" });
    var orb = H.el("div", { class: "tide-orb" }, "\uD83D\uDD0B");
    var big = H.el("div", { class: "tide-big" }, "\u2014");
    var sub = H.el("div", { class: "muted", style: "font-family:var(--f-soul);font-style:italic" }, "waiting for " + pname + "'s tide\u2026");
    var rows = H.el("div", { class: "tide-rows" });
    card.append(orb, big, sub, rows);
    body.appendChild(card);

    var toggle = H.el("button", { class: "btn", style: "width:100%" }, "\u2026");
    function tglLabel() { if (!window.Tides) { toggle.textContent = "unavailable"; toggle.disabled = true; return; } toggle.className = "btn " + (Tides.on() ? "btn-ghost" : "btn-primary"); toggle.textContent = Tides.on() ? "Tides are flowing \u2726 \u2014 tap to still" : "Let your tides flow to " + pname + " \u2726"; }
    toggle.onclick = function () { if (!window.Tides) return; Tides.set(!Tides.on()); tglLabel(); };
    body.appendChild(toggle);
    body.appendChild(H.el("p", { class: "center muted", style: "font-size:11px;opacity:.7;max-width:320px;margin:2px auto" }, "Mutual & visible \u2014 " + pname + " feels your world exactly as you feel theirs. Turn it off anytime."));

    function ago(ts) { var s = Math.max(0, (Date.now() - ts) / 1000 | 0); return s < 30 ? "just now" : s < 60 ? s + "s ago" : s < 3600 ? (s / 60 | 0) + "m ago" : (s / 3600 | 0) + "h ago"; }
    function render(st) {
      if (!st) return;
      orb.textContent = st.charging ? "\u26A1" : "\uD83D\uDD0B";
      if (typeof st.battery === "number") { big.textContent = st.battery + "%"; big.className = "tide-big" + (st.battery <= 15 && !st.charging ? " low" : ""); }
      var bits = [];
      bits.push(st.charging ? (pname + " is charging \u2014 resting") : (st.active ? (pname + " is here, now") : (pname + " is away")));
      if (st.motion === "moving") bits.push("on the move");
      else if (st.motion === "still" && !st.active) bits.push("still \u2014 perhaps asleep \uD83C\uDF19");
      if (typeof st.active_seconds_today === "number") bits.push("in Spurana " + Math.round(st.active_seconds_today / 60) + " min today");
      sub.textContent = bits[0] || "";
      rows.innerHTML = "";
      bits.slice(1).forEach(function (b) { rows.appendChild(H.el("div", { class: "tide-line" }, b)); });
      rows.appendChild(H.el("div", { class: "tide-line dim" }, "last light: " + ago(new Date(st.updated_at).getTime())));
    }
    if (window.Tides) Tides.onTheirs(render);
    tglLabel();
    return { teardown: function () {} };
  });

})();
