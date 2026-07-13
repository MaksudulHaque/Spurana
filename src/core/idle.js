/* ============================================================
 * SPURANA · core/idle.js — the gentle idle veil.
 * After 60s of stillness, a soft sacred veil breathes in with a
 * single re-entry orb — the Spurana sigil inside a living gold-
 * magenta ring (never a plain star, never a solid blob). One
 * touch anywhere dissolves it and returns you exactly where you
 * were. Any real interaction resets the timer. Native + web.
 * ============================================================ */
(function () {
  "use strict";

  var IDLE_MS = 60000;      // 60s, per design
  var timer = null, veil = null, shown = false, enabled = true;

  function build() {
    if (veil) return veil;
    veil = document.createElement("div");
    veil.id = "idleVeil";
    var mark = (window.Brand ? Brand.sigil(64, true) : "\u2726");
    veil.innerHTML =
      '<div class="idle-ring">' +
      '<div class="idle-orb">' + mark + '</div>' +
      '</div>' +
      '<div class="idle-word">SPURANA</div>' +
      '<div class="idle-hint">touch to return</div>';
    document.body.appendChild(veil);
    // any pointer on the veil dismisses
    veil.addEventListener("pointerdown", function (e) { e.stopPropagation(); dismiss(); }, true);
    return veil;
  }

  function showVeil() {
    if (shown || !enabled) return;
    // don't cover full-screen live experiences OR the login/auth screens
    var h = (location.hash || "");
    if (/antor|akash|watch|listen|login|signup|awaken/.test(h)) return;
    // never show if the app hasn't actually rendered yet
    var app = document.getElementById("app");
    if (!app || !app.children || !app.children.length) return;
    // never show if the user isn't logged in
    if (!(window.APP && APP.me)) return;
    shown = true;
    build().classList.add("on");
  }
  function dismiss() {
    if (!shown) return;
    shown = false;
    if (veil) veil.classList.remove("on");
    reset();
  }

  function reset() {
    try { if (timer) clearTimeout(timer); } catch (e) {}
    if (!enabled) return;
    timer = setTimeout(showVeil, IDLE_MS);
  }

  window.Idle = {
    reset: reset,
    set: function (v) { enabled = !!v; if (!enabled) { dismiss(); if (timer) clearTimeout(timer); } else reset(); },
    setDelay: function (sec) { IDLE_MS = Math.max(15, sec | 0) * 1000; reset(); },
    enabled: function () { return enabled; },
  };

  // activity resets the idle clock (but a tap on the veil is handled above)
  try {
    ["pointerdown", "keydown", "touchstart", "wheel"].forEach(function (ev) {
      document.addEventListener(ev, function () { if (!shown) reset(); }, { passive: true });
    });
    window.addEventListener("hashchange", function () { dismiss(); reset(); });
    // load preference
    try { var p = localStorage.getItem("spurana.idle"); if (p === "0") enabled = false; } catch (e) {}
    reset();
  } catch (e) {}
})();
