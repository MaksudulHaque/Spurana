/* ============================================================
 * SPURANA · core/brand.js  (V1 identity, matched to source)
 * The logo-cosmos block (orbit rings + sigil SVG) and the cosmic
 * particle canvas. The canvas obeys PERF.canvas(): tier decides
 * particle count, fps cap, or OFF entirely (Lite).
 * ============================================================ */
(function () {
  "use strict";

  window.sigil = function () {
    const wrap = H.el("div", { class: "logo-cosmos" });
    wrap.appendChild(H.el("div", { class: "logo-orbit" }));
    wrap.appendChild(H.el("div", { class: "logo-orbit-2" }));
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 120 120");
    svg.innerHTML =
      '<defs><radialGradient id="lg" cx="50%" cy="40%" r="60%">' +
      '<stop offset="0%" stop-color="#FF00B0"/><stop offset="50%" stop-color="#C0007A"/>' +
      '<stop offset="100%" stop-color="#4a0030"/></radialGradient></defs>' +
      '<circle cx="60" cy="60" r="48" fill="url(#lg)" opacity="0.15"/>' +
      '<path d="M60 20 C60 20 80 40 80 60 C80 80 60 95 60 95 C60 95 40 80 40 60 C40 40 60 20 60 20Z" fill="url(#lg)" opacity="0.9"/>' +
      '<circle cx="60" cy="60" r="8" fill="#fff" opacity="0.9"/>' +
      '<circle cx="60" cy="36" r="4" fill="#E8009A"/><circle cx="60" cy="84" r="4" fill="#C9A96E"/>' +
      '<path d="M60 20 L60 100M30 60 L90 60" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>';
    wrap.appendChild(svg);
    return wrap;
  };

  // Cosmic particle field — obeys the active performance tier.
  // Drive V1's bespoke per-world scenes (window.ENV_FX). Each world
  // is its own draw(ctx,W,H,t). Throttled + low internal resolution.
  window.startCosmos = function () {
    const canvas = document.getElementById("cosmicCanvas");
    if (!canvas || !canvas.getContext) return;
    if (window._cosmicRaf) { cancelAnimationFrame(window._cosmicRaf); window._cosmicRaf = null; }
    const cfg = (window.PERF && window.PERF.canvas()) || { enabled: true, particles: 60, fps: 0 };
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!cfg.enabled || !cfg.particles) { canvas.width = canvas.width; return; }   // Lite: static gradient only
    const scale = cfg.particles <= 45 ? 0.66 : 0.88;   // soft particles — lower res is invisible, saves heat
    function size() { canvas.width = Math.round(window.innerWidth * scale); canvas.height = Math.round(window.innerHeight * scale); canvas.style.width = "100%"; canvas.style.height = "100%"; }
    size();
    const FX = window.ENV_FX || {};
    const draw = FX[window.__envKey || "cosmos"] || FX.cosmos;
    if (!draw) { canvas.width = canvas.width; return; }
    const t0 = (window.performance && performance.now) ? performance.now() : Date.now();
    const minDt = cfg.fps ? (1000 / cfg.fps) : 0; let last = 0;
    function loop(now) {
      window._cosmicRaf = requestAnimationFrame(loop);
      if (minDt && now && (now - last) < minDt) return; last = now || 0;
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      try { draw(ctx, w, h, ((now || t0) - t0) / 1000); } catch (e) {}
    }
    window.addEventListener("resize", size);
    document.addEventListener("visibilitychange", function () { if (document.hidden) { if (window._cosmicRaf) { cancelAnimationFrame(window._cosmicRaf); window._cosmicRaf = null; } } else if (!window._cosmicRaf) window._cosmicRaf = requestAnimationFrame(loop); });
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { try { draw(ctx, canvas.width, canvas.height, 0); } catch (e) {} return; }
    window._cosmicRaf = requestAnimationFrame(loop);
  };
})();
