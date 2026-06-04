/* ============================================================
 * SPURANA · core/binaural.js — binaural beat generator.
 * Two oscillators panned hard L/R, detuned by the beat freq, so
 * the brain perceives a beat (needs headphones). Own AudioContext,
 * user-started. Presets: Delta/Theta/Alpha/Beta.
 * ============================================================ */
window.Binaural = (function () {
  "use strict";
  let ctx = null, master = null, lo = null, ro = null, on = false, base = 200, beat = 6, vol = 0.22;
  function ensure() { if (ctx) return ctx; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; try { ctx = new AC(); master = ctx.createGain(); master.gain.value = vol; master.connect(ctx.destination); } catch (e) { ctx = null; } return ctx; }
  function osc(freq, pan) {
    const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = freq;
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null; const g = ctx.createGain(); g.gain.value = 0.5;
    o.connect(g); if (p) { p.pan.value = pan; g.connect(p); p.connect(master); } else g.connect(master);
    o.start(); return o;
  }
  function build() { if (!ensure()) return; stopOsc(); lo = osc(base, -1); ro = osc(base + beat, 1); }
  function stopOsc() { [lo, ro].forEach((o) => { try { o && o.stop(); o && o.disconnect(); } catch (e) {} }); lo = ro = null; }
  function start() { on = true; if (ensure()) { if (ctx.state === "suspended" && ctx.resume) ctx.resume(); build(); } }
  function stop() { on = false; stopOsc(); if (ctx && ctx.suspend) try { ctx.suspend(); } catch (e) {} }
  function setBeat(b) { beat = b; if (on) build(); }
  function setBase(f) { base = f; if (on) build(); }
  function setVolume(v) { vol = v; if (master) master.gain.value = v; }
  return { start, stop, setBeat, setBase, setVolume, isOn: () => on, beat: () => beat };
})();

(function () {
  "use strict";
  const PRESETS = [["Delta", 2, "deep sleep, healing"], ["Theta", 6, "meditation, calm"], ["Alpha", 10, "relaxed focus"], ["Beta", 18, "alert, present"]];
  Router.register("binaural", function (root) {
    root.appendChild(topBar({ title: "Binaural", back: true }));
    const body = H.el("div", { class: "pad scroll grow stack reveal", style: "align-items:center" });
    root.appendChild(body);
    body.appendChild(H.el("p", { class: "center muted", style: "font-family:var(--f-soul);font-style:italic" }, "Use headphones. Two tones, one for each ear, become a single pulse in the mind."));
    const orb = H.el("div", { class: "qi-orb", style: "width:150px;height:150px;transform:scale(.8)" });
    body.appendChild(orb);
    const label = H.el("div", { style: "font-family:var(--f-ui);letter-spacing:.2em;text-transform:uppercase;color:var(--q-bright)" }, "Theta \u00b7 6 Hz");
    body.appendChild(label);
    const chips = H.el("div", { class: "chips" }, PRESETS.map((p) => H.el("button", { class: "chip" + (p[1] === Binaural.beat() ? " on" : ""), "data-k": String(p[1]), onClick: () => { Binaural.setBeat(p[1]); label.textContent = p[0] + " \u00b7 " + p[1] + " Hz \u2014 " + p[2]; Array.from(chips.children).forEach((c) => c.classList.toggle("on", c.getAttribute("data-k") === String(p[1]))); } }, p[0])));
    body.appendChild(chips);
    let playing = false;
    const btn = H.el("button", { class: "sacred-btn", onClick: () => { playing = !playing; if (playing) { Binaural.start(); btn.textContent = "Stop"; orb.classList.add("live"); } else { Binaural.stop(); btn.textContent = "Begin \u2726"; orb.classList.remove("live"); } } }, "Begin \u2726");
    body.appendChild(btn);
    return { teardown() { Binaural.stop(); } };
  });
})();
