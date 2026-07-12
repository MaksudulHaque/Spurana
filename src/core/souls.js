/* ============================================================
 * SPURANA · core/souls.js — soul identity glyphs + romanization.
 * Each soul carries a zodiac sigil drawn in the sacred palette
 * (DREED · Taurus, her · Leo). And the language layer gains a
 * third face: romanized Bangla (Antaryatra, Akashvani) so the
 * Bengali soul-words travel to global readers without a single
 * Bangla letter when English is chosen.
 * ============================================================ */
(function () {
  "use strict";

  /* ── zodiac sigils (inline SVG, gradient-aware) ── */
  var Z = {
    taurus: 'M20 22a12 12 0 0 0 24 0 M32 34c-9 0-15 6-15 14a15 15 0 0 0 30 0c0-8-6-14-15-14Z',
    leo: 'M26 44a9 9 0 1 1 12-8c0-8-4-14-4-20a7 7 0 0 1 14 0 M22 40a6 6 0 1 0 0-.1',
    aries: 'M22 42c-4-8-4-20 4-24a8 8 0 0 1 6 8 8 8 0 0 1 6-8c8 4 8 16 4 24',
    gemini: 'M20 18h24 M20 46h24 M26 18v28 M38 18v28',
    cancer: 'M16 26a8 8 0 0 1 16 0 M48 38a8 8 0 0 1-16 0 M20 30a3 3 0 1 0 .1 0 M44 34a3 3 0 1 0 .1 0',
    virgo: 'M18 22v20 M26 22v20 M18 26a4 4 0 0 1 8 0 M26 26a4 4 0 0 1 8 0v16c0 4 4 6 8 4',
    libra: 'M16 44h32 M16 34h32 M24 34a8 8 0 0 1 16 0',
    scorpio: 'M18 22v20 M26 22v20 M18 26a4 4 0 0 1 8 0 M26 26a4 4 0 0 1 8 0v14l6 6 M44 40l2-6',
    sagittarius: 'M20 44 44 20 M34 20h10v10 M28 28l8 8',
    capricorn: 'M18 22v18 M18 26a4 4 0 0 1 8 0v14a6 6 0 0 0 12 0 6 6 0 0 0-6-6',
    aquarius: 'M16 28l6-4 6 4 6-4 6 4 6-4 M16 38l6-4 6 4 6-4 6 4 6-4',
    pisces: 'M22 18a20 20 0 0 0 0 28 M42 18a20 20 0 0 1 0 28 M18 32h28',
  };

  function sign(name, size) {
    var d = Z[(name || "").toLowerCase()]; if (!d) d = Z.taurus;
    size = size || 46;
    return '<svg viewBox="0 0 64 64" width="' + size + '" height="' + size +
      '" fill="none" stroke="url(#zsg)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><linearGradient id="zsg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">' +
      '<stop stop-color="var(--gold-bright,#E2C28A)"/><stop offset="1" stop-color="var(--q-bright,#E8009A)"/></linearGradient></defs>' +
      '<path d="' + d + '"/></svg>';
  }

  window.Souls = {
    sign: sign,
    // map a uid → zodiac (DREED = Taurus, her = Leo; extend as needed)
    signFor: function (uid) {
      var map = {
        "17a398e5-0695-4dfd-b034-f3171a1b10c6": "taurus", // DREED
        "ff5eda93-49cc-4239-bfc5-5e3d75d328c5": "leo",     // her
      };
      return map[uid] || "taurus";
    },
  };

  /* ── romanized Bangla: shown when language = English so the
        Bengali soul-words remain, spelled for global tongues ── */
  window.ROMAN = {
    "Akashvani": "Akashvani",
    "Antordrishti": "Antordrishti",
    "Antaryatra": "Antaryatra",
    "Pratidhwani": "Pratidhwani",
    "Soul Tides": "Soul Tides",
    "Sacred Call": "Sacred Call",
    "Vision Call": "Vision Call",
    "The Oracle": "Doiboani \u00b7 The Oracle",
    "Meditation Zone": "Dhyan \u00b7 Meditation",
    "Heart-Centred": "Hridoy \u00b7 Heart-Centred",
  };
})();
