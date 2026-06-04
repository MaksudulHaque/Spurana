/* ============================================================
 * SPURANA · core/perf.js
 * THE single source of truth for performance. Three tiers control
 * every heat source (cosmic canvas, blur, decorative animation):
 *   high     — Full Sanctuary: 60 particles, all effects.
 *   balanced — default: 28 particles @30fps, light blur. (recommended)
 *   lite     — coolest & fastest for pure messaging: canvas OFF,
 *              no blur, no decorative motion.
 * Tier is auto-detected on first run, user-selectable, and persisted.
 * Sets <html data-perf="..."> so CSS reacts; brand.js reads PERF.canvas().
 * ============================================================ */
(function () {
  "use strict";

  const KEY = "spurana.perf";
  const TIERS = {
    high:     { label: "Full Sanctuary", canvas: { enabled: true,  particles: 60, fps: 0  }, note: "Every effect on. Best on a powerful, plugged-in device." },
    balanced: { label: "Balanced",       canvas: { enabled: true,  particles: 28, fps: 30 }, note: "Cosmic backdrop runs gently at 30fps. Smooth and cool. Recommended." },
    lite:     { label: "Lite",           canvas: { enabled: false, particles: 0,  fps: 0  }, note: "Backdrop, blur and decorative motion OFF. Coolest battery use, fastest messaging." },
  };

  function detect() {
    try {
      const c = navigator.connection;
      if (c && c.saveData) return "lite";
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "lite";
      const mem = navigator.deviceMemory || 4;
      const cores = navigator.hardwareConcurrency || 4;
      if (mem <= 2 || cores <= 2) return "lite";
    } catch (e) {}
    return "balanced"; // safe, cool default; High is opt-in.
  }

  function load() { try { const v = localStorage.getItem(KEY); return TIERS[v] ? v : null; } catch (e) { return null; } }
  function save(t) { try { localStorage.setItem(KEY, t); } catch (e) {} }

  let _tier = "balanced";

  const PERF = {
    get tier() { return _tier; },
    list() { return Object.keys(TIERS).map((k) => ({ key: k, label: TIERS[k].label, note: TIERS[k].note })); },
    canvas() { return TIERS[_tier].canvas; },
    isAuto() { return load() == null; },

    apply(tier, opts) {
      if (!TIERS[tier]) tier = "balanced";
      _tier = tier;
      document.documentElement.setAttribute("data-perf", tier);
      if (!(opts && opts.silent)) save(tier);
      try { if (window.startCosmos) window.startCosmos(); } catch (e) {}   // restart/stop canvas for the new tier
    },

    init() {
      const chosen = load() || detect();
      this.apply(chosen, { silent: load() == null });
      // Battery courtesy: if very low and unplugged, drop to lite once (doesn't overwrite a manual High).
      if (navigator.getBattery) navigator.getBattery().then((b) => {
        const lowDrop = () => { if (!b.charging && b.level <= 0.15 && _tier !== "lite") { this.apply("lite"); if (window.toast) toast("Battery low — switched to Lite to stay cool."); } };
        lowDrop(); b.addEventListener("levelchange", lowDrop); b.addEventListener("chargingchange", lowDrop);
      }).catch(() => {});
    },
  };
  window.PERF = PERF;

  // ── Settings screen ──
  Router.register("perf", function (root) {
    root.appendChild(topBar({ title: "Performance", back: true }));
    const body = H.el("div", { class: "pad scroll grow stack reveal" });
    root.appendChild(body);

    body.appendChild(H.el("p", { class: "muted center", style: "font-family:var(--f-soul);font-style:italic;font-size:15px" },
      "Tune the sanctuary to your device. Lite keeps it coolest and fastest for messaging."));

    function card(t) {
      const on = PERF.tier === t.key;
      const c = H.el("button", {
        class: "card", style: "text-align:left;width:100%;cursor:pointer;border-color:" + (on ? "var(--q)" : "var(--border)") + (on ? ";box-shadow:var(--glow-q-sm)" : ""),
        onClick: () => { PERF.apply(t.key); Router.go("perf"); toast(t.label + " mode on."); },
      }, [
        H.el("div", { class: "row spread" }, [
          H.el("div", { style: "font-family:var(--f-ui);font-weight:700;letter-spacing:.1em;text-transform:uppercase;font-size:14px;color:" + (on ? "var(--q-bright)" : "var(--text)") }, t.label),
          H.el("div", { style: "font-family:var(--f-tech);font-size:16px;color:var(--q-bright)" }, on ? "\u2726" : ""),
        ]),
        H.el("div", { class: "muted", style: "margin-top:6px;font-size:13.5px" }, t.note),
      ]);
      return c;
    }
    PERF.list().forEach((t) => body.appendChild(card(t)));

    const auto = PERF.isAuto() ? " (auto-detected for this device)" : "";
    body.appendChild(H.el("div", { class: "nwp-credit", style: "margin-top:18px" }, "current: " + PERF.tier + auto));
    return {};
  });
})();
