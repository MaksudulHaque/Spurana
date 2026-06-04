/* ============================================================
 * SPURANA · reflect/weather.js — Soul Weather + Mood Chart.
 * A daily inner check-in: pick how your soul feels today; it is
 * kept as a typed row in `messages` (type "mood"), conv-scoped
 * and protected by the same RLS as everything else, excluded
 * from the chat thread. Both souls can see each other's weather,
 * drawn as a gentle 14-day chart.
 *
 * Security: the mood is chosen from a fixed set (no free-text
 * sink); the optional note is rendered as a text node by H.el.
 * Efficiency: a single list() read covers both souls; grouping
 * and the chart are computed once per render.
 * ============================================================ */
(function () {
  "use strict";

  // fixed palette — [key, icon, label, value 1..5, colour]
  var MOODS = [
    ["radiant", "\u2600\uFE0F", "Radiant", 5, "#FFD480"],
    ["grateful", "\uD83D\uDE4F", "Grateful", 5, "#E2C28A"],
    ["calm", "\uD83C\uDF24\uFE0F", "Calm", 4, "#8FB9C9"],
    ["tender", "\uD83D\uDC97", "Tender", 4, "#FF6088"],
    ["longing", "\uD83C\uDF19", "Longing", 3, "#A8A0E0"],
    ["restless", "\uD83C\uDF2A\uFE0F", "Restless", 2, "#C99A6E"],
    ["heavy", "\uD83C\uDF27\uFE0F", "Heavy", 2, "#5B8FB9"],
    ["empty", "\uD83C\uDF11", "Empty", 1, "#6E6A86"],
  ];
  function moodBy(key) { for (var i = 0; i < MOODS.length; i++) if (MOODS[i][0] === key) return MOODS[i]; return null; }
  function dayKey(ts) { var d = new Date(ts); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }

  // latest mood per (uid, day) → map keyed "uid|day"
  function reduceLatest(rows) {
    var map = {};
    rows.forEach(function (m) {
      if (!m.text) return;
      var k = m.uid + "|" + dayKey(m.ts);
      if (!map[k] || m.ts > map[k].ts) map[k] = m;
    });
    return map;
  }

  // build a 14-day chart for one soul → SVG string (numbers only, no user text)
  function chartLine(rows, uid, colour) {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var pts = [];
    for (var i = 13; i >= 0; i--) {
      var day = new Date(today.getTime() - i * 86400000);
      var key = uid + "|" + (day.getFullYear() + "-" + (day.getMonth() + 1) + "-" + day.getDate());
      var x = 14 + (13 - i) * ((300 - 14) / 13);
      var rec = rows[key];
      pts.push({ x: x, v: rec ? rec.value : null, c: rec ? rec.colour : colour });
    }
    var poly = pts.filter(function (p) { return p.v != null; })
      .map(function (p) { return p.x.toFixed(1) + "," + (108 - (p.v / 5) * 92).toFixed(1); }).join(" ");
    var dots = pts.filter(function (p) { return p.v != null; })
      .map(function (p) { return '<circle cx="' + p.x.toFixed(1) + '" cy="' + (108 - (p.v / 5) * 92).toFixed(1) + '" r="3.5" fill="' + p.c + '"/>'; }).join("");
    var line = poly ? '<polyline points="' + poly + '" fill="none" stroke="' + colour + '" stroke-width="1.5" stroke-linejoin="round" opacity=".6"/>' : "";
    return line + dots;
  }

  function chartSVG(map, meId, partnerId) {
    var meRows = {}, paRows = {};
    Object.keys(map).forEach(function (k) {
      var m = map[k], mood = moodBy(m.text); if (!mood) return;
      var rec = { ts: m.ts, value: mood[3], colour: mood[4] };
      var dk = m.uid + "|" + dayKey(m.ts);
      if (m.uid === meId) meRows[dk] = rec; else if (m.uid === partnerId) paRows[dk] = rec;
    });
    var grid = "";
    for (var g = 1; g <= 5; g++) { var y = 108 - (g / 5) * 92; grid += '<line x1="14" y1="' + y.toFixed(1) + '" x2="300" y2="' + y.toFixed(1) + '" stroke="rgba(201,169,110,.10)" stroke-width="1"/>'; }
    return '<svg viewBox="0 0 314 120" width="100%" height="100%" aria-hidden="true">' + grid +
      chartLine(paRows, partnerId, "#C9A96E") + chartLine(meRows, meId, "#FF00B0") + "</svg>";
  }

  Router.register("weather", function (root) {
    root.appendChild(topBar({ title: "Soul Weather", back: true }));
    var conv = APP.activeConv;
    var wrap = H.el("div", { class: "scroll grow pad reveal" });
    root.appendChild(wrap);

    if (!conv) { wrap.appendChild(H.el("div", { class: "empty" }, [H.el("div", { class: "big" }, "No soul bonded yet"), H.el("p", { class: "muted" }, "Bond with your beloved to share your weather.")])); return {}; }

    wrap.appendChild(H.el("p", { class: "wx-lead" }, "How does your soul feel today?"));
    var grid = H.el("div", { class: "wx-grid" });
    wrap.appendChild(grid);

    var chartCard = H.el("div", { class: "card wx-chart" }, H.el("div", { class: "muted center" }, "\u2026"));
    wrap.appendChild(H.el("div", { class: "wx-legend" }, [
      H.el("span", {}, [H.el("i", { class: "wx-dot me" }), "You"]),
      H.el("span", {}, [H.el("i", { class: "wx-dot partner" }), "Beloved"]),
    ]));
    wrap.appendChild(chartCard);

    var todayKey = dayKey(Date.now()), myId = APP.me && APP.me.id;

    function paint(rows) {
      var map = reduceLatest(rows);
      // reflect today's selection
      var mineToday = map[myId + "|" + todayKey];
      H.clear(grid);
      MOODS.forEach(function (mo) {
        var on = mineToday && mineToday.text === mo[0];
        var b = H.el("button", { class: "wx-mood" + (on ? " on" : ""), onClick: function () { choose(mo); } }, [
          H.el("span", { class: "wx-ico" }, mo[1]),
          H.el("span", { class: "wx-lbl" }, mo[2]),
        ]);
        if (on) b.style.borderColor = mo[4];
        grid.appendChild(b);
      });
      H.clear(chartCard);
      var holder = H.el("div", { class: "wx-chart-svg" });
      holder.innerHTML = chartSVG(map, myId, APP.partner && APP.partner.id);  // numeric SVG only — no user text
      chartCard.appendChild(H.el("div", { class: "wx-chart-h" }, "Last 14 days"));
      chartCard.appendChild(holder);
    }

    async function load() {
      var rows = await Keepsake.list(conv, "mood");
      paint(rows || []);
    }
    async function choose(mo) {
      await Keepsake.add(conv, "mood", { text: mo[0] });
      if (window.toast) toast(mo[1] + " \u2014 held for today");
      load();
    }
    load();
    return {};
  });
})();
