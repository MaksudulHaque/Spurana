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
    var st = { on: true, gender: "her", voiceURI: "", haptic: true, hq: true };
    try { var s = JSON.parse(localStorage.getItem(KEY) || "{}"); if (typeof s.on === "boolean") st.on = s.on; if (s.gender) st.gender = s.gender; if (s.voiceURI) st.voiceURI = s.voiceURI; if (typeof s.haptic === "boolean") st.haptic = s.haptic; if (typeof s.hq === "boolean") st.hq = s.hq; } catch (e) {}
    function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
    var voices = [];
    function refresh() { try { voices = (window.speechSynthesis && speechSynthesis.getVoices()) || []; } catch (e) { voices = []; } }
    if (window.speechSynthesis) { refresh(); try { speechSynthesis.onvoiceschanged = refresh; } catch (e) {} }
    // prefer the most natural engines a device may have
    var QUALITY = ["natural", "neural", "enhanced", "premium", "online", "google", "siri"];
    var HER = ["samantha", "victoria", "karen", "tessa", "moira", "fiona", "serena", "allison", "ava", "susan", "zira", "aria", "jenny", "female", "google uk english female", "google us english"];
    var HIM = ["daniel", "alex", "fred", "tom", "oliver", "rishi", "guy", "male", "google uk english male"];
    function score(v, want) {
      var n = (v.name || "").toLowerCase(), sc = 0, i;
      for (i = 0; i < QUALITY.length; i++) if (n.indexOf(QUALITY[i]) !== -1) { sc += 6; break; }
      for (i = 0; i < want.length; i++) if (n.indexOf(want[i]) !== -1) { sc += (want.length - i); break; }
      if (v.localService) sc += 1;
      return sc;
    }
    function isBangla(t) { return /[\u0980-\u09FF]/.test(t || ""); }
    function pickEn() {
      if (!voices.length) refresh();
      var en = voices.filter(function (v) { return v.lang && /^en/i.test(v.lang); });
      if (st.voiceURI) { var ov = en.find(function (v) { return v.voiceURI === st.voiceURI; }); if (ov) return ov; }
      var want = st.gender === "him" ? HIM : HER;
      en.sort(function (a, b) { return score(b, want) - score(a, want); });
      return en[0] || voices[0] || null;
    }
    function pickBn() {
      if (!voices.length) refresh();
      var bn = voices.filter(function (v) { return v.lang && /^bn/i.test(v.lang); });
      bn.sort(function (a, b) { return score(b, HER) - score(a, HER); });
      return bn[0] || null;
    }
    function deviceSpeak(text) {
      if (!st.on || !text || !window.speechSynthesis) return;
      try {
        speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        if (isBangla(text)) {
          var bv = pickBn();
          if (bv) { u.voice = bv; u.lang = bv.lang; } else { u.lang = "bn-IN"; }   // device Bangla voice
          u.rate = 0.84; u.pitch = 1.0;
        } else {
          var v = pickEn(); if (v) { u.voice = v; u.lang = v.lang; }
          u.rate = 0.76;
          u.pitch = st.gender === "him" ? 0.82 : 1.06;
        }
        u.volume = 0.94;
        speechSynthesis.speak(u);
      } catch (e) {}
    }
    // ── high-quality voice via the secure `tts` Edge Function (Google Cloud TTS).
    //    Key lives server-side; client only gets audio. Falls back to the device voice. ──
    var audioEl = null, ttsCache = {}, hqFailed = false;
    function stopAudio() { try { if (audioEl) { audioEl.pause(); audioEl.removeAttribute("src"); audioEl.load(); } } catch (e) {} }
    function playB64(b64) {
      try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {}
      stopAudio();
      if (!audioEl) { audioEl = new Audio(); audioEl.preload = "auto"; }
      audioEl.src = "data:audio/mp3;base64," + b64; audioEl.volume = 0.96;
      var pr = audioEl.play(); if (pr && pr.catch) pr.catch(function () {});
    }
    function speakRemote(text) {
      var lang = isBangla(text) ? "bn" : "en";
      var ck = st.gender + "|" + text;
      if (ttsCache[ck]) { playB64(ttsCache[ck]); return; }
      try {
        window.SP._sb.functions.invoke("tts", { body: { text: text, lang: lang, gender: st.gender } })
          .then(function (res) {
            var d = res && res.data, b64 = d && d.audio;
            if ((res && res.error) || !b64) { hqFailed = true; deviceSpeak(text); return; }
            ttsCache[ck] = b64; playB64(b64);
          })
          .catch(function () { hqFailed = true; deviceSpeak(text); });
      } catch (e) { hqFailed = true; deviceSpeak(text); }
    }
    function speak(text) {
      if (!st.on || !text) return;
      if (st.hq && !hqFailed && window.SP && window.SP._sb) speakRemote(text);
      else deviceSpeak(text);
    }
    function cancel() { stopAudio(); try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} }
    return {
      speak: speak, cancel: cancel,
      isOn: function () { return st.on; },
      gender: function () { return st.gender; },
      setOn: function (b) { st.on = b; save(); if (!b) cancel(); },
      setGender: function (g) { st.gender = g; st.voiceURI = ""; save(); },
      haptic: function () { return st.haptic; },
      setHaptic: function (b) { st.haptic = !!b; save(); if (b) { try { if (window.Native && Native.pattern) Native.pattern([60, 90, 60, 90, 130]); else if (navigator.vibrate) navigator.vibrate([60, 90, 60, 90, 130]); } catch (e) {} } },
      listVoices: function () { refresh(); return voices.filter(function (v) { return v.lang && (/^en/i.test(v.lang) || /^bn/i.test(v.lang)); }).map(function (v) { return { name: v.name, uri: v.voiceURI, lang: v.lang }; }); },
      currentVoiceURI: function () { return st.voiceURI; },
      setVoice: function (uri) { st.voiceURI = uri || ""; save(); },
      hasBangla: function () { return !!pickBn(); },
      isHQ: function () { return st.hq; },
      setHQ: function (b) { st.hq = !!b; hqFailed = false; ttsCache = {}; save(); },
    };
  })();
  window.MedVoice = MedVoice;
  window.MedVoice = MedVoice;

  /* ── default gentle continuation murmurs (used when a practice gives none) ── */
  var DEF_MUR = ["Stay with it.", "Nothing to do now.", "Let the breath be easy.", "Softening, with each breath.", "Just here. Just this.", "Let yourself be held.", "Let go a little more.", "There is nowhere else to be."];
  var DEF_MUR_BN = ["এর সাথে থাকুন।", "এখন কিছু করার নেই।", "শ্বাস সহজ হোক।", "প্রতি শ্বাসে কোমল হোন।", "শুধু এখানে। শুধু এটুকুই।", "নিজেকে ধরে রাখতে দিন।", "আরও একটু ছেড়ে দিন।"];

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
    try { if (window.Native) Native.keepAwake(true); } catch (e) {}
    opts = opts || {};
    var minutes = opts.minutes || [3, 5, 10, 15, 20, 30];
    var chosen = opts.defaultMin || 5;
    var sound = opts.sound || "cosmos";
    var silence = !!opts.silence;
    var basePhases = opts.phases || [];
    var murmurs = (opts.murmurs && opts.murmurs.length) ? opts.murmurs : ((window.LANG === "bn") ? DEF_MUR_BN : DEF_MUR);

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
    var breathLabel = H.el("div", { class: "guide-breath" }, "");
    var phaseText = H.el("div", { class: "guide-text" }, "");
    var qText = H.el("div", { class: "guide-q" }, "");
    var clock = H.el("div", { class: "guide-clock" }, "");
    var endBtn = H.el("button", { class: "sacred-btn ghost", onClick: function () { endSession(false); } }, "End \u2726");
    if (stageName) session.appendChild(stageName);
    session.append(ring, breathLabel, phaseText, qText, clock, H.el("div", { class: "pad" }, endBtn));
    wrap.appendChild(session);

    var running = false, idx = 0, stepT = null, tickT = null, started = 0, remain = 0, total = 0, murT = null;
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
      bell(); startFx(); sig("wake");
      running = true; started = Date.now(); total = chosen * 60; remain = total;
      tickT = setInterval(function () {
        remain--; clock.textContent = fmt(Math.max(0, remain));
        if (remain === Math.floor(total / 2)) bell();           // midpoint bell
        if (remain <= 0) endSession(true);
      }, 1000);
      clock.textContent = fmt(remain);
      startPacer(opts.breath || [4, 1, 6, 1]);
      if (silence) { phaseText.textContent = T("Just sit. Be the silence.", "\u09b6\u09c1\u09a7\u09c1 \u09ac\u09b8\u09c1\u09a8\u0964 \u09a8\u09c0\u09b0\u09ac\u09a4\u09be\u0987 \u09b9\u09df\u09c7 \u0989\u09a0\u09c1\u09a8\u0964"); MedVoice.speak(T("Let us simply sit. Nothing to do now. Only to be here, softly, with yourself, breathing.", "\u099a\u09b2\u09c1\u09a8 \u0986\u09ae\u09b0\u09be \u09b6\u09c1\u09a7\u09c1 \u09ac\u09b8\u09bf\u0964 \u098f\u0996\u09a8 \u0995\u09b0\u09be\u09b0 \u0995\u09bf\u099b\u09c1 \u09a8\u09c7\u0987\u0964 \u09b6\u09c1\u09a7\u09c1 \u098f\u0996\u09be\u09a8\u09c7 \u09a5\u09be\u0995\u09c1\u09a8, \u0995\u09cb\u09ae\u09b2\u09ad\u09be\u09ac\u09c7, \u09a8\u09bf\u099c\u09c7\u09b0 \u09b8\u09be\u09a5\u09c7, \u09b6\u09cd\u09ac\u09be\u09b8 \u09a8\u09bf\u09a4\u09c7 \u09a8\u09bf\u09a4\u09c7\u0964")); }
      else { idx = 0; runPhase(scalePhases(basePhases, chosen)); }
    }

    // ── continuous breath pacer: the guide breathes WITH you the whole time ──
    var pacerOn = false, pacerT = null, pace = [4, 1, 6, 1];   // in, hold, out, hold (seconds)
    function glow() { var c = (stages && (stages[Math.min(curIdx, stages.length - 1)] || {}).color) || "#E8009A"; return " drop-shadow(0 0 28px " + c + ")"; }
    var amp = 0.5;   // grows 0.5 -> ~1.4 as the session deepens (slow -> strong)
    function mm(x) { return Math.max(18, Math.min(450, Math.round(x * amp))); }
    function motorGo(ms) { try { if (window.Native && Native.buzz) Native.buzz(ms); else if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
    function patGo(seq) { try { if (window.Native && Native.pattern) Native.pattern(seq); else if (navigator.vibrate) navigator.vibrate(seq); } catch (e) {} }
    function buzz(ms) { if (MedVoice.haptic()) motorGo(mm(ms * 3)); }
    // breath signatures — distinct, felt, ramping deeper with amp
    function sig(kind) {
      if (!MedVoice.haptic()) return;
      if (kind === "in") patGo([mm(45), 90, mm(85)]);                       // rising double — air coming in
      else if (kind === "hold") motorGo(mm(28));                            // a still point
      else if (kind === "out") motorGo(mm(140));                            // one long soft release
      else if (kind === "rest") motorGo(mm(20));
      else if (kind === "heart") patGo([mm(70), 110, mm(130), 620, mm(80), 110, mm(150)]); // lub-dub ×2
      else if (kind === "wake") patGo([mm(40), 80, mm(40), 80, mm(90)]);    // session opens
    }
    function breathStep(phase) {
      if (!running || !pacerOn) return;
      var inS = pace[0], hold1 = pace[1], outS = pace[2], hold2 = pace[3];
      if (phase === 0) {                                        // inhale
        breathLabel.textContent = T("breathe in", "\u09b6\u09cd\u09ac\u09be\u09b8 \u09a8\u09bf\u09a8");
        orb.style.transition = "transform " + inS + "s cubic-bezier(.4,0,.2,1), filter " + inS + "s ease-in-out";
        orb.style.transform = "scale(1.2)"; orb.style.filter = "brightness(1.3)" + glow(); sig("in");
        pacerT = setTimeout(function () { breathStep(1); }, inS * 1000);
      } else if (phase === 1) {                                 // hold (full)
        if (hold1 > 0.4) { breathLabel.textContent = T("hold", "\u09a7\u09b0\u09c7 \u09b0\u09be\u0996\u09c1\u09a8"); sig("hold"); }
        pacerT = setTimeout(function () { breathStep(2); }, hold1 * 1000);
      } else if (phase === 2) {                                 // exhale
        breathLabel.textContent = T("breathe out", "\u09b6\u09cd\u09ac\u09be\u09b8 \u099b\u09be\u09a1\u09c1\u09a8");
        orb.style.transition = "transform " + outS + "s cubic-bezier(.4,0,.2,1), filter " + outS + "s ease-in-out";
        orb.style.transform = "scale(0.84)"; orb.style.filter = "brightness(0.92)" + glow(); sig("out");
        pacerT = setTimeout(function () { breathStep(3); }, outS * 1000);
      } else {                                                  // hold (empty)
        if (hold2 > 0.4) { breathLabel.textContent = T("rest", "\u09ac\u09bf\u09b6\u09cd\u09b0\u09be\u09ae"); sig("rest"); }
        pacerT = setTimeout(function () { breathStep(0); }, hold2 * 1000);
      }
    }
    function startPacer(p) { if (p) pace = p; if (pacerOn) return; pacerOn = true; breathStep(0); }
    function stopPacer() { pacerOn = false; clearTimeout(pacerT); breathLabel.textContent = ""; }

    function runPhase(phases) {
      if (!running) return;
      clearTimeout(murT);
      if (idx >= phases.length) return;
      amp = 0.5 + 0.9 * (idx / Math.max(1, phases.length - 1));   // ramp the pulse as we go deeper                          // timer ends the session
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
      buzz(18);                                                  // a soft pulse as each beat arrives
      // weave gentle, purpose-specific continuation through long gaps (so longer sessions stay guided)
      clearInterval(murT);
      if (secs > 26) {
        var pool = murmurs.slice();
        for (var z = pool.length - 1; z > 0; z--) { var w = (Math.random() * (z + 1)) | 0, tmp = pool[z]; pool[z] = pool[w]; pool[w] = tmp; }
        var mi = 0, gap = 22, endGuard = 7;                      // a murmur ~every 22s, none in the final 7s
        var firstAt = 16;                                        // first murmur 16s in (after the main line lands)
        murT = setTimeout(function tick() {
          if (!running) return;
          MedVoice.speak(pool[mi % pool.length]); buzz(6); mi++;
          var left = Math.max(0, (idx < phases.length ? secs : 0));
          murT = setTimeout(tick, gap * 1000);
        }, firstAt * 1000);
      }
      stepT = setTimeout(function () { idx++; clearInterval(murT); clearTimeout(murT); if (idx < phases.length) runPhase(phases); }, secs * 1000);
    }

    function endSession(done) {
      if (!running) return; running = false;
      clearTimeout(stepT); clearInterval(tickT); clearTimeout(murT); stopPacer();
      if (fxRaf && window.cancelAnimationFrame) cancelAnimationFrame(fxRaf);
      MedVoice.cancel();
      if (done) { sig("heart"); bell(); setTimeout(bell, 900); }
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

    return { teardown: function () { running = false; try { if (window.Native) Native.keepAwake(false); } catch (e) {} clearTimeout(stepT); clearInterval(tickT); clearTimeout(murT); stopPacer(); if (fxRaf && window.cancelAnimationFrame) cancelAnimationFrame(fxRaf); MedVoice.cancel(); } };
  }

  window.Guide = { mount: mount, voice: MedVoice, figureSVG: figureSVG, mandalaSVG: mandalaSVG, bell: bell };
})();
