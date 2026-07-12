/* ============================================================
 * SPURANA · connect/tides.js — SOUL TIDES (mutual & visible).
 * Shares the living state of YOUR world with your bonded soul —
 * battery, charging, screen-active, stillness, time-in-Spurana —
 * and receives theirs. Both know it's on; either can turn it off.
 * This is care, not surveillance: you feel when her light runs
 * low, when she plugs in to rest, when she's gone still for the
 * night. Foreground-honest; no silent sensors, ever.
 * ============================================================ */
(function () {
  "use strict";

  var KEY = "spurana.tides";
  var ACC = "spurana.tides.acc."; // active-seconds accumulator per day
  var myId = null, partnerUid = null, partnerName = "them";
  var batt = null, pushTimer = null, accTimer = null, lastLowAlert = 0;
  var theirCh = null, listeners = [];
  var lastState = {};

  function on() { try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; } }
  function vibe(seq) { try { if (window.Native && Native.pattern) Native.pattern(seq); else if (navigator.vibrate) navigator.vibrate(seq); } catch (e) {} }
  function today() { return new Date().toISOString().slice(0, 10); }

  function accGet() { try { var o = JSON.parse(localStorage.getItem(ACC + today()) || "0"); return o | 0; } catch (e) { return 0; } }
  function accAdd(s) { try { localStorage.setItem(ACC + today(), String(accGet() + s)); } catch (e) {} }

  /* ── motion: coarse still/moving from device acceleration ── */
  var motion = null, moBuf = [];
  function armMotion() {
    if (typeof window.addEventListener !== "function" || !window.DeviceMotionEvent) return;
    try {
      window.addEventListener("devicemotion", function (e) {
        var a = e.accelerationIncludingGravity || e.acceleration; if (!a) return;
        var mag = Math.abs(a.x || 0) + Math.abs(a.y || 0) + Math.abs(a.z || 0);
        moBuf.push(mag); if (moBuf.length > 12) moBuf.shift();
        if (moBuf.length >= 6) {
          var mean = moBuf.reduce(function (s, v) { return s + v; }, 0) / moBuf.length;
          var varc = moBuf.reduce(function (s, v) { return s + (v - mean) * (v - mean); }, 0) / moBuf.length;
          motion = varc > 1.2 ? "moving" : "still";
        }
      }, { passive: true });
    } catch (e) {}
  }

  async function readBattery() {
    if (batt) return batt;
    try { if (navigator.getBattery) batt = await navigator.getBattery(); } catch (e) { batt = null; }
    return batt;
  }

  async function push() {
    if (!on() || !myId || !window.SP || !SP._sb) return;
    var b = await readBattery();
    var state = {
      uid: myId,
      battery: b ? Math.round(b.level * 100) : null,
      charging: b ? !!b.charging : null,
      active: (document.visibilityState === "visible"),
      motion: motion,
      active_seconds_today: accGet(),
      updated_at: new Date().toISOString(),
    };
    // only write when something meaningful changed (or every ~2 min)
    var sig = state.battery + "|" + state.charging + "|" + state.active + "|" + state.motion;
    if (sig === lastState.sig && Date.now() - (lastState.at || 0) < 120000) return;
    lastState = { sig: sig, at: Date.now() };
    try { SP._sb.from("soul_state").upsert(state, { onConflict: "uid" }).then(function () {}); } catch (e) {}
  }

  /* ── receive their tide + low-battery care alert ── */
  function emit(s) { listeners.forEach(function (f) { try { f(s); } catch (e) {} }); }
  function onTheirs(s) {
    if (!s) return;
    emit(s);
    // gentle care alert: their light is running low
    if (on() && typeof s.battery === "number" && s.battery <= 15 && !s.charging) {
      if (Date.now() - lastLowAlert > 1800000) { // at most every 30 min
        lastLowAlert = Date.now();
        vibe([60, 80, 60]);
        if (window.toast) toast("\uD83D\uDD0B " + partnerName + "'s light is at " + s.battery + "% \u2014 remind them to charge \u2726");
      }
    }
  }
  function armReceiver() {
    if (theirCh || !partnerUid || !SP._sb) return;
    // prime with current value
    try { SP._sb.from("soul_state").select("*").eq("uid", partnerUid).maybeSingle().then(function (r) { if (r && r.data) onTheirs(r.data); }); } catch (e) {}
    theirCh = SP._sb.channel("tides:" + partnerUid)
      .on("postgres_changes", { event: "*", schema: "public", table: "soul_state", filter: "uid=eq." + partnerUid }, function (pl) { onTheirs(pl && pl.new); })
      .subscribe();
  }

  async function resolve() {
    try {
      myId = APP.me.id;
      var r = await SP.contacts.list();
      var c = (r && r.data && r.data[0]) || null;
      if (!c) return false;
      partnerUid = c.contact_uid; partnerName = c.contact_name || c.name || "them";
      return true;
    } catch (e) { return false; }
  }

  function start() {
    armMotion();
    accTimer = setInterval(function () { if (document.visibilityState === "visible") accAdd(20); }, 20000);
    pushTimer = setInterval(push, 20000);
    push();
  }
  function stop() {
    try { clearInterval(pushTimer); } catch (e) {} pushTimer = null;
    try { clearInterval(accTimer); } catch (e) {} accTimer = null;
  }

  window.Tides = {
    on: on,
    set: function (v) { try { localStorage.setItem(KEY, v ? "1" : "0"); } catch (e) {} if (v) { start(); if (window.toast) toast("Soul Tides flowing \u2014 " + partnerName + " feels your world too \u2726"); } else { stop(); if (window.toast) toast("Tides stilled."); } },
    onTheirs: function (f) { if (typeof f === "function") listeners.push(f); },
    partnerName: function () { return partnerName; },
    resolve: resolve,
    myActiveMinutes: function () { return Math.round(accGet() / 60); },
  };

  // ignite once logged in
  try {
    var T = (typeof setInterval === "function") ? setInterval : (window.setInterval ? window.setInterval.bind(window) : null);
    var CI = (typeof clearInterval === "function") ? clearInterval : (window.clearInterval ? window.clearInterval.bind(window) : null);
    if (T) {
      var tries = 0;
      var iv = T(function () {
        tries++;
        if (window.APP && APP.me) { CI(iv); resolve().then(function (ok) { if (ok) { armReceiver(); if (on()) start(); } }); }
        else if (tries > 60) CI(iv);
      }, 2500);
    }
  } catch (e) {}
})();
