/* ============================================================
 * SPURANA · core/native.js — native-shell behavior (Capacitor).
 * Makes the Android app FEEL native:
 *  · Back button navigates screens (history), minimizes at root
 *    instead of killing the app.
 *  · Status bar styled to the void theme (light icons on #060409).
 *  · Splash hides once the app has painted.
 *  · window.Native.keepAwake(on) — screen stays on during
 *    meditation (web Wake Lock; no extra plugin needed).
 * Safe no-op in the plain browser.
 * ============================================================ */
(function () {
  "use strict";

  var Cap = window.Capacitor;
  var P = (Cap && Cap.Plugins) || {};
  var isNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());

  // ── wake lock (works in Android WebView + Chrome) ──
  var lock = null, wantAwake = false;
  function keepAwake(on) {
    wantAwake = !!on;
    try {
      if (on) {
        if (!("wakeLock" in navigator) || lock) return;
        navigator.wakeLock.request("screen").then(function (l) {
          lock = l;
          l.addEventListener("release", function () { lock = null; });
        }).catch(function () {});
      } else if (lock) { lock.release().catch(function () {}); lock = null; }
    } catch (e) {}
  }
  // re-acquire if the user switches away and back mid-session
  document.addEventListener("visibilitychange", function () {
    if (wantAwake && document.visibilityState === "visible" && !lock) keepAwake(true);
  });


  // ── geolocation bridge: native plugin on device, browser API on web ──
  function geoCurrent(ok, er) {
    try {
      if (isNative && P.Geolocation && P.Geolocation.getCurrentPosition) {
        P.Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 })
          .then(function (pos) { ok(pos); }).catch(function (e) { er && er(e); });
        return;
      }
      if (navigator.geolocation) navigator.geolocation.getCurrentPosition(ok, er, { enableHighAccuracy: false, maximumAge: 60000, timeout: 12000 });
      else er && er(new Error("no geolocation"));
    } catch (e) { er && er(e); }
  }
  function geoWatch(cb, er) {
    var h = { id: null, web: false, stop: function () {} };
    try {
      if (isNative && P.Geolocation && P.Geolocation.watchPosition) {
        P.Geolocation.watchPosition({ enableHighAccuracy: true, timeout: 20000 }, function (pos, e) {
          if (e) { er && er(e); return; } if (pos) cb(pos);
        }).then(function (id) { h.id = id; });
        h.stop = function () { try { if (h.id != null) P.Geolocation.clearWatch({ id: h.id }); } catch (e) {} };
        return h;
      }
      if (navigator.geolocation) {
        h.web = true;
        h.id = navigator.geolocation.watchPosition(cb, er, { enableHighAccuracy: false, maximumAge: 20000, timeout: 15000 });
        h.stop = function () { try { navigator.geolocation.clearWatch(h.id); } catch (e) {} };
        return h;
      }
      er && er(new Error("no geolocation"));
    } catch (e) { er && er(e); }
    return h;
  }

  window.Native = { isNative: isNative, keepAwake: keepAwake, geoCurrent: geoCurrent, geoWatch: geoWatch };

  if (!isNative) return; // browser: nothing else to do

  // ── Android back button: navigate back, minimize at the root ──
  try {
    if (P.App && P.App.addListener) {
      P.App.addListener("backButton", function (ev) {
        if (ev && ev.canGoBack) window.history.back();
        else if (P.App.minimizeApp) P.App.minimizeApp();
      });
    }
  } catch (e) {}

  // ── status bar: void-dark with light icons ──
  try {
    if (P.StatusBar) {
      if (P.StatusBar.setOverlaysWebView) P.StatusBar.setOverlaysWebView({ overlay: false });
      if (P.StatusBar.setBackgroundColor) P.StatusBar.setBackgroundColor({ color: "#060409" });
      if (P.StatusBar.setStyle) P.StatusBar.setStyle({ style: "DARK" });
    }
  } catch (e) {}

  // ── hide the splash once we've painted ──
  try {
    if (P.SplashScreen && P.SplashScreen.hide) {
      setTimeout(function () { P.SplashScreen.hide(); }, 350);
    }
  } catch (e) {}
})();
