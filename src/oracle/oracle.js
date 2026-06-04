/* ============================================================
 * SPURANA · oracle/oracle.js — The Oracle · Past Lives · Keeper
 * Interactive, content-driven, no backend.
 * ============================================================ */
(function () {
  "use strict";
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  // ── The Oracle ──
  const ANSWERS = [
    "Yes \u2014 but let it ripen before you act.", "The stars lean toward you. Trust it.",
    "Not yet. What you seek is still becoming.", "Look again \u2014 the answer changed when you did.",
    "Speak it aloud to the one you love. Then you'll know.", "The quieter path is the true one.",
    "Hold. The river will carry you if you stop pushing.", "Yes, and sooner than you fear.",
    "This is a door, not a wall. Step through.", "Let go of the outcome and the way opens.",
    "Your heart already answered. Your mind is catching up.", "Wait for the new moon. Then move.",
  ];
  Router.register("oracle", function (root) {
    root.appendChild(topBar({ title: "The Oracle", back: true }));
    const body = H.el("div", { class: "pad scroll grow stack reveal", style: "align-items:center" });
    root.appendChild(body);
    const sigil = H.el("div", { class: "oracle-eye" }, "\uD83D\uDD2E");
    const q = H.el("input", { class: "input", placeholder: "Ask, and breathe\u2026", style: "max-width:420px" });
    const ans = H.el("p", { class: "oracle-answer", style: "opacity:0" }, "");
    const consult = H.el("button", { class: "sacred-btn", onClick: () => {
      sigil.classList.add("spin");
      ans.style.opacity = "0";
      setTimeout(() => { ans.textContent = pick(ANSWERS); ans.style.opacity = "1"; sigil.classList.remove("spin"); }, 900);
    } }, "Consult \u2726");
    body.append(sigil, q, consult, ans);
    return {};
  });

  // ── Past Lives ──
  const ERAS = ["ancient Egypt", "the Heian court of Japan", "a Greek island before the myths", "Mughal India", "the silk roads of Persia", "a Norse coastal village", "the libraries of Alexandria", "Renaissance Florence", "a temple town in old Bengal", "the Andes before the conquest"];
  const ROLES = [["a wandering poet", "the one who copied your verses by candlelight"], ["a temple dancer", "the drummer who knew your every turn"], ["a sea captain", "the keeper of the lighthouse you sailed home to"], ["a healer", "the soldier you refused to let die"], ["an astronomer", "the one who named a star for you"], ["a weaver", "the merchant who crossed deserts for your cloth"], ["a rebel", "the scribe who hid your letters"]];
  const ENDINGS = ["You found each other in a crowded market and never let go.", "You were parted by a war and promised to meet again. Here you are.", "You grew old on the same porch, watching the same sea.", "You met only once, for an hour, and it was enough to echo here.", "You wrote each other letters you never sent. You're sending them now."];
  Router.register("pastlives", function (root) {
    root.appendChild(topBar({ title: "Past Lives", back: true }));
    const body = H.el("div", { class: "pad scroll grow stack reveal", style: "align-items:center" });
    root.appendChild(body);
    const card = H.el("div", { class: "pastlife-card" }, H.el("p", { class: "muted", style: "font-family:var(--f-soul);font-style:italic" }, "Who were you to each other, before this life?"));
    const reveal = H.el("button", { class: "sacred-btn", onClick: draw }, "Reveal a past life \u2726");
    let last = "";
    function draw() {
      const era = pick(ERAS), roles = pick(ROLES), end = pick(ENDINGS);
      last = "In " + era + ", you were " + roles[0] + ", and they were " + roles[1] + ". " + end;
      H.clear(card);
      card.appendChild(H.el("p", { style: "font-family:var(--f-soul);font-style:italic;font-size:19px;line-height:1.6;color:#eaccff" }, last));
      share.classList.remove("hidden");
    }
    const share = H.el("button", { class: "btn btn-ghost hidden", onClick: async () => { if (!last) return; if (!APP.activeConv) { toast("Open your bond to share."); return; } await SP.chat.send(APP.activeConv, { text: "\u267E " + last }); toast("Shared in your chat \u2726"); } }, "Share with your soul");
    body.append(card, reveal, share);
    return {};
  });

  // ── The Keeper ──
  Router.register("keeper", function (root) {
    root.appendChild(topBar({ title: "The Keeper", back: true }));
    const body = H.el("div", { class: "pad scroll grow stack reveal", style: "align-items:center;text-align:center" });
    root.appendChild(body);
    body.appendChild(window.sigil ? window.sigil() : H.el("div", null, "\u2726"));
    body.appendChild(H.el("div", { class: "s-wordmark", style: "margin-top:10px" }, "Spurana"));
    body.appendChild(H.el("p", { style: "font-family:var(--f-soul);font-style:italic;font-size:18px;color:var(--text-dim);max-width:340px" }, "A sacred space to talk with your soul \u2014 and the one you love. Built not as a product, but as a vow: that two people, however far apart, can always find their way back to one another."));
    body.appendChild(H.el("div", { class: "card", style: "max-width:380px" }, [
      H.el("div", { class: "f-label" }, "Dedication"),
      H.el("p", { class: "muted", style: "font-family:var(--f-soul);font-style:italic" }, "For the ones who keep choosing each other."),
    ]));
    body.appendChild(H.el("div", { class: "nwp-credit", style: "margin-top:10px" }, "NWP \u00b7 Sacred Architecture \u00b7 v6 \u00b7 2026"));
    return {};
  });
})();
