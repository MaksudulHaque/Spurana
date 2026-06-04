/* ============================================================
 * SPURANA · inner/metta.js  — Loving-Kindness
 * A pulsing heart and rotating Metta phrases moving through self,
 * beloved, and all beings. Logs hc_logs on finish.
 * ============================================================ */
(function () {
  "use strict";
  const PHRASES = [
    "May I be happy.", "May I be safe.", "May I be at peace.", "May I be free.",
    "May you be happy, my beloved.", "May you be safe.", "May you be held.", "May you be at peace.",
    "May all beings be happy.", "May all beings be free from suffering.", "May all beings know peace.",
  ];
  Router.register("metta", function (root) {
    root.appendChild(topBar({ title: "Loving-Kindness", back: true }));
    const body = H.el("div", { class: "grow", style: "display:flex;flex-direction:column" });
    root.appendChild(body);

    const heart = H.el("div", { class: "metta-heart" }, "\uD83D\uDC97");
    const phrase = H.el("div", { class: "metta-phrase" }, "Settle. Soften. Begin when ready.");
    const stage = H.el("div", { class: "breath-stage" }, [heart, phrase]);
    const startBtn = H.el("button", { class: "sacred-btn", onClick: () => (running ? stop(true) : begin()) }, "Begin \u2726");
    body.append(stage, H.el("div", { class: "pad" }, startBtn));

    let running = false, i = 0, rot = null, endT = null, started = 0;
    function show() { phrase.style.opacity = "0"; setTimeout(() => { phrase.textContent = PHRASES[i % PHRASES.length]; phrase.style.opacity = "1"; i++; }, 400); }
    function begin() {
      running = true; started = Date.now(); i = 0; startBtn.textContent = "End session"; show();
      rot = setInterval(show, 9000);
      endT = setTimeout(() => stop(true), 9 * 60 * 1000);
    }
    function stop(log) {
      if (!running) return; running = false; clearInterval(rot); clearTimeout(endT);
      phrase.textContent = "May this warmth stay with you \u2726"; startBtn.textContent = "Begin \u2726";
      if (log) { const secs = Math.round((Date.now() - started) / 1000); if (secs > 5) { try { SP.shared.logPractice("hc_logs", { kind: "metta", seconds: secs }); } catch (e) {} toast("Kindness honoured \u00b7 " + Math.max(1, Math.round(secs / 60)) + " min"); } }
    }
    return { teardown() { running = false; clearInterval(rot); clearTimeout(endT); } };
  });
})();
