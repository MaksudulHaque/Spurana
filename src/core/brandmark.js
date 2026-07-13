/* ============================================================
 * SPURANA · core/brandmark.js — identity + language.
 * The Spurana Sigil (a lotus-S, not a star) replaces every lone
 * mark. And a clean trilingual label map: each entry is
 *   [ bengaliScript, english, romanized ]
 * English mode shows the romanized sacred word (Antaryatra) so
 * global users can pronounce it. Bengali mode shows pure script.
 * NEVER mixed inline. When "English" is chosen, no Bengali
 * letters appear anywhere — only romanization.
 * ============================================================ */
(function () {
  "use strict";

  function sigil(size, glow) {
    var sz = size || 40;
    return (
      '<svg viewBox="0 0 64 64" width="' + sz + '" height="' + sz + '" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<defs><radialGradient id="sgFl" cx="50%" cy="42%" r="62%">' +
          '<stop offset="0%" stop-color="#FFE9F8"/><stop offset="38%" stop-color="#FF3DBE"/><stop offset="100%" stop-color="#7E005C"/>' +
        '</radialGradient></defs>' +
        '<circle cx="32" cy="32" r="29" stroke="rgba(201,169,110,.45)" stroke-width="1"/>' +
        '<circle cx="32" cy="32" r="23.5" stroke="rgba(232,0,154,.32)" stroke-width="1"/>' +
        '<path d="M32 9 C40.5 19.5 46.5 26.5 46.5 36 a14.5 14.5 0 0 1-29 0 C17.5 26.5 23.5 19.5 32 9Z" fill="url(#sgFl)"' +
          (glow ? ' filter="drop-shadow(0 0 10px rgba(232,0,154,.85))"' : '') + '/>' +
        '<circle cx="32" cy="37.5" r="5.5" fill="#FFF3FB"/>' +
        '<circle cx="32" cy="53" r="2" fill="#E2C28A"/>' +
      '</svg>'
    );
  }

  function wordmark(size) {
    var fs = size || 27;
    return '<span class="s-wordmark" style="font-size:' + fs + 'px">Spurana</span>';
  }

  window.Brand = { sigil: sigil, wordmark: wordmark };

  // bilingual label map: [bengali, english, romanized?]
  var M = (window.BILING && typeof window.BILING === "object") ? window.BILING : {
    "Sacred Call": ["\u09aa\u09ac\u09bf\u09a4\u09cd\u09b0 \u0986\u09b9\u09cd\u09ac\u09be\u09a8", "Sacred Call", ""],
    "Vision Call": ["\u09a6\u09c3\u09b7\u09cd\u099f\u09bf-\u0986\u09b9\u09cd\u09ac\u09be\u09a8", "Vision Call", ""],
    "Watch Together": ["\u098f\u0995\u09b8\u0999\u09cd\u0997\u09c7 \u09a6\u09c7\u0996\u09be", "Watch Together", ""],
    "Listen Together": ["\u098f\u0995\u09b8\u09c1\u09b0\u09c7 \u09b6\u09cb\u09a8\u09be", "Listen Together", ""],
    "Pratidhwani": ["\u09aa\u09cd\u09b0\u09a4\u09bf\u09a7\u09cd\u09ac\u09a8\u09bf", "Echo Room", "Pratidhwani"],
    "Vanish Mode": ["\u0985\u09a8\u09cd\u09a4\u09b0\u09cd\u09a7\u09be\u09a8", "Vanish Mode", ""],
    "Souls": ["\u0986\u09a4\u09cd\u09ae\u09be", "Souls", ""],
    "Track Souls": ["\u0986\u09a4\u09cd\u09ae\u09be\u09b0 \u0996\u09cb\u0981\u099c", "Track Souls", ""],
    "Akashvani": ["\u0986\u0995\u09be\u09b6\u09ac\u09be\u09a3\u09c0", "Sky Voice", "Akashvani"],
    "Antordrishti": ["\u0985\u09a8\u09cd\u09a4\u09b0\u09cd\u09a6\u09c3\u09b7\u09cd\u099f\u09bf", "Inner Sight", "Antordrishti"],
    "Soul Tides": ["\u0986\u09a4\u09cd\u09ae\u09be\u09b0 \u099c\u09cb\u09df\u09be\u09b0", "Soul Tides", ""],
    "Jhankar": ["\u099d\u0999\u09cd\u0995\u09be\u09b0", "Buzz", "Jhankar"],
    "Meditation Zone": ["\u09a7\u09cd\u09af\u09be\u09a8", "Meditation", "Dhyan"],
    "Heart-Centred": ["\u09b9\u09c3\u09a6\u09df\u0995\u09c7\u09a8\u09cd\u09a6\u09cd\u09b0\u09bf\u0995", "Heart-Centred", "Hridoy"],
    "Antaryatra": ["\u0985\u09a8\u09cd\u09a4\u09b0\u09df\u09be\u09a4\u09cd\u09b0\u09be", "Inner Journey", "Antaryatra"],
    "Couple Practices": ["\u09af\u09c1\u0997\u09b2 \u09b8\u09be\u09a7\u09a8\u09be", "Couple Practice", ""],
    "The Oracle": ["\u09a6\u09c8\u09ac\u09ac\u09be\u09a3\u09c0", "The Oracle", "Doiboani"],
    "The Keeper": ["\u09b0\u0995\u09cd\u09b7\u0995", "The Keeper", "Rokkhok"],
    "Global Settings": ["\u09b8\u09c7\u099f\u09bf\u0982\u09b8", "Settings", ""],
  };
  window.BILING = M;

  // the resolver every screen uses: English → romanized, Bengali → script
  window.tl = function (englishKey) {
    var e = M[englishKey];
    if (!e) return { lead: englishKey, sub: "" };
    if (window.LANG === "bn") return { lead: e[0], sub: "" };            // pure Bengali script
    return { lead: e[1], sub: (e[2] && e[2] !== e[1]) ? e[2] : "" };     // English + romanized sacred word
  };
})();
