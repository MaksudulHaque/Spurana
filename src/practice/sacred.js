/* ============================================================
 * SPURANA · practice/sacred.js — the guided sanctuary.
 * Registers the meditation entry points and serves the deep
 * SCRIPTS through the Guide engine: a chooser of practices, a
 * duration picker, then a full narrated session — real voice
 * (once the TTS key is live), breath-paced, haptic, bilingual.
 * ============================================================ */
(function () {
  "use strict";

  // which scripts belong under each door
  var DOORS = {
    meditation: { title_en: "Meditation", title_bn: "\u09a7\u09cd\u09af\u09be\u09a8", keys: ["stillness", "body", "sleep"] },
    heart:      { title_en: "Heart-Centred", title_bn: "\u09b9\u09c3\u09a6\u09df\u0995\u09c7\u09a8\u09cd\u09a6\u09cd\u09b0\u09bf\u0995", keys: ["love", "union"] },
    couple:     { title_en: "Together", title_bn: "\u098f\u0995\u09b8\u0999\u09cd\u0997\u09c7", keys: ["union", "love"] },
    sleep:      { title_en: "Sleep", title_bn: "\u09a8\u09bf\u09a6\u09cd\u09b0\u09be", keys: ["sleep", "stillness"] },
  };

  function runScript(root, key) {
    var sc = window.SCRIPTS && window.SCRIPTS[key];
    if (!sc || !window.Guide) { root.appendChild(H.el("div", { class: "pad center muted" }, "This practice is resting.")); return {}; }
    var bn = (window.LANG === "bn");
    // Guide.mount handles picker → session; feed it our phases builder
    return window.Guide.mount(root, {
      title: bn ? sc.title_bn : sc.title_en,
      sound: sc.sound || "cosmos",
      defaultMin: sc.minutes,
      minutes: [sc.minutes, sc.minutes + 5, sc.minutes + 10, Math.max(5, sc.minutes - 6)].sort(function (a, b) { return a - b; }),
      phases: window.scriptToPhases(key, sc.minutes),
      rebuildPhases: function (min) { return window.scriptToPhases(key, min); },
      log: function (secs) { try { SP.shared.logPractice("med_logs", { kind: key, seconds: secs }); } catch (e) {} },
    });
  }

  function chooser(routeKey) {
    return function (root, query) {
      // deep-link: #/meditation?s=stillness runs directly
      if (query && query.s && window.SCRIPTS && window.SCRIPTS[query.s]) {
        root.appendChild(topBar({ title: "", back: true }));
        return runScript(root, query.s);
      }
      var door = DOORS[routeKey] || DOORS.meditation;
      var bn = (window.LANG === "bn");
      root.appendChild(topBar({ title: bn ? door.title_bn : door.title_en, back: true }));
      var body = H.el("div", { class: "pad scroll grow reveal", style: "display:flex;flex-direction:column;gap:14px" });
      root.appendChild(body);

      body.appendChild(H.el("p", { class: "guide-lead", style: "text-align:center;margin:6px 0 4px" },
        bn ? "\u098f\u0995\u099f\u09bf \u09b8\u09be\u09a7\u09a8\u09be \u09ac\u09c7\u099b\u09c7 \u09a8\u09be\u0993\u0964 \u0995\u09a3\u09cd\u09a0\u09b8\u09cd\u09ac\u09b0 \u09a4\u09cb\u09ae\u09be\u0995\u09c7 \u09aa\u09a5 \u09a6\u09c7\u0996\u09be\u09ac\u09c7\u0964" : "Choose a practice. A voice will hold you through it.")); 

      door.keys.forEach(function (key) {
        var sc = window.SCRIPTS[key]; if (!sc) return;
        var card = H.el("button", { class: "med-card", onClick: function () { Router.go(routeKey, { s: key }); } });
        card.appendChild(H.el("div", { class: "med-card-bn" }, bn ? sc.title_bn : sc.title_en));
        card.appendChild(H.el("div", { class: "med-card-en" }, (bn ? sc.title_en : sc.title_bn)));
        card.appendChild(H.el("div", { class: "med-card-min" }, sc.minutes + (bn ? " \u09ae\u09bf\u09a8\u09bf\u099f" : " min") + " \u00b7 " + (window.MedVoice && MedVoice.on && MedVoice.on() ? (bn ? "\u0995\u09a3\u09cd\u09a0\u09b8\u09cd\u09ac\u09b0" : "guided voice") : (bn ? "\u09a8\u09c0\u09b0\u09ac" : "silent"))));
        body.appendChild(card);
      });

      body.appendChild(H.el("p", { class: "center muted", style: "font-size:11px;opacity:.7;margin-top:6px" },
        bn ? "\u09b8\u09cd\u09aa\u09c1\u09b0\u09a3\u09c7\u09b0 \u0995\u09a3\u09cd\u09a0\u09b8\u09cd\u09ac\u09b0 \u09b8\u09c7\u099f\u09bf\u0982\u09b8\u09c7 \u09ac\u09a6\u09b2\u09be\u09a8\u09cb \u09af\u09be\u09df" : "Voice, language & gender adjust in Settings"));
      return { teardown: function () {} };
    };
  }

  Router.register("meditation", chooser("meditation"));
  Router.register("heart", chooser("heart"));
  Router.register("couple", chooser("couple"));
  Router.register("sleep", chooser("sleep"));
})();
