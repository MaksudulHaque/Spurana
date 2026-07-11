/* SPURANA · world/timeworld.js — scene shifts with the hour. */
window.TimeWorld = (function () {
  "use strict";
  const KEY = "spurana.timeworlds"; let on = false, timer = null;
  function pick() { const h = new Date().getHours(); if (h < 5) return "night"; if (h < 8) return "dawn"; if (h < 17) return "cosmos"; if (h < 20) return "dusk"; return "night"; }
  function applyNow() { try { if (window.World) World.apply(pick(), { silent: true }); } catch (e) {} }
  function schedule() { clearInterval(timer); timer = setInterval(applyNow, 10 * 60 * 1000); }
  function enable(v) { on = v; try { localStorage.setItem(KEY, v ? "1" : "0"); } catch (e) {} if (v) { applyNow(); schedule(); } else clearInterval(timer); }
  function init() { try { on = localStorage.getItem(KEY) === "1"; } catch (e) { on = false; } if (on) schedule(); }
  return { enable, applyNow, isOn: () => on, init };
})();
