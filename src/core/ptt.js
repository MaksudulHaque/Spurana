/* ============================================================
 * SPURANA · core/ptt.js — Push-To-Talk ("speak to my soul").
 * Hold the orb → your voice records; release → it flies. On the
 * other side, if the app is open ANYWHERE, the voice bursts
 * through instantly with a signature vibration (no tapping).
 * App closed → the push arrives as a 🎙️ tray alert (tap to hear).
 * Rides the existing media upload + messages + push pipeline.
 * ============================================================ */
(function () {
  "use strict";

  var conv = null, myId = null, partnerName = "them";
  var ch = null, playEl = null, rec = null, stream = null, chunks = [], live = false, cancelled = false;
  var listeners = [];

  function emit(state) { listeners.forEach(function (f) { try { f(state); } catch (e) {} }); }
  function vibe(seq) { try { if (window.Native && Native.pattern) Native.pattern(seq); else if (navigator.vibrate) navigator.vibrate(seq); } catch (e) {} }

  function playPath(path) {
    try {
      SP.media.signedUrl(path, 600).then(function (r) {
        if (!r || !r.data) return;
        try { if (playEl) { playEl.pause(); } } catch (e) {}
        playEl = new Audio(r.data);
        playEl.volume = 1;
        var p = playEl.play(); if (p && p.catch) p.catch(function () {
          if (window.toast) toast("\uD83C\uDF99\uFE0F " + partnerName + " spoke \u2014 open the chat to listen");
        });
      });
    } catch (e) {}
  }

  function bubblePulse() {
    try { var C = window.Capacitor; if (C && C.Plugins && C.Plugins.SoulBubble) C.Plugins.SoulBubble.pulse(); } catch (e) {}
  }
  function onIncoming(m) {
    if (!m || m.uid === myId || m.deleted) return;
    bubblePulse(); // her light stirs, whatever she sent
    if (m.type !== "ptt") return;
    vibe([90, 60, 90, 60, 190]); // the PTT signature — unmistakable
    if (window.toast) toast("\uD83C\uDF99\uFE0F " + (m.name || partnerName) + " is speaking\u2026");
    if (m.url) playPath(m.url);
  }

  function subscribe() {
    if (ch || !conv || !window.SP || !SP._sb) return;
    try {
      ch = SP._sb.channel("pttrx:" + conv)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: "conv_id=eq." + conv },
          function (pl) { onIncoming(pl && pl.new); })
        .subscribe();
    } catch (e) {}
  }

  async function init() {
    try {
      myId = APP.me.id;
      var r = await SP.contacts.list();
      var c = (r && r.data && r.data[0]) || null;
      if (!c) return false;
      partnerName = c.contact_name || c.name || "them";
      conv = SP.convIdFor(myId, c.contact_uid);
      subscribe();
      return true;
    } catch (e) { return false; }
  }

  async function start() {
    if (live) return;
    if (!conv) { var ok = await init(); if (!ok) { if (window.toast) toast("Bond with a soul first \u2726"); return; } }
    if (!navigator.mediaDevices || !window.MediaRecorder) { if (window.toast) toast("Voice isn't supported here.", true); return; }
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (e) { if (window.toast) toast("Microphone permission needed.", true); return; }
    var mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
    chunks = []; cancelled = false;
    rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = async function () {
      try { stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
      live = false; emit("idle");
      if (cancelled || !chunks.length) { vibe([25]); return; }
      var blob = new Blob(chunks, { type: (rec && rec.mimeType) || "audio/webm" });
      if (blob.size < 900) return; // too short — a graze, not a word
      var file = window.File ? new File([blob], "ptt.webm", { type: blob.type }) : blob;
      try {
        var up = await SP.media.upload(conv, file);
        if (up && up.data && up.data.path) {
          await SP.chat.send(conv, { type: "ptt", url: up.data.path, text: "\uD83C\uDF99\uFE0F" });
          vibe([40, 60, 110]); // whoosh — it flew
        }
      } catch (e) { if (window.toast) toast("Couldn't send.", true); }
    };
    rec.start();
    live = true; emit("live");
    vibe([35]); // press confirmation
  }

  function stop(cancel) {
    if (!live || !rec) return;
    cancelled = !!cancel;
    try { rec.stop(); } catch (e) { live = false; emit("idle"); }
  }

  window.PTT = {
    start: start,
    stop: stop,
    isLive: function () { return live; },
    onState: function (f) { if (typeof f === "function") listeners.push(f); },
  };

  // arm the global receiver once logged in
  try {
    var T = (typeof setInterval === "function") ? setInterval : (window.setInterval ? window.setInterval.bind(window) : null);
    var CI = (typeof clearInterval === "function") ? clearInterval : (window.clearInterval ? window.clearInterval.bind(window) : null);
    if (T) {
      var tries = 0;
      var iv = T(function () {
        tries++;
        if (window.APP && APP.me) { CI(iv); init(); }
        else if (tries > 60) CI(iv);
      }, 2500);
    }
  } catch (e) {}
})();
