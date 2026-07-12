/* ============================================================
 * SPURANA · sanctuary/hub.js — THE SANCTUARY
 * "Where shall you go? Everything, in one place."
 * The master launcher. Live tiles route to built screens;
 * not-yet-built tiles greet gently. This is the post-login home.
 * ============================================================ */
(function () {
  "use strict";

  // route to a screen that needs the bonded conversation; resolve the partner if needed
  function withConv(go) {
    if (APP.activeConv) return go(APP.activeConv);
    (async () => {
      try {
        const { data } = await SP.contacts.list();
        const c = data && data[0];
        const puid = c && (c.contact_uid || c.partner_uid || c.uid);
        if (puid && APP.me) {
          const cid = SP.convIdFor(APP.me.id, puid);
          APP.activeConv = cid;
          if (!APP.partner) APP.partner = { uid: puid, name: c.contact_name || c.name || "Your beloved" };
          go(cid);
        } else { toast("Bond with a soul first \u2726"); Router.go("chat"); }
      } catch (e) { Router.go("chat"); }
    })();
  }
  const soon = () => toast("Weaving soon \u2726");
  function fullscreen() { try { const d = document; if (!d.fullscreenElement) (d.documentElement.requestFullscreen || function () {}).call(d.documentElement); else (d.exitFullscreen || function () {}).call(d); } catch (e) {} }

  // section -> tiles. each tile: [icon, title, subtitle, handler]
  const TINT = { "Connect": "232,0,154", "Journey Inward": "150,90,230", "Remember": "226,194,138", "Reflect": "40,200,180", "Worlds": "90,140,255", "Settings": "120,210,130" };
  const SECTIONS = [
    ["Connect", [
      ["\u260E", "Sacred Call", "real-time p2p", () => withConv((c) => window.Calls && Calls.start(c, "audio", APP.partner))],
      ["\uD83C\uDF9E", "Vision Call", "real-time p2p", () => withConv((c) => window.Calls && Calls.start(c, "video", APP.partner))],
      ["\uD83C\uDFAC", "Watch Together", "watch together", () => withConv(() => Router.go("watch"))],
      ["\uD83C\uDFB5", "Listen Together", "music in sync", () => withConv(() => Router.go("listen"))],
      ["\uD83C\uDF00", "Pratidhwani", "spaced echo room", () => withConv(() => Router.go("pratidhwani"))],
      ["\uD83E\uDEE5", "Vanish Mode", "vanishing channel", () => withConv(() => Router.go("vanish"))],
      ["__SIGIL__", "Souls", "your souls", () => Router.go("chat")],
      ["\uD83E\uDDED", "Track Souls", "live location", () => withConv(() => Router.go("track"))],
      ["\u26A1", "Akashvani", "emergency live voice", () => withConv(() => Router.go("akash"))],
      ["\uD83D\uDC41\uFE0F", "Antordrishti", "live sight \u00b7 always on", () => withConv(() => Router.go("antor"))],
      ["\uD83C\uDF0A", "Soul Tides", "feel their world", () => withConv(() => Router.go("tides"))],
      ["\u26A1", "Jhankar", "buzz their world", () => withConv(() => Router.go("buzz"))],
    ]],
    ["Journey Inward", [
      ["\uD83E\uDDD8", "Meditation Zone", "fully guided", () => Router.go("meditation")],
      ["\uD83D\uDC97", "Heart-Centred", "fully guided", () => Router.go("heart")],
      ["\uD83D\uDD49", "Antaryatra", "inner pilgrimage", () => Router.go("antaryatra")],
      ["\uD83D\uDC91", "Couple Practices", "step-by-step", () => Router.go("couple")],
      ["\uD83D\uDCD8", "Learning Zone", "self-paced path", () => Router.go("learn")],
      ["\u23F0", "Reminders", "gentle nudges", () => withConv(() => Router.go("reminders"))],
      ["\uD83C\uDCCF", "Sacred Games", "play together", () => Router.go("games")],
      ["\uD83E\uDEB7", "Inner Journey", "practices", () => Router.go("innerjourney")],
      ["\uD83D\uDD2E", "The Oracle", "interactive", () => Router.go("oracle")],
      ["\u267E", "Past Lives", "interactive", () => Router.go("pastlives")],
    ]],
    ["Remember", [
      ["\uD83D\uDC8E", "Memory Vault", "self-managed", () => withConv(() => Router.go("vault"))],
      ["\uD83D\uDC8C", "Love Letters", "self-managed", () => withConv(() => Router.go("letters"))],
      ["\uD83D\uDD34", "Sacred Days", "self-managed", () => withConv(() => Router.go("days"))],
      ["\uD83C\uDF1F", "Gratitude", "self-managed", () => withConv(() => Router.go("gratitude"))],
      ["\uD83C\uDF15", "Today", "daily ritual", () => withConv(() => Router.go("ritual"))],
      ["\uD83D\uDD25", "Daily Ritual", "", () => withConv(() => Router.go("ritual"))],
      ["\uD83D\uDCDC", "Deeper Memory", "", () => withConv(() => Router.go("vault"))],
    ]],
    ["Reflect", [
      ["\uD83C\uDFE0", "Sacred Rooms", "", () => Router.go("world")],
      ["\uD83C\uDF33", "Connection Tree", "", () => withConv(() => Router.go("tree"))],
      ["\uD83D\uDCCA", "Our Stats", "live tracking", () => withConv(() => Router.go("stats"))],
      ["\uD83C\uDF26", "Soul Weather", "daily check-in", () => withConv(() => Router.go("weather"))],
      ["\u2600", "Soul Qi", "ki-field", () => withConv(() => Router.go("qi"))],
      ["\uD83D\uDCAD", "Deeper Reflection", "", () => withConv(() => Router.go("reflection"))],
    ]],
    ["Worlds", [
      ["\uD83C\uDFE0", "Sacred Rooms", "", soon],
      ["\uD83C\uDF11", "Mood Worlds", "worlds", () => Router.go("world")],
      ["\uD83C\uDF0D", "All Worlds", "worlds", () => Router.go("world")],
      ["\uD83C\uDFEF", "Divine Guide", "the divines", () => Router.go("divine")],
    ]],
    ["Settings", [
      ["\u2699", "Global Settings", "", () => Router.go("settings")],
      ["\uD83C\uDF99", "Divine Voice", "", () => Router.go("divine")],
      ["\u26A1", "Performance", "", () => Router.go("perf")],
      ["\uD83C\uDFA7", "Binaural", "", () => Router.go("binaural")],
      ["\u26F6", "Fullscreen", "", fullscreen],
      ["\uD83D\uDD11", "The Keeper", "", () => Router.go("keeper")],
    ]],
  ];

  Router.register("sanctuary", function (root) {
    try { document.documentElement.setAttribute("data-screen", "sanctuary"); } catch (e) {}
    // freeze the cosmic canvas → a still, faded frame (smooth scroll, no per-frame filtering)
    try { if (window._cosmicRaf) { cancelAnimationFrame(window._cosmicRaf); window._cosmicRaf = null; } } catch (e) {}
    const head = H.el("div", { class: "sanctuary-head" }, [
      H.el("div", { class: "s-eyebrow" }, "The Sanctuary"),
      H.el("div", { class: "s-wordmark" }, "Where shall you go?"),
      H.el("div", { class: "s-sub" }, "Everything, in one place."),
    ]);
    const scroll = H.el("div", { class: "scroll grow sanctuary-scroll" }, [head]);
    requestAnimationFrame(function () { try { scroll.scrollTop = 0; } catch (e) {} });
    root.appendChild(scroll);

    SECTIONS.forEach(([label, tiles]) => {
      scroll.appendChild(H.el("div", { class: "s-section" }, label));
      const grid = H.el("div", { class: "s-grid" });
      tiles.forEach(([icon, title, sub, fn]) => {
        const ic = H.el("div", { class: "s-ico" });
        if (icon === "__SIGIL__" && window.Brand) ic.innerHTML = Brand.sigil(30); else if (window.ICONS && window.ICONS[title]) ic.innerHTML = window.ICONS[title]; else ic.textContent = icon;
        var tt = window.tl ? tl(title) : { lead: title, sub: "" };
        var isBn = (window.LANG === "bn");
        grid.appendChild(H.el("button", { class: "s-tile", onClick: fn }, [
          ic,
          H.el("div", { class: isBn ? "s-title-lead bn" : "s-title-lead en" }, tt.lead),
          tt.sub ? H.el("div", { class: "s-title-rom" }, tt.sub) : null,
        ]));
      });
      scroll.appendChild(grid);
    });
    var cred = H.el("div", { class: "nwp-credit", style: "padding:24px 0 40px;text-align:center" }); if (window.Brand) cred.innerHTML = Brand.wordmark(24) + '<div style="font-family:var(--f-ui);font-size:9px;letter-spacing:.3em;color:var(--text-dim);margin-top:8px">\u09b8\u09cd\u09aa\u09c1\u09b0\u09a3 \u00b7 A SACRED SPACE FOR TWO SOULS</div>'; scroll.appendChild(cred);
    return { teardown: function () { try { document.documentElement.removeAttribute("data-screen"); if (window.startCosmos && !window._cosmicRaf) window.startCosmos(); } catch (e) {} } };
  });
})();
