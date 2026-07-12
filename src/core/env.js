/* ============================================================
 * SPURANA · core/env.js — the LIVING ENVIRONMENT ENGINE (V3).
 * The day is six 4-hour slots; each holds a pool of named
 * environments. As real time crosses a boundary, the whole app
 * breathes into the next env — palette, gradients, background,
 * music mood — chosen by a shuffle-bag (no repeats until a
 * slot's whole pool has lived), bent by live weather (rain
 * summons বৃষ্টি in any slot), pinnable by hand in Settings.
 * Also owns: the global Music engine (env-driven) and the
 * animated boot veil. Everything guarded; no-op safe anywhere.
 * ============================================================ */
(function () {
  "use strict";

  /* ── the library ─────────────────────────────────────────
     g1/g2: gradient auras · q/qb/gold/goldb: palette shift
     music: YouTube pools · wx: weather tag · slots: 0..5     */
  var E = [
    // 00–04 · the deep night
    { id: "nishith",  bn: "\u09a8\u09bf\u09b6\u09c0\u09a5", en: "Deep Night", slots: [0], g1: "rgba(120,46,170,.30)", g2: "rgba(232,0,154,.16)", q: "#B0009A", qb: "#D400C8", gold: "#B79A6B", goldb: "#D8BC85", music: ["1ZYbU82GVz4", "V-_O7nl0Ii0"] },
    { id: "tara",     bn: "\u09a4\u09be\u09b0\u09be\u0996\u099a\u09bf\u09a4", en: "Star-Strewn", slots: [0], g1: "rgba(40,60,160,.34)", g2: "rgba(180,60,220,.18)", q: "#8E4BD0", qb: "#B06CF0", gold: "#AEB6D8", goldb: "#D3D9F2", music: ["WkQXKt9-ym0", "1ZYbU82GVz4"] },
    { id: "chandra",  bn: "\u099a\u09a8\u09cd\u09a6\u09cd\u09b0\u09b9\u09be\u09b0", en: "Moon-Necklace", slots: [0, 5], g1: "rgba(150,170,220,.26)", g2: "rgba(232,0,154,.14)", q: "#C0007A", qb: "#E8009A", gold: "#C9CEDD", goldb: "#EAF0FF", music: ["V-_O7nl0Ii0"] },
    // 04–08 · dawn
    { id: "bhor",     bn: "\u09ad\u09cb\u09b0", en: "First Light", slots: [1], g1: "rgba(255,150,90,.30)", g2: "rgba(232,0,154,.20)", q: "#D6407E", qb: "#FF6AA8", gold: "#E0B080", goldb: "#FFD9A8", music: ["DWcJFNfaw9c", "lTRiuFIWV54"] },
    { id: "kuheli",   bn: "\u0995\u09c1\u09b9\u09c7\u09b2\u09bf", en: "Dawn Mist", slots: [1], wx: "mist", g1: "rgba(120,170,170,.30)", g2: "rgba(200,220,220,.18)", q: "#7FAFAF", qb: "#A8D8D4", gold: "#C6C2A8", goldb: "#E6E2C8", music: ["1ZYbU82GVz4"] },
    { id: "ushar",    bn: "\u098a\u09b7\u09be\u09b0 \u0986\u09b2\u09cb", en: "Amber Waking", slots: [1], g1: "rgba(226,160,60,.30)", g2: "rgba(232,0,154,.18)", q: "#D06A3A", qb: "#F09055", gold: "#D8A860", goldb: "#F5CC8A", music: ["DWcJFNfaw9c"] },
    // 08–12 · morning
    { id: "shonali",  bn: "\u09b8\u09cb\u09a8\u09be\u09b2\u09c0 \u09b8\u0995\u09be\u09b2", en: "Golden Morning", slots: [2], g1: "rgba(201,169,110,.34)", g2: "rgba(232,0,154,.16)", q: "#C0007A", qb: "#E8009A", gold: "#C9A96E", goldb: "#E2C28A", music: ["jfKfPfyJRdk", "rUxyKA_-grg"] },
    { id: "nabanno",  bn: "\u09a8\u09ac\u09be\u09a8\u09cd\u09a8", en: "Harvest Green", slots: [2], g1: "rgba(90,170,110,.28)", g2: "rgba(201,169,110,.20)", q: "#3FA070", qb: "#5CC890", gold: "#BBA96E", goldb: "#DCC98A", music: ["5qap5aO4i9A"] },
    { id: "akashnil", bn: "\u0986\u0995\u09be\u09b6\u09a8\u09c0\u09b2", en: "Sky-Blue Hour", slots: [2, 3], g1: "rgba(70,140,220,.28)", g2: "rgba(232,0,154,.16)", q: "#3E7CC8", qb: "#5C9FEF", gold: "#B8C4D8", goldb: "#DCE7F5", music: ["rUxyKA_-grg"] },
    // 12–16 · midday
    { id: "modhyanno", bn: "\u09ae\u09a7\u09cd\u09af\u09be\u09b9\u09cd\u09a8", en: "High Noon", slots: [3], g1: "rgba(240,220,170,.30)", g2: "rgba(232,0,154,.14)", q: "#C0007A", qb: "#E8009A", gold: "#D6B677", goldb: "#F2D79A", music: ["jfKfPfyJRdk"] },
    { id: "roudra",   bn: "\u09b0\u09cc\u09a6\u09cd\u09b0", en: "Sunfire", slots: [3], g1: "rgba(235,150,50,.32)", g2: "rgba(232,0,80,.18)", q: "#E05A2A", qb: "#FF7E45", gold: "#E0A860", goldb: "#FFCC85", music: ["5qap5aO4i9A"] },
    { id: "meghchhaya", bn: "\u09ae\u09c7\u0998\u099b\u09be\u09df\u09be", en: "Cloud-Shade", slots: [3, 4], wx: "cloud", g1: "rgba(120,130,160,.30)", g2: "rgba(232,0,154,.14)", q: "#8A7FA8", qb: "#AB9FD0", gold: "#B9B4C4", goldb: "#DAD5E5", music: ["1ZYbU82GVz4"] },
    // 16–20 · dusk (godhuli — the cow-dust hour)
    { id: "godhuli",  bn: "\u0997\u09cb\u09a7\u09c2\u09b2\u09bf", en: "Cow-Dust Hour", slots: [4], g1: "rgba(255,110,60,.34)", g2: "rgba(232,0,154,.26)", q: "#E0407A", qb: "#FF6AA0", gold: "#E0A060", goldb: "#FFC585", music: ["S_MOd40zlYU", "t_zm0nLezDI"] },
    { id: "kone",     bn: "\u0995\u09a8\u09c7\u09a6\u09c7\u0996\u09be \u0986\u09b2\u09cb", en: "Bride-Viewing Light", slots: [4], g1: "rgba(240,120,150,.30)", g2: "rgba(201,169,110,.20)", q: "#D6507E", qb: "#F878A8", gold: "#D8AE7E", goldb: "#F5D0A0", music: ["t_zm0nLezDI"] },
    { id: "agni",     bn: "\u0985\u0997\u09cd\u09a8\u09bf\u09b8\u09a8\u09cd\u09a7\u09cd\u09af\u09be", en: "Fire Dusk", slots: [4], g1: "rgba(220,50,60,.32)", g2: "rgba(150,20,120,.24)", q: "#D42A50", qb: "#F84A72", gold: "#D89A5A", goldb: "#F8BE7E", music: ["FjHGZj2IjBk"] },
    // 20–24 · evening
    { id: "pradip",   bn: "\u09b8\u09a8\u09cd\u09a7\u09cd\u09af\u09be\u09aa\u09cd\u09b0\u09a6\u09c0\u09aa", en: "Evening Lamp", slots: [5], g1: "rgba(201,140,60,.30)", g2: "rgba(120,46,170,.24)", q: "#B24A9A", qb: "#D96CC0", gold: "#D2A868", goldb: "#F0C990", music: ["S_MOd40zlYU"] },
    { id: "purnima",  bn: "\u09aa\u09c2\u09b0\u09cd\u09a3\u09bf\u09ae\u09be", en: "Full Moon", slots: [5], g1: "rgba(170,190,240,.28)", g2: "rgba(232,0,154,.18)", q: "#9C6BD0", qb: "#BE8FF2", gold: "#C8CFE6", goldb: "#EAF0FF", music: ["V-_O7nl0Ii0", "WkQXKt9-ym0"] },
    { id: "raag",     bn: "\u09b0\u09be\u09a4\u09cd\u09b0\u09bf\u09b0\u09be\u0997", en: "Night R\u0101ga", slots: [5], g1: "rgba(200,0,140,.30)", g2: "rgba(80,20,120,.26)", q: "#C0007A", qb: "#FF00B0", gold: "#C9A96E", goldb: "#E2C28A", music: ["FjHGZj2IjBk", "1ZYbU82GVz4"] },
    // weather-born (any slot when the sky insists)
    { id: "brishti",  bn: "\u09ac\u09c3\u09b7\u09cd\u099f\u09bf", en: "Rainfall", slots: [0,1,2,3,4,5], wx: "rain", g1: "rgba(60,120,180,.34)", g2: "rgba(90,200,200,.20)", q: "#3E88B8", qb: "#5FB0E0", gold: "#9CB8C8", goldb: "#C4DEEC", music: ["jfKfPfyJRdk", "1ZYbU82GVz4"] },
    { id: "jhor",     bn: "\u099d\u09dc", en: "Storm", slots: [0,1,2,3,4,5], wx: "storm", g1: "rgba(90,40,180,.20)", g2: "rgba(232,0,120,.24)", q: "#7A3AE0", qb: "#9C5CFF", gold: "#B8A8D8", goldb: "#DACCF5", music: ["WkQXKt9-ym0"] },
  ];

  var PIN = "spurana.env.pin", LAST = "spurana.env.last", BAG = "spurana.env.bag.";
  var WXK = "spurana.env.wx";
  var cur = null, layers = null, flip = false, listeners = [];
  var LS = { g: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
             s: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  function slotOf(h) { return Math.floor(h / 4); }
  function byId(id) { for (var i = 0; i < E.length; i++) if (E[i].id === id) return E[i]; return null; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* ── weather (cached 30 min; classifies the sky) ── */
  function wxClass(code) {
    if (code >= 95) return "storm";
    if (code >= 51 && code <= 82) return "rain";
    if (code >= 45 && code <= 48) return "mist";
    if (code >= 1 && code <= 3) return "cloud";
    return "clear";
  }
  function refreshWx() {
    try {
      var c = LS.g(WXK); if (c) { c = JSON.parse(c); if (Date.now() - c.at < 1800000) return; }
    } catch (e) {}
    var GP = (window.Native && Native.geoCurrent) ? Native.geoCurrent
      : (navigator.geolocation ? function (ok, er) { navigator.geolocation.getCurrentPosition(ok, er, { timeout: 6000, maximumAge: 1800000 }); } : null);
    if (!GP || typeof fetch !== "function") return;
    try {
      GP(function (pos) {
        var la = pos.coords.latitude.toFixed(2), lo = pos.coords.longitude.toFixed(2);
        fetch("https://api.open-meteo.com/v1/forecast?latitude=" + la + "&longitude=" + lo + "&current=weather_code")
          .then(function (r) { return r.json(); })
          .then(function (j) {
            var code = j && j.current && j.current.weather_code;
            LS.s(WXK, JSON.stringify({ at: Date.now(), cls: wxClass(code || 0) }));
          }).catch(function () {});
      }, function () {});
    } catch (e) {}
  }
  function wxNow() { try { var c = JSON.parse(LS.g(WXK) || "null"); return (c && c.cls) || "clear"; } catch (e) { return "clear"; } }

  /* ── shuffle-bag: no repeats until the pool has lived ── */
  function poolFor(slot, wx) {
    var wxPicks = E.filter(function (e) { return e.wx === wx && e.slots.indexOf(slot) > -1; });
    if ((wx === "rain" || wx === "storm" || wx === "mist") && wxPicks.length) return { key: slot + ":" + wx, ids: wxPicks.map(function (e) { return e.id; }) };
    var base = E.filter(function (e) { return !e.wx && e.slots.indexOf(slot) > -1; });
    if (!base.length) base = E.filter(function (e) { return !e.wx; });
    return { key: String(slot), ids: base.map(function (e) { return e.id; }) };
  }
  function drawFrom(slot, wx) {
    var p = poolFor(slot, wx), k = BAG + p.key, bag;
    try { bag = JSON.parse(LS.g(k) || "null"); } catch (e) { bag = null; }
    if (!bag || !bag.length) {
      bag = shuffle(p.ids);
      var last = LS.g(LAST);
      if (bag.length > 1 && bag[0] === last) { bag.push(bag.shift()); } // never the same twice in a row
    }
    var id = bag.shift();
    LS.s(k, JSON.stringify(bag));
    LS.s(LAST, id);
    return byId(id) || E[0];
  }

  /* ── the painted world: css vars + dual-layer crossfade ── */
  function ensureLayers() {
    if (layers || !document.body) return;
    var wrap = document.createElement("div");
    wrap.id = "envBg";
    var a = document.createElement("div"), b = document.createElement("div");
    a.className = "env-layer on"; b.className = "env-layer";
    wrap.appendChild(a); wrap.appendChild(b);
    document.body.appendChild(wrap);
    layers = [a, b];
  }
  function paint(env, animate) {
    var r = document.documentElement;
    try {
      r.style.setProperty("--q", env.q);
      r.style.setProperty("--q-bright", env.qb);
      r.style.setProperty("--gold", env.gold);
      r.style.setProperty("--gold-bright", env.goldb);
      r.style.setProperty("--env-g1", env.g1);
      r.style.setProperty("--env-g2", env.g2);
      r.setAttribute("data-env", env.id);
    } catch (e) {}
    ensureLayers();
    if (layers) {
      var g = "radial-gradient(120% 85% at 50% 0%," + env.g1 + ",transparent 58%)," +
              "radial-gradient(120% 80% at 50% 100%," + env.g2 + ",transparent 60%)";
      var inL = layers[flip ? 0 : 1], outL = layers[flip ? 1 : 0];
      inL.style.background = g;
      if (animate) { inL.classList.add("on"); outL.classList.remove("on"); }
      else { inL.classList.add("on"); outL.classList.remove("on"); }
      flip = !flip;
    }
    cur = env;
    listeners.forEach(function (f) { try { f(env); } catch (e) {} });
    try { if (window.Music && Music.setPool && Music.isPlaying()) Music.setPool(env.music); } catch (e) {}
  }

  function choose(animate) {
    var pin = LS.g(PIN);
    var env = pin ? byId(pin) : null;
    if (!env) env = drawFrom(slotOf(new Date().getHours()), wxNow());
    paint(env, animate !== false);
  }

  /* ── the engine clock ── */
  var lastSlot = slotOf(new Date().getHours());
  function tick() {
    refreshWx();
    var s = slotOf(new Date().getHours());
    if (s !== lastSlot) { lastSlot = s; if (!LS.g(PIN)) choose(true); }
  }

  window.Env = {
    list: function () { return E.slice(); },
    current: function () { return cur; },
    pinned: function () { return LS.g(PIN); },
    pin: function (id) {
      if (!id) { try { localStorage.removeItem(PIN); } catch (e) {} choose(true); return; }
      var e = byId(id); if (!e) return;
      LS.s(PIN, id); paint(e, true);
    },
    next: function () { try { localStorage.removeItem(PIN); } catch (e) {} choose(true); },
    onChange: function (f) { if (typeof f === "function") listeners.push(f); },
  };

  /* ── the global Music engine (env-driven, persistent) ── */
  (function () {
    var host = null, player = null, queue = [], idx = 0, playing = false, mls = [];
    function memit() { mls.forEach(function (f) { try { f(playing); } catch (e) {} }); }
    function ensureHost() {
      if (host || !document.body) return;
      host = document.createElement("div");
      host.id = "globalMusic";
      host.style.cssText = "position:fixed;width:1px;height:1px;left:-20px;bottom:-20px;opacity:0;pointer-events:none;z-index:-1";
      var inner = document.createElement("div"); inner.id = "globalMusicYT";
      host.appendChild(inner); document.body.appendChild(host);
    }
    function loadYT(cb) {
      if (window.YT && window.YT.Player) { cb(); return; }
      var prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () { if (prev) try { prev(); } catch (e) {} cb(); };
      if (!document.getElementById("yt-api")) { var s = document.createElement("script"); s.id = "yt-api"; s.src = "https://www.youtube.com/iframe_api"; document.body.appendChild(s); }
    }
    function start(ids) {
      ensureHost();
      queue = (ids && ids.length) ? ids.slice() : ((cur && cur.music) || ["jfKfPfyJRdk"]);
      idx = 0; playing = true; memit();
      loadYT(function () {
        if (!player) {
          player = new YT.Player("globalMusicYT", {
            height: "1", width: "1",
            playerVars: { autoplay: 1, controls: 0, playsinline: 1 },
            events: {
              onReady: function (e) { e.target.setVolume(40); e.target.loadVideoById(queue[idx]); e.target.playVideo(); },
              onError: function () { idx++; if (idx < queue.length && player) player.loadVideoById(queue[idx]); else { playing = false; memit(); } },
              onStateChange: function (e) { if (e.data === YT.PlayerState.ENDED) { idx = (idx + 1) % queue.length; player.loadVideoById(queue[idx]); } },
            },
          });
        } else { player.setVolume(40); player.loadVideoById(queue[idx]); player.playVideo(); }
      });
    }
    function stop() { try { if (player && player.stopVideo) player.stopVideo(); } catch (e) {} playing = false; memit(); }
    window.Music = {
      start: start, stop: stop,
      isPlaying: function () { return playing; },
      toggleMood: function () { if (playing) { stop(); return false; } start(null); return true; },
      setPool: function (ids) { if (!ids || !ids.length) return; queue = ids.slice(); idx = 0; if (playing && player) { try { player.loadVideoById(queue[0]); } catch (e) {} } },
      setVolume: function (v) { try { if (player) player.setVolume(v); } catch (e) {} },
      onChange: function (f) { if (typeof f === "function") mls.push(f); },
      moodIds: function () { return ((cur && cur.music) || []).slice(); },
    };
  })();

  /* ── boot veil: the V1 SPURANA logo, layered color by timezone ── */
  (function () {
    if (!document.body) return;
    try {
      // resolve the current env's palette so the logo wears the hour's colors
      var env = (window.Env && Env.current && Env.current()) || null;
      var c1 = (env && env.qb) || "#E8009A";
      var c2 = (env && env.goldb) || "#E2C28A";
      var c3 = (env && env.q) || "#B0009A";
      var v = document.createElement("div");
      v.id = "bootVeil";
      // layered wordmark: three offset color strata (the V1 signature)
      var word = '<div class="bv-logo">' +
          '<span class="bv-layer l1" style="color:' + c3 + '">SPURANA</span>' +
          '<span class="bv-layer l2" style="color:' + c2 + '">SPURANA</span>' +
          '<span class="bv-layer l3" style="background:linear-gradient(115deg,' + c2 + ',' + c1 + ' 60%,' + c3 + ');-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent">SPURANA</span>' +
        '</div>';
      v.innerHTML = word + '<div class="bv-sub">Spuran \u00b7 a sacred space for two souls</div>';
      document.body.appendChild(v);
      var gone = false;
      function lift() {
        if (gone) return; gone = true;
        v.classList.add("lift");
        setTimeout(function () { try { v.remove(); } catch (e) {} }, 1000);
      }
      window.addEventListener("hashchange", lift, { once: true });
      setTimeout(lift, 2600);
    } catch (e) {}
  })();

  /* ── ignition ── */
  try {
    refreshWx();
    choose(false);
    var T = (typeof setInterval === "function") ? setInterval : (window.setInterval ? window.setInterval.bind(window) : null);
    if (T) T(tick, 30000);
  } catch (e) {}
})();
