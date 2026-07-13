/* ============================================================
 * SPURANA · core/bubble.js — Soul Bubble (JS side).
 * Talks to the native SoulBubble plugin: overlay permission,
 * foreground service start/stop, and routing when the floating
 * head is tapped from another app. Native only; no-op on web.
 * ============================================================ */
(function () {
  "use strict";

  var KEY = "spurana.bubble";

  function SB() {
    var C = window.Capacitor;
    if (!(C && C.isNativePlatform && C.isNativePlatform())) return null;
    return (C.Plugins && C.Plugins.SoulBubble) || null;
  }
  function enabled() { try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; } }

  async function setEnabled(v) {
    var sb = SB();
    if (!sb) { if (window.toast) toast("Native app only.", true); return false; }
    if (!v) {
      try { await sb.stop(); } catch (e) {}
      try { localStorage.setItem(KEY, "0"); } catch (e) {}
      if (window.toast) toast("The bubble rests.");
      return true;
    }
    try {
      var c = await sb.canDraw();
      if (!c || !c.granted) {
        if (window.toast) toast("Allow \u201cDisplay over other apps\u201d for Spurana, then come back \u2726");
        await sb.requestPermission();
        return false; // user grants in system settings; toggle again after
      }
      await sb.start();
      try { localStorage.setItem(KEY, "1"); } catch (e) {}
      try { if (window.Native && Native.pattern) Native.pattern([40, 60, 90]); } catch (e) {}
      if (window.toast) toast("Her light now floats above everything \u2726");
      return true;
    } catch (e) { if (window.toast) toast("Couldn't start the bubble.", true); return false; }
  }

  async function routeFromBubble() {
    var sb = SB(); if (!sb) return;
    try { sb.calm(); } catch (e) {}
    try {
      var r = await sb.getLaunchRoute();
      if (r && r.route) {
        var route = r.route;
        if (route === "chat") { try { Router.go("chat"); } catch (e) {} }
        else if (route === "buzz") { try { Router.go("buzz"); } catch (e) {} }
        else if (route === "akash") { try { Router.go("akash"); } catch (e) {} }
        else if (route === "antor") { try { Router.go("antor"); } catch (e) {} }
      }
    } catch (e) {}
  }

  window.SoulBubbleJS = { enabled: enabled, setEnabled: setEnabled, available: function () { return !!SB(); } };

  // auto-restart the bubble on app open if it was enabled; catch bubble-tap routes
  try {
    var T = (typeof setInterval === "function") ? setInterval : (window.setInterval ? window.setInterval.bind(window) : null);
    var CI = (typeof clearInterval === "function") ? clearInterval : (window.clearInterval ? window.clearInterval.bind(window) : null);
    if (T && SB()) {
      var tries = 0;
      var iv = T(function () {
        tries++;
        if (window.APP && APP.me) {
          CI(iv);
          routeFromBubble();
          if (enabled()) {
            SB().isRunning().then(function (r) { if (!r || !r.running) SB().start().catch(function () {}); }).catch(function () {});
          }
        } else if (tries > 60) CI(iv);
      }, 1500);
      var C = window.Capacitor;
      if (C && C.Plugins && C.Plugins.App && C.Plugins.App.addListener) {
        C.Plugins.App.addListener("resume", routeFromBubble);
      }
    }
  } catch (e) {}
})();
