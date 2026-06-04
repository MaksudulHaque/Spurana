/* ============================================================
 * SPURANA · core/audio.js
 * Tiny, lazy WebAudio cue helper (no preloaded media files).
 * Used for subtle send/receive blips. Stays silent until first
 * user gesture so mobile autoplay policies are respected.
 * ============================================================ */
(function () {
  "use strict";
  let ctx = null;
  function ensure() {
    if (ctx) return ctx;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
    return ctx;
  }
  function blip(freq, ms) {
    const c = ensure(); if (!c) return;
    if (c.state === "suspended") c.resume();
    const o = c.createOscillator(), g = c.createGain();
    o.frequency.value = freq || 660; o.type = "sine";
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.06, c.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + (ms || 120) / 1000);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + (ms || 120) / 1000 + 0.02);
  }
  window.Audio2 = {
    sent() { blip(720, 90); },
    received() { blip(520, 130); },
  };
})();
