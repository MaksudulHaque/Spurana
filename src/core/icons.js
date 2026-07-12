/* ============================================================
 * SPURANA · core/icons.js — the sacred glyph set.
 * One consistent visual language for every tile: thin luminous
 * strokes on a gold→magenta gradient, geometric and calm, in the
 * same hand as the zodiac sigils. Replaces the emoji patchwork so
 * the Sanctuary reads as one designed, futuristic-sacred place.
 * window.ICONS[title] → inline SVG string.
 * ============================================================ */
(function () {
  "use strict";

  // shared svg frame — all glyphs share stroke, gradient, size
  function g(paths, opts) {
    opts = opts || {};
    var extra = opts.fill ? "" : ' fill="none"';
    return '<svg viewBox="0 0 48 48" width="30" height="30"' + extra +
      ' stroke="url(#spx)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><linearGradient id="spx" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">' +
      '<stop stop-color="var(--gold-bright,#E2C28A)"/><stop offset="1" stop-color="var(--q-bright,#E8009A)"/></linearGradient></defs>' +
      paths + "</svg>";
  }

  var I = {
    // ── Connect ──
    "Sacred Call":   g('<path d="M14 12c-2 6 6 18 12 20 4 1 8-2 9-5l-5-4-3 2c-3-1-6-4-7-7l2-3-4-5-4 2Z"/>'),
    "Vision Call":   g('<rect x="8" y="14" width="22" height="20" rx="4"/><path d="M30 22l10-5v14l-10-5"/>'),
    "Watch Together":g('<rect x="7" y="11" width="34" height="22" rx="3"/><path d="M17 40h14M24 33v7"/>'),
    "Listen Together":g('<path d="M12 30v-6a12 12 0 0 1 24 0v6"/><rect x="8" y="28" width="7" height="11" rx="3"/><rect x="33" y="28" width="7" height="11" rx="3"/>'),
    "Pratidhwani":   g('<circle cx="24" cy="24" r="5"/><path d="M15 15a13 13 0 0 0 0 18M33 15a13 13 0 0 1 0 18M11 11a19 19 0 0 0 0 26M37 11a19 19 0 0 1 0 26"/>'),
    "Vanish Mode":   g('<path d="M10 24c4-7 10-11 14-11s10 4 14 11c-4 7-10 11-14 11-2 0-4-.5-6-1.4"/><circle cx="24" cy="24" r="4"/><path d="M8 8l32 32" stroke-width="1.6"/>'),
    "Souls":         g('<circle cx="24" cy="16" r="6"/><path d="M12 38a12 12 0 0 1 24 0"/>'),
    "Track Souls":   g('<path d="M24 6c-7 0-12 5-12 12 0 8 12 22 12 22s12-14 12-22c0-7-5-12-12-12Z"/><circle cx="24" cy="18" r="4"/>'),
    "Akashvani":     g('<path d="M24 10v20" stroke-width="2.4"/><path d="M16 18a10 10 0 0 1 16 0M12 14a16 16 0 0 1 24 0"/><circle cx="24" cy="36" r="2.4" fill="url(#spx)"/>'),
    "Antordrishti":  g('<path d="M6 24c5-8 12-12 18-12s13 4 18 12c-5 8-12 12-18 12S11 32 6 24Z"/><circle cx="24" cy="24" r="6"/><circle cx="24" cy="24" r="2" fill="url(#spx)"/>'),
    "Jhankar":       g('<path d="M26 6 14 26h9l-3 16 16-22h-9l3-14Z"/><path d="M8 10l-3-3M40 10l3-3M8 38l-3 3M40 38l3 3" opacity=".6"/>'),
    "Soul Tides":    g('<path d="M8 20c3-3 6-3 9 0s6 3 9 0 6-3 9 0 5 3 5 3M8 30c3-3 6-3 9 0s6 3 9 0 6-3 9 0 5 3 5 3"/>'),
    // ── Journey Inward ──
    "Meditation Zone":g('<circle cx="24" cy="14" r="5"/><path d="M10 38c2-8 7-12 14-12s12 4 14 12M14 32l-4 6M34 32l4 6"/>'),
    "Heart-Centred": g('<path d="M24 36S10 27 10 18a7 7 0 0 1 14-2 7 7 0 0 1 14 2c0 9-14 18-14 18Z"/><path d="M18 22h4l2-3 2 6 2-3h2" stroke-width="1.5"/>'),
    "Antaryatra":    g('<path d="M24 8v32M24 8l-7 7M24 8l7 7"/><circle cx="24" cy="30" r="8"/>'),
    "Couple Practices":g('<circle cx="17" cy="18" r="5"/><circle cx="31" cy="18" r="5"/><path d="M9 38a8 8 0 0 1 16 0M23 38a8 8 0 0 1 16 0"/>'),
    "Learning Zone": g('<path d="M8 16l16-7 16 7-16 7-16-7Z"/><path d="M14 20v9c0 2 5 4 10 4s10-2 10-4v-9"/>'),
    "Reminders":     g('<path d="M14 20a10 10 0 0 1 20 0c0 8 3 10 3 10H11s3-2 3-10Z"/><path d="M20 34a4 4 0 0 0 8 0"/>'),
    "Sacred Games":  g('<rect x="9" y="16" width="30" height="18" rx="6"/><path d="M16 22v6M13 25h6M30 24h.1M34 28h.1"/>'),
    // ── Deeper ──
    "The Oracle":    g('<circle cx="24" cy="24" r="14"/><path d="M24 10v28M10 24h28" stroke-width="1.3" opacity=".6"/><circle cx="24" cy="24" r="4" fill="url(#spx)"/>'),
    "Past Lives":    g('<path d="M24 10a14 14 0 1 0 14 14"/><path d="M38 10v8h-8"/><path d="M24 17v7l5 3" stroke-width="1.6"/>'),
    "Memory Vault":  g('<rect x="9" y="10" width="30" height="28" rx="4"/><circle cx="24" cy="24" r="6"/><path d="M24 20v4l3 2"/>'),
    "Love Letters":  g('<rect x="8" y="13" width="32" height="22" rx="3"/><path d="M8 15l16 12 16-12"/><path d="M24 30l3-3 3 3" stroke-width="1.4"/>'),
    "Sacred Days":   g('<rect x="9" y="12" width="30" height="26" rx="4"/><path d="M9 20h30M17 9v6M31 9v6"/><circle cx="24" cy="29" r="3" fill="url(#spx)"/>'),
    "Gratitude":     g('<path d="M14 24l6 6 14-14"/><circle cx="24" cy="24" r="17" opacity=".55"/>'),
    "Our Stats":     g('<path d="M10 34V20M20 34V12M30 34v-9M40 34V16"/><path d="M8 38h34"/>'),
    "Connection Tree":g('<path d="M24 40V22M24 22l-8-8M24 22l8-8"/><circle cx="24" cy="18" r="4"/><circle cx="14" cy="12" r="3"/><circle cx="34" cy="12" r="3"/>'),
    "Soul Weather":  g('<circle cx="20" cy="20" r="6"/><path d="M20 8v3M8 20h3M30 12l-2 2M12 12l2 2"/><path d="M22 34a7 7 0 0 1 2-14 8 8 0 0 1 15 3 6 6 0 0 1-1 11H22Z"/>'),
    // ── Worlds / settings ──
    "Mood Worlds":   g('<circle cx="24" cy="24" r="15"/><path d="M24 9c-6 5-6 25 0 30M24 9c6 5 6 25 0 30M10 18h28M10 30h28" stroke-width="1.3"/>'),
    "All Worlds":    g('<circle cx="24" cy="24" r="15"/><ellipse cx="24" cy="24" rx="15" ry="6"/><path d="M24 9v30" stroke-width="1.3"/>'),
    "Divine Guide":  g('<path d="M24 8l3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Z"/><circle cx="24" cy="24" r="15" opacity=".4"/>'),
    "Global Settings":g('<circle cx="24" cy="24" r="6"/><path d="M24 8v5M24 35v5M8 24h5M35 24h5M13 13l3 3M32 32l3 3M35 13l-3 3M16 32l-3 3"/>'),
    "Divine Voice":  g('<path d="M24 10v20" stroke-width="2.2"/><path d="M18 16v8M30 16v8M12 19v2M36 19v2"/>'),
    "Performance":   g('<path d="M24 24l9-6"/><path d="M12 34a14 14 0 1 1 24 0" /><circle cx="24" cy="24" r="2.5" fill="url(#spx)"/>'),
    "Binaural":      g('<circle cx="15" cy="24" r="6"/><circle cx="33" cy="24" r="6"/><path d="M21 24h6"/>'),
    "Fullscreen":    g('<path d="M12 18v-6h6M36 18v-6h-6M12 30v6h6M36 30v6h-6"/>'),
    "The Keeper":    g('<path d="M24 8l14 5v9c0 9-6 15-14 18-8-3-14-9-14-18v-9l14-5Z"/><path d="M18 24l4 4 8-8"/>'),
    "Today":         g('<circle cx="24" cy="24" r="8"/><path d="M24 6v5M24 37v5M6 24h5M37 24h5M11 11l3 3M34 34l3 3M37 11l-3 3M14 34l-3 3"/>'),
    "Daily Ritual":  g('<circle cx="24" cy="24" r="14"/><path d="M24 14v10l7 4"/>'),
    "Deeper Memory": g('<rect x="9" y="10" width="30" height="28" rx="4"/><circle cx="24" cy="24" r="6"/><path d="M24 20v4l3 2"/>'),
    "Sacred Rooms":  g('<path d="M10 22l14-11 14 11v14a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2Z"/><rect x="20" y="26" width="8" height="12"/>'),
    "Deeper Reflection":g('<path d="M24 6a12 12 0 0 1 0 24 12 12 0 0 0 0 12" opacity=".5"/><circle cx="24" cy="18" r="7"/>'),
  };

  window.ICONS = I;
})();
