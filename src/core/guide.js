/* ============================================================
 * SPURANA · core/guide.js — the guided-session engine.
 * One engine for every meditation/awareness practice:
 *   • self-selected TIMELINE first (pick minutes; a default is
 *     pre-lit for each practice),
 *   • VOICE-guided — a warm, affectionate narrator you can set
 *     to Her or Him, soft and slow,
 *   • TIME-BOUND — phases scale to fit the chosen length; soft
 *     bells at start / middle / end,
 *   • AESTHETIC — a glowing seated figure breathing with you,
 *     over the living world behind.
 * No chat required: this is for self-understanding, self-
 * awakening. Used by practice/library.js and the Antaryatra
 * inner pilgrimage.
 * ============================================================ */
(function () {
  "use strict";

  /* ── MedVoice: warm narration (Her / Him), persisted ── */
  var MedVoice = (function () {
    var KEY = "spurana.guidevoice";
    var st = { on: true, gender: "her" };
    try { var s = JSON.parse(localStorage.getItem(KEY) || "{}"); if (typeof s.on === "boolean") st.on = s.on; if (s.gender) st.gender = s.gender; } catch (e) {}
    function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
    var voices = [];
    function refresh() { try { voices = (window.speechSynthesis && speechSynthesis.getVoices()) || []; } catch (e) { voices = []; } }
    if (window.speechSynthesis) { refresh(); try { speechSynthesis.onvoiceschanged = refresh; } catch (e) {} }
    var HER = ["samantha", "victoria", "karen", "tessa", "moira", "fiona", "serena", "allison", "ava", "susan", "zira", "female", "google uk english female", "google us english"];
    var HIM = ["daniel", "alex", "fred", "tom", "oliver", "rishi", "male", "google uk english male"];
    function pick() {
      if (!voices.length) refresh();
      var want = st.gender === "him" ? HIM : HER;
      var en = voices.filter(function (v) { return v.lang && /^en/i.test(v.lang); });
      for (var i = 0; i < want.length; i++) {
        var hit = en.find(function (v) { return v.name && v.name.toLowerCase().indexOf(want[i]) !== -1; });
        if (hit) return hit;
      }
      return en[0] || voices[0] || null;
    }
    function speak(text) {
      if (!st.on || !text || !window.speechSynthesis) return;
      try {
        speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        var v = pick(); if (v) u.voice = v;
        u.rate = 0.76;                                  // slow, unhurried
        u.pitch = st.gender === "him" ? 0.82 : 1.06;    // warm, intimate
        u.volume = 0.92;
        speechSynthesis.speak(u);
      } catch (e) {}
    }
    function cancel() { try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} }
    return {
      speak: speak, cancel: cancel,
      isOn: function () { return st.on; },
      gender: function () { return st.gender; },
      setOn: function (b) { st.on = b; save(); if (!b) cancel(); },
      setGender: function (g) { st.gender = g; save(); },
    };
  })();
  window.MedVoice = MedVoice;

  /* ── soft bell (gentle sine, no dependency on ambient) ── */
  function bell() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      var c = bell._c || (bell._c = new AC()); if (c.state === "suspended") c.resume();
      var o = c.createOscillator(), g = c.createGain();
      o.type = "sine"; o.frequency.value = 432;
      g.gain.setValueAtTime(0.0001, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.18, c.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 3.2);
      o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 3.3);
    } catch (e) {}
  }

  /* ── a turning gold mandala — royal, mystic backdrop ── */
  function mandalaSVG() {
    var p = "";
    for (var ring = 0; ring < 3; ring++) {
      var n = 8 + ring * 4, rad = 56 + ring * 48;
      for (var i = 0; i < n; i++) {
        var a = (i / n) * 360;
        p += '<ellipse cx="200" cy="' + (200 - rad) + '" rx="' + (14 - ring * 2) + '" ry="' + (42 - ring * 7) + '" transform="rotate(' + a + ' 200 200)" fill="none" stroke="rgba(201,169,110,0.5)" stroke-width="1"/>';
      }
    }
    return '<svg viewBox="0 0 400 400" width="100%" height="100%" aria-hidden="true">' +
      '<circle cx="200" cy="200" r="150" fill="none" stroke="rgba(201,169,110,.22)" stroke-width="1"/>' +
      '<circle cx="200" cy="200" r="92" fill="none" stroke="rgba(232,0,154,.22)" stroke-width="1"/>' +
      p + '<circle cx="200" cy="200" r="7" fill="none" stroke="rgba(232,0,154,.7)" stroke-width="1.5"/></svg>';
  }

  /* ── the glowing seated figure (lotus posture), pure SVG ── */
  function figureSVG() {
    return (
      '<svg viewBox="0 0 100 110" width="100%" height="100%" aria-hidden="true">' +
      '<defs><radialGradient id="gAura" cx="50%" cy="42%" r="60%">' +
      '<stop offset="0%" stop-color="rgba(255,225,245,.9)"/>' +
      '<stop offset="45%" stop-color="rgba(232,0,154,.35)"/>' +
      '<stop offset="100%" stop-color="rgba(232,0,154,0)"/></radialGradient></defs>' +
      '<circle cx="50" cy="46" r="48" fill="url(#gAura)"/>' +
      '<g fill="rgba(255,240,250,.92)">' +
      '<circle cx="50" cy="30" r="9"/>' +                                  /* head */
      '<path d="M50 40 C40 40 34 50 34 62 C34 72 40 78 50 78 C60 78 66 72 66 62 C66 50 60 40 50 40 Z"/>' + /* torso */
      '<path d="M34 64 C24 66 18 76 22 86 C30 82 40 80 50 80 C60 80 70 82 78 86 C82 76 76 66 66 64 Z"/>' + /* crossed legs */
      '<path d="M36 58 C28 60 26 70 30 74 C36 70 44 68 50 68 C56 68 64 70 70 74 C74 70 72 60 64 58 Z" opacity=".5"/>' + /* arms resting */
      "</g></svg>"
    );
  }

  /* ── scale phase seconds to fit the chosen total minutes ── */
  function scalePhases(phases, totalMin) {
    var total = totalMin * 60;
    var sum = phases.reduce(function (a, p) { return a + p[1]; }, 0) || 1;
    var k = total / sum, acc = 0, out = phases.map(function (p, i) {
      var s = Math.max(6, Math.round(p[1] * k)); acc += s; return [p[0], s, p[2] || null];
    });
    // fix rounding drift on the last phase
    var drift = total - acc; if (out.length) out[out.length - 1][1] = Math.max(6, out[out.length - 1][1] + drift);
    return out;
  }

  /* ============================================================
   * Guide.mount(root, opts) — builds picker → session into root.
   * opts: { title, sound, defaultMin, minutes:[...], log, getConv,
   *         phases:[[text,secs,voice?]...]  OR  silence:true }
   * Returns { teardown }.
   * ============================================================ */
  function mount(root, opts) {
    opts = opts || {};
    var minutes = opts.minutes || [3, 5, 10, 15, 20, 30];
    var chosen = opts.defaultMin || 5;
    var sound = opts.sound || "cosmos";
    var silence = !!opts.silence;
    var basePhases = opts.phases || [];

    var wrap = H.el("div", { class: "guide-wrap grow" });
    root.appendChild(wrap);
    if (!opts.stages) wrap.appendChild(H.el("div", { class: "guide-mandala", html: mandalaSVG() }));

    /* —— PICKER (timeline first) —— */
    var picker = H.el("div", { class: "guide-pick reveal" });
    picker.appendChild(H.el("div", { class: "guide-fig small", html: figureSVG() }));
    picker.appendChild(H.el("p", { class: "guide-lead" }, silence
      ? "Choose your stretch of silence. Bells will hold the start, the middle, and the end."
      : "Choose how long to stay. The guidance will breathe to fit your time."));

    var chipRow = H.el("div", { class: "guide-chips" });
    var chipEls = {};
    minutes.forEach(function (m) {
      var c = H.el("button", { class: "guide-chip" + (m === chosen ? " on" : ""), onClick: function () {
        chosen = m; for (var k in chipEls) chipEls[k].classList.toggle("on", +k === m);
      } }, m + "m");
      chipEls[m] = c; chipRow.appendChild(c);
    });
    picker.appendChild(chipRow);

    // voice controls — Her / Him / mute
    var vRow = H.el("div", { class: "guide-voice" });
    var her = H.el("button", { class: "guide-vbtn" + (MedVoice.gender() === "her" ? " on" : ""), onClick: function () { MedVoice.setGender("her"); her.classList.add("on"); him.classList.remove("on"); MedVoice.speak("I am here with you."); } }, "\u2640 Her");
    var him = H.el("button", { class: "guide-vbtn" + (MedVoice.gender() === "him" ? " on" : ""), onClick: function () { MedVoice.setGender("him"); him.classList.add("on"); her.classList.remove("on"); MedVoice.speak("I am here with you."); } }, "\u2642 Him");
    var mute = H.el("button", { class: "guide-vbtn" + (MedVoice.isOn() ? "" : " off"), onClick: function () { MedVoice.setOn(!MedVoice.isOn()); mute.classList.toggle("off", !MedVoice.isOn()); mute.textContent = MedVoice.isOn() ? "\uD83D\uDD0A Voice" : "\uD83D\uDD07 Voice"; } }, MedVoice.isOn() ? "\uD83D\uDD0A Voice" : "\uD83D\uDD07 Voice");
    vRow.append(her, him, mute);
    picker.appendChild(vRow);

    var beginBtn = H.el("button", { class: "sacred-btn", onClick: function () { startSession(); } }, "Begin \u2726");
    picker.appendChild(H.el("div", { class: "pad" }, beginBtn));
    wrap.appendChild(picker);

    /* —— SESSION —— */
    var stages = opts.stages || null;            // [{visual,color,icon,name}] parallel to phases
    var session = H.el("div", { class: "guide-session hidden" + (stages ? " has-fx" : "") });
    var fxCanvas = stages ? H.el("canvas", { class: "guide-canvas" }) : null;
    if (fxCanvas) session.appendChild(fxCanvas);
    var stageName = stages ? H.el("div", { class: "guide-stage-name" }, "") : null;
    var orbInner = stages ? H.el("div", { class: "guide-bigicon" }, (stages[0] && stages[0].icon) || "\u2728")
                          : H.el("div", { class: "guide-fig", html: figureSVG() });
    var orb = H.el("div", { class: "guide-orb" }, orbInner);
    var ring = H.el("div", { class: "guide-ring" }, orb);
    var phaseText = H.el("div", { class: "guide-text" }, "");
    var qText = H.el("div", { class: "guide-q" }, "");
    var clock = H.el("div", { class: "guide-clock" }, "");
    var endBtn = H.el("button", { class: "sacred-btn ghost", onClick: function () { endSession(false); } }, "End \u2726");
    if (stageName) session.appendChild(stageName);
    session.append(ring, phaseText, qText, clock, H.el("div", { class: "pad" }, endBtn));
    wrap.appendChild(session);

    var running = false, idx = 0, stepT = null, tickT = null, started = 0, remain = 0, total = 0;
    var fxRaf = null, fxT0 = 0, curIdx = 0, fxCtx = null;

    function fmt(s) { var m = Math.floor(s / 60), x = s % 60; return m + ":" + (x < 10 ? "0" : "") + x; }

    function startFx() {
      if (!stages || !fxCanvas || !fxCanvas.getContext) return;
      try { fxCtx = fxCanvas.getContext("2d"); } catch (e) { fxCtx = null; }
      if (!fxCtx) return;
      fxT0 = (window.performance && performance.now) ? performance.now() : Date.now();
      function size() { fxCanvas.width = fxCanvas.clientWidth || 360; fxCanvas.height = fxCanvas.clientHeight || 420; }
      size();
      function loop(now) {
        fxRaf = requestAnimationFrame(loop);
        if (!running || document.hidden) return;
        if (fxCanvas.clientWidth && fxCanvas.width !== fxCanvas.clientWidth) size();
        var st = stages[Math.min(curIdx, stages.length - 1)]; if (!st) return;
        fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
        try { window.ATR_FX && ATR_FX.stageBg(fxCtx, fxCanvas.width, fxCanvas.height, ((now || 0) - fxT0) / 1000, st.visual, st.color); } catch (e) {}
      }
      if (window.requestAnimationFrame) fxRaf = requestAnimationFrame(loop);
    }

    function startSession() {
      picker.classList.add("hidden"); session.classList.remove("hidden");
      try { if (window.Ambient) { Ambient.setPreset(sound); Ambient.enable(true); } } catch (e) {}
      bell(); startFx();
      running = true; started = Date.now(); total = chosen * 60; remain = total;
      tickT = setInterval(function () {
        remain--; clock.textContent = fmt(Math.max(0, remain));
        if (remain === Math.floor(total / 2)) bell();           // midpoint bell
        if (remain <= 0) endSession(true);
      }, 1000);
      clock.textContent = fmt(remain);
      if (silence) { phaseText.textContent = "Just sit. Be the silence."; MedVoice.speak("Let us simply sit. Nothing to do now. Only to be here, softly, with yourself."); breathe(true); }
      else { idx = 0; runPhase(scalePhases(basePhases, chosen)); }
    }

    function breathe(loop) {                                    // glowing figure inhale/exhale
      if (!running) return;
      orb.style.transition = "transform 4s ease-in-out, filter 4s ease-in-out";
      orb.style.transform = "scale(1.18)"; orb.style.filter = "brightness(1.25)";
      setTimeout(function () { if (!running) return; orb.style.transform = "scale(0.86)"; orb.style.filter = "brightness(0.9)"; }, 4200);
      if (loop) { var t = setTimeout(function () { breathe(true); }, 8600); }
    }

    function runPhase(phases) {
      if (!running) return;
      if (idx >= phases.length) return;                          // timer ends the session
      var ph = phases[idx], text = ph[0], secs = ph[1], voice = ph[2] || text, q = ph[3] || "";
      if (stages) {
        curIdx = idx; var st = stages[Math.min(idx, stages.length - 1)];
        if (st) {
          if (stageName) stageName.textContent = (st.icon ? st.icon + "  " : "") + (st.name || "");
          if (orbInner && st.icon) orbInner.textContent = st.icon;
          orb.style.filter = "drop-shadow(0 0 30px " + (st.color || "#E8009A") + ")";
          if (st.sound) { try { if (window.Ambient) Ambient.setPreset(st.sound); } catch (e) {} }
        }
      }
      phaseText.style.opacity = "0";
      setTimeout(function () { phaseText.textContent = text; phaseText.style.opacity = "1"; qText.textContent = q; }, 320);
      MedVoice.speak(voice);
      breathe(false);
      orb.style.transition = "transform " + Math.min(6, secs) + "s ease-in-out";
      orb.style.transform = idx % 2 ? "scale(0.9)" : "scale(1.12)";
      stepT = setTimeout(function () { idx++; if (idx < phases.length) runPhase(phases); }, secs * 1000);
    }

    function endSession(done) {
      if (!running) return; running = false;
      clearTimeout(stepT); clearInterval(tickT);
      if (fxRaf && window.cancelAnimationFrame) cancelAnimationFrame(fxRaf);
      MedVoice.cancel();
      if (done) { bell(); setTimeout(bell, 900); }
      orb.style.transform = "scale(0.8)";
      phaseText.textContent = done ? "Complete \u2726" : "Until next time \u2726";
      qText.textContent = "";
      var secs = Math.round((Date.now() - started) / 1000);
      if (secs > 5) {
        try {
          var mins = Math.floor(secs / 60);
          var prev = +(localStorage.getItem("spurana.medMinutes") || 0);
          localStorage.setItem("spurana.medMinutes", prev + mins);
        } catch (e) {}
        if (opts.log) { var f = { kind: opts.title || "practice", seconds: secs }; if (opts.log === "cp_logs" && opts.getConv && opts.getConv()) f.conv_id = opts.getConv(); try { SP.shared.logPractice(opts.log, f); } catch (e) {} }
        if (done && window.toast) toast("Honoured \u2726 " + Math.max(1, Math.floor(secs / 60)) + " min");
      }
    }

    // expose question setter for journeys
    mount._setQuestion = function (q) { qText.textContent = q || ""; };

    return { teardown: function () { running = false; clearTimeout(stepT); clearInterval(tickT); if (fxRaf && window.cancelAnimationFrame) cancelAnimationFrame(fxRaf); MedVoice.cancel(); } };
  }

  window.Guide = { mount: mount, voice: MedVoice, figureSVG: figureSVG, mandalaSVG: mandalaSVG, bell: bell };
})();
