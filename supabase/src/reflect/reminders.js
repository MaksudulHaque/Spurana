/* ============================================================
 * SPURANA · reflect/reminders.js — gentle practice reminders.
 * Pick a practice + a time; Spurana nudges you toward it.
 * Stored as a typed row in `messages` (type "reminder"), with
 * the payload packed as JSON in the existing `text` column —
 * same conv-scoped, RLS-protected pattern as every keepsake.
 *
 * Security: the practice is chosen from the fixed catalog (no
 * free-text sink); the time comes from <input type=time> (HH:MM).
 * Rendered as text nodes. Honest limit: true background push
 * needs server infrastructure; on the free/static stack this
 * nudges in-app when open, and fires a local notification only
 * if the page is open and the soul has granted permission.
 *
 * Efficiency: ONE 60s interval, no per-tick network — reminders
 * are cached and only re-read on change or every 5 minutes.
 * ============================================================ */
window.Reminders = (function () {
  "use strict";
  var TYPE = "reminder";
  var cache = [], tick = 0, started = false;

  function flatPractices() {
    var lib = window.PRACTICE_LIB || {}, out = [];
    Object.keys(lib).forEach(function (cat) {
      (lib[cat] || []).forEach(function (p) { out.push({ id: p.id, name: p.t, icon: p.i }); });
    });
    return out;
  }
  function parse(m) { try { var o = JSON.parse(m.text); return { id: m.id, p: o.p, l: o.l, t: o.t }; } catch (e) { return null; } }
  function dayKey() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function ackKey(id) { return "spurana.rem.ack." + id + "." + dayKey(); }

  async function refresh() {
    var conv = APP.activeConv; if (!conv) { cache = []; return cache; }
    var rows = await Keepsake.list(conv, TYPE);
    cache = (rows || []).map(parse).filter(function (r) { return r && r.t; });
    return cache;
  }

  function check() {
    if (!APP.me || !APP.activeConv) return;
    var now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
    cache.forEach(function (r) {
      var parts = (r.t || "").split(":"); if (parts.length !== 2) return;
      var remMin = (+parts[0]) * 60 + (+parts[1]);
      if (nowMin < remMin || nowMin >= remMin + 30) return;          // 30-min grace window
      var ak = ackKey(r.id);
      try { if (localStorage.getItem(ak)) return; localStorage.setItem(ak, "1"); } catch (e) {}
      nudge(r);
    });
  }

  function nudge(r) {
    var msg = "Time for " + (r.l || "your practice") + " \u2726";
    if (window.toast) toast(msg);
    try {
      if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
        var n = new Notification("Spurana", { body: msg, silent: false });
        n.onclick = function () { try { window.focus(); Router.go("practice", { id: r.p }); } catch (e) {} };
      }
    } catch (e) {}
  }

  function init() {
    if (started) return; started = true;
    try {
      refresh();
      setInterval(function () { tick++; if (tick % 5 === 0) refresh(); check(); }, 60000);
      if (document && document.addEventListener) document.addEventListener("visibilitychange", function () { if (!document.hidden) check(); });
    } catch (e) {}
  }

  /* ── screen ── */
  if (window.Router) Router.register("reminders", function (root) {
    root.appendChild(topBar({ title: "Reminders", back: true }));
    var conv = APP.activeConv;
    var body = H.el("div", { class: "pad scroll grow stack reveal" });
    root.appendChild(body);
    if (!conv) { body.appendChild(H.el("div", { class: "empty" }, [H.el("div", { class: "big" }, "\u23F0"), H.el("p", { class: "muted" }, "Bond with your beloved first.")])); return {}; }

    var practices = flatPractices();
    var sel = H.el("select", { class: "input" });
    practices.forEach(function (p) { sel.appendChild(H.el("option", { value: p.id }, (p.icon ? p.icon + "  " : "") + p.name)); });
    var time = H.el("input", { class: "input", type: "time", value: "20:00" });
    var addBtn = H.el("button", { class: "sacred-btn" }, "Set reminder \u2726");
    body.appendChild(H.el("div", { class: "card stack" }, [
      H.el("div", { class: "f-label" }, "A gentle nudge toward a practice"),
      sel, time, addBtn,
      H.el("div", { class: "muted", style: "font-size:12px;line-height:1.5" }, "Reminders nudge you while Spurana is open. Allow notifications to be reminded even in the background."),
    ]));

    var listEl = H.el("div", { class: "stack" });
    body.appendChild(listEl);
    var empty = H.el("div", { class: "empty" }, [H.el("div", { class: "big" }, "\u2727"), H.el("p", { class: "muted", style: "font-family:var(--f-soul);font-style:italic" }, "No reminders yet \u2014 set one above.")]);
    body.appendChild(empty);

    function row(r) {
      var del = H.el("button", { class: "rem-del", title: "Remove", onClick: async function () { await Keepsake.remove(r.id); refresh(); render(); } }, "\u2715");
      var p = practices.filter(function (x) { return x.id === r.p; })[0];
      return H.el("div", { class: "rem-row" }, [
        H.el("span", { class: "rem-ico" }, (p && p.icon) || "\u2726"),
        H.el("div", { class: "rem-body" }, [H.el("div", { class: "rem-name" }, r.l || (p && p.name) || "Practice"), H.el("div", { class: "rem-time" }, r.t)]),
        del,
      ]);
    }
    function render() {
      H.clear(listEl);
      if (!cache.length) { empty.classList.remove("hidden"); return; }
      empty.classList.add("hidden");
      cache.forEach(function (r) { listEl.appendChild(row(r)); });
    }

    addBtn.addEventListener("click", async function () {
      var p = practices.filter(function (x) { return x.id === sel.value; })[0];
      if (!p || !time.value) return;
      try { if ("Notification" in window && Notification.permission === "default") Notification.requestPermission(); } catch (e) {}
      await Keepsake.add(conv, TYPE, { text: JSON.stringify({ p: p.id, l: p.name, t: time.value }) });
      if (window.toast) toast("Reminder set \u2726");
      await refresh(); render();
    });

    (async function () { await refresh(); render(); })();
    return {};
  });

  // start the background checker (no-op until signed in with a bond)
  init();
  return { init: init, refresh: refresh, check: check };
})();
