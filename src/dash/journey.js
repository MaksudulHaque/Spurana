/* ============================================================
 * SPURANA · dash/journey.js  (STEP 10)
 * The Settings hub (name editor + links) and "Your Journey" —
 * a timeline of your activity_log via SP.activity.recent.
 * ============================================================ */
(function () {
  "use strict";

  function rel(iso) {
    const t = iso ? new Date(iso).getTime() : 0; if (!t) return "";
    const m = (Date.now() - t) / 60000;
    if (m < 1) return "just now"; if (m < 60) return Math.floor(m) + "m ago";
    const h = m / 60; if (h < 24) return Math.floor(h) + "h ago";
    const d = h / 24; if (d < 30) return Math.floor(d) + "d ago";
    return new Date(t).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  }
  const KINDS = {
    signup: { i: "\u2726", t: "Awakened into Spurana" },
    login: { i: "\u263D", t: "Returned to the sanctuary" },
    pair_redeem: { i: "\uD83D\uDD17", t: "Bonded with a soul" },
    pair_create: { i: "\u2709", t: "Sent an invitation" },
    call: { i: "\u260E", t: "Shared a call" },
  };

  Router.register("settings", function (root) {
    root.appendChild(topBar({ title: "Settings", back: true }));
    const body = H.el("div", { class: "pad scroll grow stack reveal" });
    root.appendChild(body);

    // name editor (fixes empty display names)
    const name = H.el("input", { class: "input", value: (APP.profile && APP.profile.name) || "", placeholder: "Your name" });
    const save = H.el("button", { class: "btn btn-primary", onClick: async () => {
      const v = name.value.trim(); if (!v) { toast("Enter a name.", true); return; }
      const { error } = await SP.profile.update({ name: v });
      if (error) { toast("Couldn't save.", true); return; }
      APP.profile = APP.profile || {}; APP.profile.name = v; toast("Saved \u2726");
    } }, "Save");
    body.appendChild(H.el("div", { class: "card" }, [
      H.el("div", { class: "f-label" }, "Your name"),
      H.el("div", { class: "row", style: "gap:8px" }, [name, save]),
    ]));

    // ── Sound, Voice & Language ──
    (function () {
      var MV = window.MedVoice;
      var c = H.el("div", { class: "card stack", style: "gap:14px" });
      c.appendChild(H.el("div", { class: "f-label" }, "Sound, Voice & Language"));

      // language
      function langRow() {
        var row = H.el("div", { class: "row", style: "gap:8px" });
        ["en", "bn"].forEach(function (L) {
          var on = (window.LANG || "en") === L;
          row.appendChild(H.el("button", { class: "btn" + (on ? " btn-primary" : " btn-ghost"), style: "flex:1",
            onClick: function () { window.setLang(L); toast(L === "bn" ? "\u09ad\u09be\u09b7\u09be: \u09ac\u09be\u0982\u09b2\u09be \u2726" : "Language: English \u2726"); Router.go("settings"); } },
            L === "bn" ? "\u09ac\u09be\u0982\u09b2\u09be" : "English"));
        });
        return row;
      }
      c.appendChild(H.el("div", {}, [H.el("div", { class: "zc-desc", style: "margin-bottom:6px" }, "Guidance language"), langRow()]));

      if (MV) {
        // guide voice gender
        var grow = H.el("div", { class: "row", style: "gap:8px" });
        [["her", "Her"], ["him", "Him"]].forEach(function (g) {
          var on = MV.gender() === g[0];
          grow.appendChild(H.el("button", { class: "btn" + (on ? " btn-primary" : " btn-ghost"), style: "flex:1",
            onClick: function () { MV.setGender(g[0]); MV.speak(window.T("This is my voice.", "\u098f\u0987 \u0986\u09ae\u09be\u09b0 \u0995\u09a3\u09cd\u09a0\u09b8\u09cd\u09ac\u09b0\u0964")); Router.go("settings"); } }, g[1]));
        });
        c.appendChild(H.el("div", {}, [H.el("div", { class: "zc-desc", style: "margin-bottom:6px" }, "Narrator"), grow]));

        // device voice picker (the most human voice your phone has)
        try {
          var list = MV.listVoices ? MV.listVoices() : [];
          if (list.length) {
            var sel = H.el("select", { class: "input" });
            sel.appendChild(H.el("option", { value: "" }, "Auto (best available)"));
            list.forEach(function (v) { var o = H.el("option", { value: v.uri }, v.name + " \u00b7 " + v.lang); if (v.uri === MV.currentVoiceURI()) o.setAttribute("selected", "selected"); sel.appendChild(o); });
            sel.addEventListener("change", function () { MV.setVoice(sel.value); MV.speak(window.T("This is my voice.", "\u098f\u0987 \u0986\u09ae\u09be\u09b0 \u0995\u09a3\u09cd\u09a0\u09b8\u09cd\u09ac\u09b0\u0964")); });
            c.appendChild(H.el("div", {}, [H.el("div", { class: "zc-desc", style: "margin-bottom:6px" }, "Voice (uses your phone's voices)"), sel]));
            if (window.LANG === "bn" && !MV.hasBangla()) c.appendChild(H.el("div", { class: "zc-desc", style: "color:var(--gold)" }, "No Bangla voice found on this device \u2014 install a Bangla text-to-speech voice in your phone settings for spoken Bangla."));
          }
        } catch (e) {}

        // breath vibration
        var hOn = MV.haptic();
        var hb = H.el("button", { class: "btn" + (hOn ? " btn-primary" : " btn-ghost"), style: "width:100%" }, hOn ? "Breath vibration: On" : "Breath vibration: Off");
        hb.onclick = function () { MV.setHaptic(!MV.haptic()); Router.go("settings"); };
        c.appendChild(H.el("div", {}, [H.el("div", { class: "zc-desc", style: "margin-bottom:6px" }, "Feel the breath as a pulse (Android)"), hb]));
        // vibration test + truth: shows exactly which motor path this phone has
        var tb = H.el("button", { class: "btn btn-ghost", style: "width:100%;margin-top:8px" }, "Test the pulse \u26A1");
        tb.onclick = function () {
          var Cap = window.Capacitor;
          var hp = !!(Cap && Cap.Plugins && Cap.Plugins.Haptics);
          var nv = !!navigator.vibrate;
          var isN = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
          var msg = (isN ? "native app" : "browser") + " \u00b7 haptics plugin: " + (hp ? "yes" : "NO") + " \u00b7 web vibrate: " + (nv ? "yes" : "NO");
          try {
            if (hp) { Cap.Plugins.Haptics.vibrate({ duration: 400 }); msg = "FIRED native motor 400ms \u00b7 " + msg; }
            else if (nv) { navigator.vibrate([300, 120, 300]); msg = "FIRED web vibrate \u00b7 " + msg; }
            else msg = "NO vibration path exists \u00b7 " + msg;
          } catch (e) { msg = "threw: " + (e && e.message) + " \u00b7 " + msg; }
          if (window.toast) toast(msg);
        };
        c.appendChild(tb);
      }
      body.appendChild(c);
    })();

    function link(icon, title, go) {
      return H.el("button", { class: "zone-card", onClick: () => Router.go(go) }, [
        H.el("div", { class: "zc-icon" }, icon),
        H.el("div", { class: "zc-body" }, [H.el("div", { class: "zc-title" }, title)]),
      ]);
    }
    body.append(
      link("\uD83C\uDF0C", "World & Atmosphere", "world"),
      link("\u26A1", "Performance", "perf"),
      link("\uD83D\uDDFA", "Your Journey", "journey"),
      link("\uD83D\uDD12", "Security", "security"),
      link("\uD83D\uDEE1", "Privacy & Data", "privacy"),
    );
    if (!(window.isStandalone && window.isStandalone())) {
      body.appendChild(H.el("button", { class: "zone-card", onClick: () => window.installApp && window.installApp() }, [
        H.el("div", { class: "zc-icon" }, "\u2B07"),
        H.el("div", { class: "zc-body" }, [
          H.el("div", { class: "zc-title" }, "Install Spurana"),
          H.el("div", { class: "zc-desc" }, "Add it to your home screen \u2014 opens like a real app, works offline."),
        ]),
      ]));
    }
    body.appendChild(H.el("button", { class: "btn btn-danger btn-block", style: "margin-top:8px", onClick: () => Session.logout() }, "Sign out"));
    body.appendChild(H.el("div", { class: "nwp-credit" }, "NWP \u00b7 Sacred Architecture \u00b7 v6 \u00b7 2026"));
    return {};
  });

  Router.register("journey", function (root) {
    root.appendChild(topBar({ title: "Your Journey", back: true }));
    const body = H.el("div", { class: "pad scroll grow reveal" });
    root.appendChild(body);
    body.appendChild(H.el("div", { class: "faint center", style: "padding:14px" }, "Gathering your steps\u2026"));

    (async () => {
      const { data, error } = await SP.activity.recent(60);
      H.clear(body);
      if (error || !data || !data.length) {
        body.appendChild(H.el("div", { class: "empty" }, [
          H.el("div", { class: "big" }, "\uD83D\uDDFA"),
          H.el("p", { class: "muted", style: "font-family:var(--f-soul);font-style:italic" }, "Your journey is just beginning."),
        ]));
        return;
      }
      const tl = H.el("div", { class: "timeline" });
      data.forEach((e) => {
        const k = KINDS[e.kind] || { i: "\u2022", t: e.kind || "A moment" };
        tl.appendChild(H.el("div", { class: "tl-item" }, [
          H.el("div", { class: "tl-dot" }, k.i),
          H.el("div", { class: "tl-body" }, [
            H.el("div", { class: "tl-title" }, k.t),
            H.el("div", { class: "tl-time" }, rel(e.created_at)),
          ]),
        ]));
      });
      body.appendChild(tl);
    })();
    return {};
  });
})();
