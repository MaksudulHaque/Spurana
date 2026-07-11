/* ============================================================
 * SPURANA · inner/journey.js  (Attayatra — the Inner Journey)
 * Solo, personal practice hub. Heart-centered breathing,
 * loving-kindness, and a spiritual learning library. Sessions
 * are logged to hc_logs via SP.shared.logPractice.
 * ============================================================ */
(function () {
  "use strict";
  Router.register("innerjourney", function (root) {
    root.appendChild(topBar({ title: "Inner Journey", back: true }));
    const body = H.el("div", { class: "pad scroll grow stack reveal" });
    root.appendChild(body);
    body.appendChild(H.el("div", { class: "center", style: "font-family:var(--f-sacred);font-size:15px;letter-spacing:.2em;color:var(--gold)" }, "\u0986\u09A4\u09CD\u09AE\u09AF\u09BE\u09A4\u09CD\u09B0\u09BE"));
    body.appendChild(H.el("p", { class: "center", style: "font-family:var(--f-soul);font-style:italic;font-size:16px;color:var(--text-dim)" },
      "Turn inward. The longest journey is the one to your own center."));

    function card(icon, title, desc, go) {
      return H.el("button", { class: "zone-card", onClick: () => Router.go(go) }, [
        H.el("div", { class: "zc-icon" }, icon),
        H.el("div", { class: "zc-body" }, [H.el("div", { class: "zc-title" }, title), H.el("div", { class: "zc-desc" }, desc)]),
      ]);
    }
    body.append(
      card("\uD83C\uDF2C", "Breathe", "Guided breath \u2014 calm the body, steady the mind.", "breathe"),
      card("\uD83D\uDC97", "Loving-Kindness", "Metta \u2014 send warmth to yourself, your beloved, all beings.", "metta"),
      card("\uD83D\uDD49", "Antaryatra", "The seven-stage inner pilgrimage \u2014 voice-guided, timed to you.", "antaryatra"),
      H.el("button", { class: "zone-card", onClick: () => Router.go("practice", { id: "silence" }) }, [
        H.el("div", { class: "zc-icon" }, "\uD83E\uDDD8"),
        H.el("div", { class: "zc-body" }, [H.el("div", { class: "zc-title" }, "Sit in Silence"), H.el("div", { class: "zc-desc" }, "Open stillness, held by bells. Choose your length.")]),
      ]),
      card("\uD83D\uDCDA", "Spiritual Learning", "Wisdom from the contemplative traditions, to study and practice.", "learn"),
    );
    return {};
  });
})();
