/* ============================================================
 * SPURANA · connect/soulloc.js — Soul Location (global sharer).
 * Opt-in. While the app is open and sharing is ON, your position
 * is kept fresh in the private `locations` row only your bonded
 * soul can read (RLS). Runs across screens; the Track Souls page
 * is just the window into it. Foreground only — a web/Capacitor
 * app cannot track with the app closed, and we don't pretend to.
 * ============================================================ */
(function () {
  "use strict";

  var KEY = "spurana.soulloc";
  var watch = null, mine = null, lastUp = 0, lastLat = null, lastLng = null;
  var listeners = [];

  function on() { try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; } }
  function emit() { listeners.forEach(function (f) { try { f(mine, !!watch); } catch (e) {} }); }
  function moved(a1, o1, a2, o2) {
    if (a1 == null) return 1e9;
    var dx = (a2 - a1) * 111320, dy = (o2 - o1) * 111320 * Math.cos(a2 * Math.PI / 180);
    return Math.sqrt(dx * dx + dy * dy);
  }

  function push() {
    if (!mine || !window.APP || !APP.me || !window.SP || !SP._sb) return;
    var now = Date.now();
    if (now - lastUp < 15000 && moved(lastLat, lastLng, mine.lat, mine.lng) < 25) return;
    lastUp = now; lastLat = mine.lat; lastLng = mine.lng;
    try {
      SP._sb.from("locations").upsert({
        uid: APP.me.id, lat: mine.lat, lng: mine.lng, acc: mine.acc || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "uid" }).then(function () {});
    } catch (e) {}
  }

  function start() {
    if (watch || !window.Native) return;
    watch = Native.geoWatch(function (pos) {
      var c = pos && pos.coords; if (!c) return;
      mine = { lat: c.latitude, lng: c.longitude, acc: c.accuracy, ts: Date.now() };
      emit(); push();
    }, function () {
      if (window.toast) toast("Location permission needed.", true);
      stop(); try { localStorage.setItem(KEY, "0"); } catch (e) {}
      emit();
    });
    emit();
  }

  function stop() { try { if (watch && watch.stop) watch.stop(); } catch (e) {} watch = null; emit(); }

  window.SoulLoc = {
    on: on,
    mine: function () { return mine; },
    active: function () { return !!watch; },
    set: function (v) {
      try { localStorage.setItem(KEY, v ? "1" : "0"); } catch (e) {}
      if (v) start(); else stop();
    },
    onChange: function (f) { if (typeof f === "function") listeners.push(f); },
  };

  // auto-start after login if previously enabled (waits for APP.me)
  try {
    var T = (typeof setInterval === "function")
      ? { si: setInterval, ci: clearInterval }
      : (window.setInterval ? { si: window.setInterval.bind(window), ci: window.clearInterval.bind(window) } : null);
    if (T) {
      var tries = 0;
      var iv = T.si(function () {
        tries++;
        if (window.APP && APP.me) { T.ci(iv); if (on()) start(); }
        else if (tries > 40) T.ci(iv);
      }, 2500);
    }
  } catch (e) {}
})();
