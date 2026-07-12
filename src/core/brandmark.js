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
    size = size || 40;
    var g = glow ? ' style="filter:drop-shadow(0 0 12px rgba(232,0,154,.5))"' : "";
    return (
      '<svg viewBox="0 0 64 64" width="' + size + '" height="' + size + '"' + g +
      ' fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Spurana">' +
      '<defs><linearGradient id="spg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">' +
      '<stop stop-color="var(--gold-bright,#E2C28A)"/><stop offset="1" stop-color="var(--q-bright,#E8009A)"/></linearGradient>' +
      '<radialGradient id="spc" cx="50%" cy="50%" r="50%"><stop stop-color="var(--q-bright,#E8009A)" stop-opacity=".25"/><stop offset="1" stop-color="var(--q,#C0007A)" stop-opacity="0"/></radialGradient></defs>' +
      '<circle cx="32" cy="32" r="30" fill="url(#spc)"/>' +
      '<path d="M32 4C34 14 40 18 40 18C40 18 34 22 32 30C30 22 24 18 24 18C24 18 30 14 32 4Z" fill="url(#spg)" opacity=".92"/>' +
      '<path d="M60 32C50 34 46 40 46 40C46 40 42 34 34 32C42 30 46 24 46 24C46 24 50 30 60 32Z" fill="url(#spg)" opacity=".5"/>' +
      '<path d="M4 32C14 34 18 40 18 40C18 40 22 34 30 32C22 30 18 24 18 24C18 24 14 30 4 32Z" fill="url(#spg)" opacity=".5"/>' +
      '<path d="M32 60C30 50 24 46 24 46C24 46 30 42 32 34C34 42 40 46 40 46C40 46 34 50 32 60Z" fill="url(#spg)" opacity=".92"/>' +
      '<path d="M38 26C38 22.5 35 20.5 31.5 20.5C28 20.5 25.5 22.5 25.5 25.5C25.5 31.5 38 30 38 37C38 40.5 34.5 43 30.5 43C26.5 43 24 40.5 24 37.5" ' +
      'stroke="url(#spg)" stroke-width="3.4" stroke-linecap="round"/>' +
      "</svg>"
    );
  }
  function wordmark(size) {
    return '<span class="sp-wordmark">' + sigil(size || 34, true) + '<span class="sp-word">SPURANA</span></span>';
  }

  // [ bengaliScript, english, romanized ]
  var M = {
    "Sacred Call":      ["\u09aa\u09ac\u09bf\u09a4\u09cd\u09b0 \u0986\u09b9\u09cd\u09ac\u09be\u09a8", "Sacred Call", "Pobitro Ahvan"],
    "Vision Call":      ["\u09a6\u09c3\u09b7\u09cd\u099f\u09bf-\u0986\u09b9\u09cd\u09ac\u09be\u09a8", "Vision Call", "Drishti Ahvan"],
    "Watch Together":   ["\u098f\u0995\u09b8\u0999\u09cd\u0997\u09c7 \u09a6\u09c7\u0996\u09be", "Watch Together", "Eksonge Dekha"],
    "Listen Together":  ["\u098f\u0995\u09b8\u09c1\u09b0\u09c7 \u09b6\u09cb\u09a8\u09be", "Listen Together", "Eksure Shona"],
    "Pratidhwani":      ["\u09aa\u09cd\u09b0\u09a4\u09bf\u09a7\u09cd\u09ac\u09a8\u09bf", "Echo Room", "Protidhwoni"],
    "Vanish Mode":      ["\u0985\u09a8\u09cd\u09a4\u09b0\u09cd\u09a7\u09be\u09a8", "Vanish Mode", "Ontordhan"],
    "Souls":            ["\u0986\u09a4\u09cd\u09ae\u09be", "Souls", "Atma"],
    "Track Souls":      ["\u0986\u09a4\u09cd\u09ae\u09be\u09b0 \u0996\u09cb\u0981\u099c", "Track Souls", "Atmar Khonj"],
    "Akashvani":        ["\u0986\u0995\u09be\u09b6\u09ac\u09be\u09a3\u09c0", "Sky Voice", "Akashbani"],
    "Antordrishti":     ["\u0985\u09a8\u09cd\u09a4\u09b0\u09cd\u09a6\u09c3\u09b7\u09cd\u099f\u09bf", "Inner Sight", "Ontordrishti"],
    "Soul Tides":       ["\u0986\u09a4\u09cd\u09ae\u09be\u09b0 \u099c\u09cb\u09df\u09be\u09b0", "Soul Tides", "Atmar Joyar"],
    "Meditation Zone":  ["\u09a7\u09cd\u09af\u09be\u09a8", "Meditation", "Dhyan"],
    "Heart-Centred":    ["\u09b9\u09c3\u09a6\u09df\u0995\u09c7\u09a8\u09cd\u09a6\u09cd\u09b0\u09bf\u0995", "Heart-Centred", "Hridoykendrik"],
    "Antaryatra":       ["\u0985\u09a8\u09cd\u09a4\u09b0\u09df\u09be\u09a4\u09cd\u09b0\u09be", "Inner Journey", "Antaryatra"],
    "Couple Practices": ["\u09af\u09c1\u0997\u09b2 \u09b8\u09be\u09a7\u09a8\u09be", "Couple Practice", "Jugol Sadhona"],
    "Learning Zone":    ["\u09b6\u09bf\u0995\u09cd\u09b7\u09be", "Learning", "Shiksha"],
    "Reminders":        ["\u09b8\u09cd\u09ae\u09b0\u09a3", "Reminders", "Smoron"],
    "Sacred Games":     ["\u09aa\u09ac\u09bf\u09a4\u09cd\u09b0 \u0996\u09c7\u09b2\u09be", "Sacred Games", "Pobitro Khela"],
    "Inner Journey":    ["\u0985\u09a8\u09cd\u09a4\u09b0\u09df\u09be\u09a4\u09cd\u09b0\u09be", "Inner Journey", "Antaryatra"],
    "The Oracle":       ["\u09a6\u09c8\u09ac\u09ac\u09be\u09a3\u09c0", "The Oracle", "Doiboani"],
    "Past Lives":       ["\u09aa\u09c2\u09b0\u09cd\u09ac\u099c\u09a8\u09cd\u09ae", "Past Lives", "Purbojonmo"],
    "Memory Vault":     ["\u09b8\u09cd\u09ae\u09c3\u09a4\u09bf\u0995\u09cb\u09b7", "Memory Vault", "Smritikosh"],
    "Love Letters":     ["\u09aa\u09cd\u09b0\u09c7\u09ae\u09aa\u09a4\u09cd\u09b0", "Love Letters", "Prempotro"],
    "Sacred Days":      ["\u09aa\u09ac\u09bf\u09a4\u09cd\u09b0 \u09a6\u09bf\u09a8", "Sacred Days", "Pobitro Din"],
    "Gratitude":        ["\u0995\u09c3\u09a4\u099c\u09cd\u099e\u09a4\u09be", "Gratitude", "Kritoggota"],
    "Today":            ["\u0986\u099c", "Today", "Aaj"],
    "Daily Ritual":     ["\u09a6\u09c8\u09a8\u09a8\u09cd\u09a6\u09bf\u09a8 \u0986\u099a\u09be\u09b0", "Daily Ritual", "Doinondin Achar"],
    "Deeper Memory":    ["\u0997\u09b9\u09a8 \u09b8\u09cd\u09ae\u09c3\u09a4\u09bf", "Deeper Memory", "Gohon Smriti"],
    "Sacred Rooms":     ["\u09aa\u09ac\u09bf\u09a4\u09cd\u09b0 \u0995\u0995\u09cd\u09b7", "Sacred Rooms", "Pobitro Kokkho"],
    "Connection Tree":  ["\u09ac\u09a8\u09cd\u09a7\u09a8\u09ac\u09c3\u0995\u09cd\u09b7", "Bond Tree", "Bondhonbrikkho"],
    "Our Stats":        ["\u0986\u09ae\u09be\u09a6\u09c7\u09b0 \u09b8\u09cd\u09aa\u09a8\u09cd\u09a6\u09a8", "Our Stats", "Amader Spondon"],
    "Soul Weather":     ["\u09ae\u09a8\u09c7\u09b0 \u0986\u09ac\u09b9\u09be\u0993\u09df\u09be", "Soul Weather", "Moner Abhaowa"],
    "Soul Qi":          ["\u09aa\u09cd\u09b0\u09be\u09a3\u09b6\u0995\u09cd\u09a4\u09bf", "Soul Qi", "Pranshokti"],
    "Deeper Reflection":["\u0997\u09b9\u09a8 \u09aa\u09cd\u09b0\u09a4\u09bf\u09ac\u09bf\u09ae\u09cd\u09ac", "Deeper Reflection", "Gohon Protibimbo"],
    "Mood Worlds":      ["\u09ad\u09be\u09ac\u09ac\u09bf\u09b6\u09cd\u09ac", "Mood Worlds", "Bhabbishwo"],
    "All Worlds":       ["\u09b8\u0995\u09b2 \u09ac\u09bf\u09b6\u09cd\u09ac", "All Worlds", "Sokol Bishwo"],
    "Divine Guide":     ["\u09a6\u09bf\u09ac\u09cd\u09af \u09aa\u09a5\u09aa\u09cd\u09b0\u09a6\u09b0\u09cd\u09b6\u0995", "Divine Guide", "Dibbo Pothoprodorshok"],
    "Global Settings":  ["\u09b8\u09c7\u099f\u09bf\u0982\u09b8", "Settings", "Settings"],
    "Divine Voice":     ["\u09a6\u09bf\u09ac\u09cd\u09af \u0995\u09a3\u09cd\u09a0\u09b8\u09cd\u09ac\u09b0", "Divine Voice", "Dibbo Konthoshor"],
    "Performance":      ["\u0995\u09be\u09b0\u09cd\u09af\u0995\u09cd\u09b7\u09ae\u09a4\u09be", "Performance", "Karjokkhomota"],
    "Binaural":         ["\u09a6\u09cd\u09ac\u09bf-\u09b6\u09cd\u09b0\u09be\u09ac\u09cd\u09af", "Binaural", "Dwi-shrabbo"],
    "Fullscreen":       ["\u09aa\u09c2\u09b0\u09cd\u09a3\u09aa\u09b0\u09cd\u09a6\u09be", "Fullscreen", "Purnoporda"],
    "The Keeper":       ["\u09b0\u0995\u09cd\u09b7\u0995", "The Keeper", "Rokkhok"],
  };

  window.Brand = { sigil: sigil, wordmark: wordmark };
  window.BILING = M;

  // the resolver every screen uses: English → romanized, Bengali → script
  window.tl = function (englishKey) {
    var e = M[englishKey];
    if (!e) return { lead: englishKey, sub: "" };
    if (window.LANG === "bn") return { lead: e[0], sub: "" };            // pure Bengali script
    return { lead: e[1], sub: (e[2] && e[2] !== e[1]) ? e[2] : "" };     // English + romanized sacred word
  };
})();
