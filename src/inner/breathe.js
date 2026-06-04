/* ============================================================
 * SPURANA · inner/breathe.js  — guided breathing
 * Animated breath orb cycling through a chosen pattern, for a
 * chosen duration. Logs a hc_logs session on finish.
 * ============================================================ */
(function () {
  "use strict";
  const PATTERNS = {
    calm:     { label: "Calm \u00b7 4-7-8",   phases: [["Breathe in", 4, "in"], ["Hold", 7, "hold"], ["Breathe out", 8, "out"]] },
    box:      { label: "Box \u00b7 4-4-4-4",   phases: [["Breathe in", 4, "in"], ["Hold", 4, "hold"], ["Breathe out", 4, "out"], ["Hold", 4, "hold"]] },
    coherent: { label: "Coherent \u00b7 5-5",  phases: [["Breathe in", 5.5, "in"], ["Breathe out", 5.5, "out"]] },
  };

  Router.register("breathe", function (root) {
    root.appendChild(topBar({ title: "Breathe", back: true }));
    const body = H.el("div", { class: "grow", style: "display:flex;flex-direction:column" });
    root.appendChild(body);

    let patKey = "calm", mins = 5, running = false;
    let stepT = null, countT = null, endT = null, started = 0;

    const orb = H.el("div", { class: "breath-orb" });
    const phase = H.el("div", { class: "breath-phase" }, "Ready");
    const count = H.el("div", { class: "breath-count" }, "");
    const stage = H.el("div", { class: "breath-stage" }, [orb, phase, count]);

    const patChips = Object.keys(PATTERNS).map((k) => H.el("button", { class: "chip" + (k === patKey ? " on" : ""), "data-k": k, onClick: () => { if (running) return; patKey = k; pick(patWrap, k); } }, PATTERNS[k].label));
    const patWrap = H.el("div", { class: "chips" }, patChips);
    const durChips = [2, 5, 10].map((m) => H.el("button", { class: "chip" + (m === mins ? " on" : ""), "data-k": String(m), onClick: () => { if (running) return; mins = m; pick(durWrap, String(m)); } }, m + " min"));
    const durWrap = H.el("div", { class: "chips" }, durChips);
    const startBtn = H.el("button", { class: "sacred-btn", onClick: () => (running ? stop(true) : begin()) }, "Begin \u2726");
    const setup = H.el("div", { class: "pad stack" }, [H.el("div", { class: "f-label" }, "Pattern"), patWrap, H.el("div", { class: "f-label" }, "Duration"), durWrap, startBtn]);
    body.append(stage, setup);

    function pick(wrap, k) { Array.from(wrap.children).forEach((c) => c.classList.toggle("on", c.getAttribute("data-k") === k)); }

    function cycle() {
      const phases = PATTERNS[patKey].phases; let i = 0;
      (function step() {
        if (!running) return;
        const ph = phases[i], secs = ph[1], kind = ph[2];
        phase.textContent = ph[0];
        orb.style.transitionDuration = secs + "s";
        orb.style.transform = "scale(" + (kind === "in" ? 1 : kind === "out" ? 0.5 : (orb._cur || 0.5)) + ")";
        orb._cur = kind === "in" ? 1 : kind === "out" ? 0.5 : orb._cur;
        let left = Math.ceil(secs); count.textContent = left + "s";
        countT = setInterval(() => { left--; if (left >= 0) count.textContent = left + "s"; }, 1000);
        stepT = setTimeout(() => { clearInterval(countT); i = (i + 1) % phases.length; step(); }, secs * 1000);
      })();
    }
    function begin() {
      running = true; started = Date.now(); startBtn.textContent = "End session";
      [].forEach.call(setup.querySelectorAll(".chip"), (c) => c.setAttribute("disabled", "true"));
      cycle();
      endT = setTimeout(() => stop(true), mins * 60 * 1000);
    }
    function stop(log) {
      if (!running) return; running = false;
      clearTimeout(stepT); clearInterval(countT); clearTimeout(endT);
      orb.style.transitionDuration = "1.2s"; orb.style.transform = "scale(0.5)"; orb._cur = 0.5;
      phase.textContent = "Complete \u2726"; count.textContent = "";
      startBtn.textContent = "Begin \u2726";
      [].forEach.call(setup.querySelectorAll(".chip"), (c) => c.removeAttribute("disabled"));
      if (log) { const secs = Math.round((Date.now() - started) / 1000); if (secs > 5) { try { SP.shared.logPractice("hc_logs", { kind: "breath", pattern: patKey, seconds: secs }); } catch (e) {} toast("Breath honoured \u00b7 " + Math.max(1, Math.round(secs / 60)) + " min"); } }
    }

    return { teardown() { running = false; clearTimeout(stepT); clearInterval(countT); clearTimeout(endT); } };
  });
})();
