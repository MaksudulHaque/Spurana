/* ============================================================
 * SPURANA · dash/self.js — The Dashboard of Self ("Atman").
 * The first thing after login: a living, time-and-weather hero
 * (clock, date, real weather), the day's sacred Invocation
 * (a rotating mantra/chant), and auto-tracked sacred goals
 * (Stillness + Union rings + a devotion streak) read from the
 * practice logs. Cinematic, fast, heart-touching. Then one tap
 * into the Sanctuary.
 * ============================================================ */
(function () {
  "use strict";

  // ── the day's invocations: a chant from many lineages, one per day ──
  var MANTRAS = [
    { chant: "Om", mean: "The primordial sound — the hum beneath all things.", preset: "om" },
    { chant: "Om Namah Shivaya", mean: "I bow to the Self within.", preset: "om" },
    { chant: "So Ham", mean: "I am That. The breath's own song.", preset: "om" },
    { chant: "Om Mani Padme Hum", mean: "The jewel in the lotus of the heart.", preset: "bowls" },
    { chant: "La ilaha illa Allah", mean: "There is nothing but the Divine.", preset: "ney" },
    { chant: "Kyrie Eleison", mean: "Lord, have mercy — the prayer of the heart.", preset: "choir" },
    { chant: "Sat Nam", mean: "Truth is my name, my essence.", preset: "tanpura" },
    { chant: "Lokah Samastah Sukhino Bhavantu", mean: "May all beings everywhere be happy and free.", preset: "choir" },
    { chant: "Om Shanti Shanti Shanti", mean: "Peace in body, peace in speech, peace in mind.", preset: "choir" },
    { chant: "Aham Prema", mean: "I am divine love.", preset: "tanpura" },
  ];

  function dayIndex() { return Math.floor(Date.now() / 86400000); }
  function todayKey() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function firstName(n) { return (n || "").trim().split(/\s+/)[0] || ""; }

  function greeting() {
    var h = new Date().getHours();
    if (h < 5) return "Still hours";
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    if (h < 21) return "Good evening";
    return "Peaceful night";
  }
  function daypart() {
    var h = new Date().getHours();
    if (h >= 5 && h < 8) return "dawn";
    if (h >= 8 && h < 17) return "day";
    if (h >= 17 && h < 20) return "dusk";
    return "night";
  }
  function fmtTime(d) {
    var h = d.getHours(), m = d.getMinutes();
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }
  function fmtDate(d) {
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var mon = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return days[d.getDay()] + " · " + d.getDate() + " " + mon[d.getMonth()];
  }

  // ── live weather (device geolocation → open-meteo current) ──
  function wmo(code) {
    if (code === 0) return { g: "\u2600\uFE0F", l: "Clear" };
    if (code <= 3) return { g: "\u26C5", l: "Partly cloudy" };
    if (code <= 48) return { g: "\uD83C\uDF2B\uFE0F", l: "Misty" };
    if (code <= 67) return { g: "\uD83C\uDF27\uFE0F", l: "Rain" };
    if (code <= 77) return { g: "\u2744\uFE0F", l: "Snow" };
    if (code <= 82) return { g: "\uD83C\uDF26\uFE0F", l: "Showers" };
    if (code <= 86) return { g: "\uD83C\uDF28\uFE0F", l: "Snow showers" };
    return { g: "\u26C8\uFE0F", l: "Storm" };
  }
  function getWeather() {
    return new Promise(function (res) {
      var GP = (window.Native && Native.geoCurrent) ? Native.geoCurrent : (navigator.geolocation ? function (ok, er) { navigator.geolocation.getCurrentPosition(ok, er, { timeout: 6000, maximumAge: 1800000 }); } : null);
      if (!GP) return res(null);
      var done = false;
      var t = setTimeout(function () { if (!done) { done = true; res(null); } }, 6000);
      GP(function (pos) {
        if (done) return; done = true; clearTimeout(t);
        var la = pos.coords.latitude.toFixed(2), lo = pos.coords.longitude.toFixed(2);
        fetch("https://api.open-meteo.com/v1/forecast?latitude=" + la + "&longitude=" + lo + "&current=temperature_2m,weather_code")
          .then(function (r) { return r.json(); })
          .then(function (j) {
            var c = j && j.current; if (!c) return res(null);
            var w = wmo(c.weather_code);
            res({ temp: Math.round(c.temperature_2m), glyph: w.g, label: w.l });
          }).catch(function () { res(null); });
      }, function () { if (!done) { done = true; clearTimeout(t); res(null); } });
    });
  }

  // ── a circular progress ring (SVG) ──
  function ring(pct, label, value) {
    pct = Math.max(0, Math.min(1, pct || 0));
    var r = 32, circ = 2 * Math.PI * r, off = circ * (1 - pct);
    var wrap = H.el("div", { class: "ring-wrap" });
    var svg = H.el("div", { class: "ring" });
    svg.innerHTML =
      '<svg viewBox="0 0 80 80" width="76" height="76">' +
      '<circle cx="40" cy="40" r="' + r + '" fill="none" stroke="rgba(201,169,110,.16)" stroke-width="6"/>' +
      '<circle cx="40" cy="40" r="' + r + '" fill="none" stroke="url(#ringg)" stroke-width="6" stroke-linecap="round" ' +
      'stroke-dasharray="' + circ.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 40 40)"/>' +
      '<defs><linearGradient id="ringg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E8009A"/><stop offset="1" stop-color="#E2C28A"/></linearGradient></defs>' +
      '</svg>';
    wrap.appendChild(svg);
    wrap.appendChild(H.el("div", { class: "ring-label" }, label));
    wrap.appendChild(H.el("div", { class: "ring-val" }, value));
    return wrap;
  }

  // ── load + render the sacred goals from the practice logs ──
  function loadGoals(box) {
    var myId = (window.APP && APP.me && APP.me.id) || null;
    var sb = window.SP && SP._sb;
    var start = new Date(); start.setHours(0, 0, 0, 0); var startMs = start.getTime();
    var weekAgo = Date.now() - 31 * 86400000;

    function render(hcMin, cpMin, streak) {
      box.innerHTML = "";
      box.appendChild(H.el("div", { class: "dash-h" }, "Today's Path"));
      var row = H.el("div", { class: "goals-row" });
      row.appendChild(ring(hcMin / 10, "Stillness", hcMin + " / 10 min"));
      var st = H.el("div", { class: "streak" }, [
        H.el("div", { class: "streak-num" }, String(streak)),
        H.el("div", { class: "ring-label" }, streak === 1 ? "day streak" : "day streak"),
      ]);
      row.appendChild(st);
      row.appendChild(ring(cpMin / 5, "Union", cpMin + " / 5 min"));
      box.appendChild(row);
    }

    render(0, 0, 0);
    if (!myId || !sb) return;

    Promise.all([
      sb.from("hc_logs").select("seconds,ts").eq("uid", myId).gte("ts", weekAgo),
      sb.from("cp_logs").select("seconds,ts").eq("uid", myId).gte("ts", weekAgo),
    ]).then(function (rs) {
      var hc = (rs[0] && rs[0].data) || [], cp = (rs[1] && rs[1].data) || [];
      var hcMin = 0, cpMin = 0, days = {};
      function note(rows) { rows.forEach(function (r) { var d = new Date(Number(r.ts)); days[d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate()] = 1; }); }
      hc.forEach(function (r) { if (Number(r.ts) >= startMs) hcMin += (r.seconds || 0); });
      cp.forEach(function (r) { if (Number(r.ts) >= startMs) cpMin += (r.seconds || 0); });
      note(hc); note(cp);
      // consecutive-day streak ending today (or yesterday)
      var streak = 0, cur = new Date(); cur.setHours(0, 0, 0, 0);
      var k0 = cur.getFullYear() + "-" + cur.getMonth() + "-" + cur.getDate();
      if (!days[k0]) cur.setDate(cur.getDate() - 1);
      for (var i = 0; i < 60; i++) {
        var k = cur.getFullYear() + "-" + cur.getMonth() + "-" + cur.getDate();
        if (days[k]) { streak++; cur.setDate(cur.getDate() - 1); } else break;
      }
      render(Math.round(hcMin / 60), Math.round(cpMin / 60), streak);
    }).catch(function () {});
  }

  // ── the morning Invocation card ──
  function invocationCard() {
    var m = MANTRAS[dayIndex() % MANTRAS.length];
    var key = "spurana.invocation." + todayKey();
    var done = false; try { done = localStorage.getItem(key) === "1"; } catch (e) {}

    var card = H.el("div", { class: "dash-card invocation" });
    card.appendChild(H.el("div", { class: "dash-h" }, "Today's Invocation"));
    card.appendChild(H.el("div", { class: "mantra-chant" }, m.chant));
    card.appendChild(H.el("div", { class: "mantra-mean" }, m.mean));
    var btn = H.el("button", { class: "sacred-btn invocation-btn" }, done ? "Invocation received \u2726" : "Begin the day \u2726");
    btn.onclick = function () {
      try { if (window.Ambient) { Ambient.enable(true); Ambient.setPreset(m.preset); } } catch (e) {}
      try { localStorage.setItem(key, "1"); } catch (e) {}
      btn.textContent = "Invocation received \u2726";
      if (window.toast) toast("May the day open gently \u2726");
    };
    card.appendChild(btn);
    return card;
  }

  Router.register("self", function (root) {
    var cleanup = [];
    try { document.documentElement.setAttribute("data-screen", "self"); } catch (e) {}
    try { document.documentElement.setAttribute("data-daypart", daypart()); } catch (e) {}

    var bg = H.el("div", { id: "dashBg" });
    document.body.appendChild(bg);

    var wrap = H.el("div", { class: "scroll grow dash-wrap reveal" });
    root.appendChild(wrap);

    // living hero
    var wx = H.el("div", { class: "dash-weather" }, "");
    var clock = H.el("div", { class: "dash-clock" }, "");
    var date = H.el("div", { class: "dash-date" }, "");
    var nm = (window.APP && APP.me && firstName(APP.me.name)) || "";
    var greet = H.el("div", { class: "dash-greet" }, greeting() + (nm ? ", " + nm : ""));
    wrap.appendChild(H.el("div", { class: "dash-hero" }, [wx, clock, date, greet]));

    function tick() { var d = new Date(); clock.textContent = fmtTime(d); date.textContent = fmtDate(d); }
    tick(); var ci = setInterval(tick, 1000); cleanup.push(function () { clearInterval(ci); });

    // live weather text + dreamy weather overlay
    getWeather().then(function (w) { if (w) wx.textContent = w.glyph + "  " + w.temp + "\u00B0  ·  " + w.label; });
    try { if (window.Weather && Weather.once) Weather.once(); } catch (e) {}
    cleanup.push(function () { try { if (window.Weather && Weather.clearPreview) Weather.clearPreview(); } catch (e) {} });

    // invocation + goals
    wrap.appendChild(invocationCard());
    var goals = H.el("div", { class: "dash-card goals-card" });
    wrap.appendChild(goals);
    loadGoals(goals);

    // into the Sanctuary
    var enter = H.el("button", { class: "sacred-btn enter-sanctuary" }, "Enter the Sanctuary");
    enter.onclick = function () { Router.go("sanctuary"); };
    wrap.appendChild(H.el("div", { class: "dash-foot" }, [enter]));

    return {
      teardown: function () {
        cleanup.forEach(function (f) { try { f(); } catch (e) {} });
        try { bg.remove(); } catch (e) {}
        try { document.documentElement.removeAttribute("data-daypart"); } catch (e) {}
        try { document.documentElement.removeAttribute("data-screen"); } catch (e) {}
      },
    };
  });
})();
