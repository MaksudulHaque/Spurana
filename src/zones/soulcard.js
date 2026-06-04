/* ============================================================
 * SPURANA · zones/soulcard.js  (STEP 8 — shared Soul Card)
 * A flip card drawing a reflective prompt. The draw is SYNCED:
 * whoever draws writes {card_index} to SP.shared.soulCard, and
 * both partners see the same card. "Answer in chat" sends it to
 * the thread so the conversation deepens.
 * ============================================================ */
(function () {
  "use strict";

  const DECK = [
    "What did you feel the first moment you knew you wanted me?",
    "Which small thing I do makes you feel most loved?",
    "What is a fear you've never said aloud to me?",
    "When do you feel closest to me?",
    "What does a perfect ordinary day with me look like?",
    "What part of yourself have I helped you accept?",
    "What is something you want us to do before we grow old?",
    "When did you last feel truly seen by me?",
    "What does 'home' mean to you now?",
    "What song carries us in it?",
    "What is a memory of us you replay the most?",
    "What do you hope I never change?",
    "Where in your body do you feel love?",
    "What would you whisper to me across a crowded room?",
    "What is one promise you'd renew today?",
    "What does forever feel like when you imagine it with me?",
  ];

  Router.register("soulcard", function (root) {
    const conv = APP.activeConv;
    if (!conv) { Router.go("chat"); return {}; }
    root.appendChild(topBar({ title: "Soul Card", back: true }));
    const body = H.el("div", { class: "pad scroll grow stack reveal", style: "align-items:center" });
    root.appendChild(body);

    const promptEl = H.el("div", { class: "sc-text" }, "\u2026");
    const back = H.el("div", { class: "sc-face sc-back" }, [H.el("div", { class: "sc-glyph" }, "\uD83C\uDFB4"), H.el("div", { class: "sc-hint" }, "TAP TO DRAW")]);
    const front = H.el("div", { class: "sc-face sc-front" }, promptEl);
    const inner = H.el("div", { class: "sc-inner" }, [back, front]);
    const card = H.el("div", { class: "sc-card", onClick: () => draw() }, inner);
    body.appendChild(card);

    const answer = H.el("input", { class: "input", placeholder: "Answer from your heart\u2026", style: "margin-top:6px" });
    const sendBtn = H.el("button", { class: "btn btn-primary btn-block", onClick: sendAnswer }, "Answer in chat \u2726");
    const again = H.el("button", { class: "btn btn-ghost btn-block", onClick: () => draw() }, "New card");
    const tools = H.el("div", { class: "stack hidden", style: "width:100%;max-width:420px" }, [answer, sendBtn, again]);
    body.appendChild(tools);

    let idx = -1, applying = false;
    function showCard(i, flip) {
      idx = i; promptEl.textContent = DECK[i] || "\u2026";
      if (flip) inner.classList.add("flipped"); else inner.classList.add("flipped");
      tools.classList.remove("hidden");
    }
    async function draw() {
      const i = Math.floor(Math.random() * DECK.length);
      showCard(i, true);
      if (!applying) { try { await SP.shared.soulCard.set(conv, { card_index: i, drawn_at: Date.now() }); } catch (e) {} }
    }
    async function sendAnswer() {
      const a = answer.value.trim(); if (idx < 0) { toast("Draw a card first."); return; }
      const text = "\uD83C\uDFB4 " + DECK[idx] + (a ? ("\n\u2014 " + a) : "");
      const { error } = await SP.chat.send(conv, { text: text });
      if (error) { toast("Couldn't send.", true); return; }
      toast("Shared in your chat \u2726"); Router.go("thread", { c: conv });
    }

    // load current shared card + subscribe so both see the same draw
    (async () => {
      try { const r = await SP.shared.soulCard.get(conv); if (r && r.data && typeof r.data.card_index === "number") { applying = true; showCard(r.data.card_index, false); applying = false; } } catch (e) {}
    })();
    let ch = null;
    try {
      ch = SP.shared.soulCard.subscribe(conv, (row) => {
        if (row && typeof row.card_index === "number" && row.card_index !== idx) { applying = true; showCard(row.card_index, true); applying = false; }
      });
    } catch (e) {}

    return { teardown() { try { if (ch && SP._sb) SP._sb.removeChannel(ch); } catch (e) {} } };
  });
})();
