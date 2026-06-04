/* ============================================================
 * SPURANA · world/weather.js — live local weather as a scene
 * overlay (rain / snow / storm). open-meteo, no API key.
 * Off in Lite to stay cool. Geolocation optional (graceful).
 * ============================================================ */
window.Weather = (function () {
  "use strict";
  const KEY = "spurana.weather"; let on = false, fx = null;
  function lite() { return document.documentElement.getAttribute("data-perf") === "lite"; }
  function kindOf(c) {
    if (c >= 95) return "storm";
    if ((c >= 71 && c <= 77) || c === 85 || c === 86) return "snow";
    if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) return "rain";
    return "clear";
  }
  function fetchKind() {
    return new Promise((res) => {
      if (!navigator.geolocation) return res(null);
      navigator.geolocation.getCurrentPosition(async (p) => {
        try {
          const u = "https://api.open-meteo.com/v1/forecast?latitude=" + p.coords.latitude + "&longitude=" + p.coords.longitude + "&current=weather_code";
          const r = await fetch(u); const j = await r.json();
          res(kindOf((j.current && j.current.weather_code) || 0));
        } catch (e) { res(null); }
      }, () => res(null), { timeout: 8000, maximumAge: 1800000 });
    });
  }
  function remove() { if (fx) { fx.remove(); fx = null; } }
  function paint(kind) {
    remove();
    if (!kind || kind === "clear") return;
    if (lite()) return;                       // keep Lite cool — no precipitation layer
    fx = H.el("div", { id: "weatherfx", "data-kind": kind });
    const n = kind === "snow" ? 36 : 48;
    for (let i = 0; i < n; i++) {
      const p = H.el("i", { class: kind === "snow" ? "flake" : "drop" });
      p.style.left = (Math.random() * 100) + "%";
      p.style.animationDelay = (Math.random() * (kind === "snow" ? 6 : 1.4)) + "s";
      p.style.animationDuration = ((kind === "snow" ? 5 : 0.6) + Math.random() * 0.6) + "s";
      fx.appendChild(p);
    }
    document.body.appendChild(fx);
    document.documentElement.setAttribute("data-weather", kind);
  }
  async function refresh() { if (!on) return; const k = await fetchKind(); paint(k); }
  function enable(v) { on = v; try { localStorage.setItem(KEY, v ? "1" : "0"); } catch (e) {} if (v) refresh(); else { remove(); document.documentElement.removeAttribute("data-weather"); } }
  function init() { try { on = localStorage.getItem(KEY) === "1"; } catch (e) {} if (on) refresh(); }
  return { enable, refresh, isOn: () => on, init };
})();
