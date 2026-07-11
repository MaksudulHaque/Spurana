/* ============================================================
 * SPURANA · zones/practices.js  (STEP 8 — the "Together" hub)
 * Entry to the shared, per-couple experiences. Needs an active
 * bond (APP.activeConv). Cards route into the zone screens.
 * ============================================================ */
(function () {
  "use strict";
  Router.register("zones", function (root) {
    if (!APP.activeConv) { Router.go("chat"); return {}; }
    root.appendChild(topBar({ title: "Together", back: true }));
    const body = H.el("div", { class: "pad scroll grow stack reveal" });
    root.appendChild(body);
    body.appendChild(H.el("p", { class: "center", style: "font-family:var(--f-soul);font-style:italic;font-size:16px;color:var(--text-dim)" },
      "Shared moments for two souls."));

    function zcard(icon, title, desc, go, soon) {
      return H.el("button", {
        class: "zone-card" + (soon ? " soon" : ""),
        onClick: () => { if (soon) { toast("Weaving soon \u2726"); return; } Router.go(go); },
      }, [
        H.el("div", { class: "zc-icon" }, icon),
        H.el("div", { class: "zc-body" }, [
          H.el("div", { class: "zc-title" }, title + (soon ? "  \u00b7 soon" : "")),
          H.el("div", { class: "zc-desc" }, desc),
        ]),
      ]);
    }
    body.append(
      zcard("\uD83C\uDFAC", "Watch Together", "Share a link \u2014 experience it as one, perfectly in sync.", "watch"),
      zcard("\uD83C\uDFB4", "Soul Card", "Draw a card. The same prompt appears for you both.", "soulcard"),
      zcard("\uD83C\uDFA7", "Listen Together", "A shared song, two hearts in rhythm.", "listen", true),
    );
    return {};
  });
})();
