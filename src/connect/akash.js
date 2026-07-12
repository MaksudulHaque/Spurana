/* ============================================================
 * SPURANA · connect/akash.js — AKASHVANI (আকাশবাণী), the voice
 * from the sky. Emergency live push-to-talk between two souls.
 *
 * Hold the orb → your LIVE microphone streams to their device
 * over WebRTC (TURN-backed). If their app is open anywhere, it
 * bursts through instantly — no tap — with an emergency
 * vibration. If they can't be reached live within ~2.5s, your
 * held words (recorded in parallel) fire as a 🎙️ voice-flash
 * push to their lock screen the moment you release. The message
 * never dies.
 *
 * Honest limit: a locked / killed app cannot receive LIVE audio
 * (Android forbids it without a native foreground service —
 * that layer ships with the chat-head build). Live = open app;
 * otherwise = loudest lawful push.
 * ============================================================ */
(function () {
  "use strict";

  var conv = null, myId = null, partnerName = "them";
  var rxCh = null;           // broadcast channel (always armed once logged in)
  var pc = null, txStream = null, rec = null, chunks = [];
  var liveUp = false, answered = false, fallbackTimer = null;
  var rxPc = null, rxAudio = null, rxVibe = null;
  var stateFn = null;

  function vibe(seq) { try { if (window.Native && Native.pattern) Native.pattern(seq); else if (navigator.vibrate) navigator.vibrate(seq); } catch (e) {} }
  function setState(s, cls) { try { if (stateFn) stateFn(s, cls); } catch (e) {} }
  function ice() {
    try { if (window.Signaling && Signaling.iceConfig) return Signaling.iceConfig(); } catch (e) {}
    return { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
  }
  function send(event, payload) {
    try { if (rxCh) rxCh.send({ type: "broadcast", event: event, payload: payload || {} }); } catch (e) {}
  }

  // ── RECEIVER: armed globally; her open app hears the sky ──
  function stopRx() {
    try { if (rxVibe) { clearInterval(rxVibe); rxVibe = null; } } catch (e) {}
    try { if (rxAudio) { rxAudio.srcObject = null; rxAudio.pause(); } } catch (e) {}
    try { if (rxPc) rxPc.close(); } catch (e) {}
    rxPc = null;
  }
  async function onOffer(p) {
    if (!p || p.from === myId || !p.sdp) return;
    stopRx();
    try { var Cx = window.Capacitor; if (Cx && Cx.Plugins && Cx.Plugins.SoulBubble) Cx.Plugins.SoulBubble.pulse(); } catch (e) {}
    vibe([300, 140, 300, 140, 650]); // the sky opens — emergency signature
    rxVibe = setInterval(function () { vibe([220, 120, 220]); }, 3200);
    if (window.toast) toast("\u26A1 AKASHVANI \u2014 " + (p.name || partnerName) + " is speaking LIVE");
    try {
      rxPc = new RTCPeerConnection(ice());
      rxPc.ontrack = function (ev) {
        try {
          if (!rxAudio) rxAudio = new Audio();
          rxAudio.srcObject = ev.streams[0];
          rxAudio.volume = 1;
          var pr = rxAudio.play(); if (pr && pr.catch) pr.catch(function () {});
        } catch (e) {}
      };
      rxPc.onicecandidate = function (ev) { if (ev.candidate) send("ice-b", { from: myId, cand: ev.candidate }); };
      await rxPc.setRemoteDescription({ type: "offer", sdp: p.sdp });
      var ans = await rxPc.createAnswer();
      await rxPc.setLocalDescription(ans);
      send("answer", { from: myId, sdp: ans.sdp });
    } catch (e) { stopRx(); }
  }
  function armReceiver() {
    if (rxCh || !conv || !window.SP || !SP._sb) return;
    try {
      rxCh = SP._sb.channel("akash:" + conv)
        .on("broadcast", { event: "offer" }, function (m) { onOffer(m.payload); })
        .on("broadcast", { event: "answer" }, function (m) { onAnswer(m.payload); })
        .on("broadcast", { event: "ice-a" }, function (m) { if (rxPc && m.payload && m.payload.from !== myId && m.payload.cand) rxPc.addIceCandidate(m.payload.cand).catch(function () {}); })
        .on("broadcast", { event: "ice-b" }, function (m) { if (pc && m.payload && m.payload.from !== myId && m.payload.cand) pc.addIceCandidate(m.payload.cand).catch(function () {}); })
        .on("broadcast", { event: "end" }, function (m) { if (m.payload && m.payload.from !== myId) { stopRx(); vibe([60]); if (window.toast) toast("the sky is quiet again"); } })
        .subscribe();
    } catch (e) {}
  }

  // ── SENDER: hold = live stream + parallel recording (the guarantee) ──
  function onAnswer(p) {
    if (!p || p.from === myId || !pc || !p.sdp) return;
    answered = true;
    if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
    pc.setRemoteDescription({ type: "answer", sdp: p.sdp }).catch(function () {});
    setState("LIVE \u2014 they hear you", "live");
    vibe([50, 60, 50]);
  }

  async function holdStart() {
    if (liveUp) return;
    if (!conv) { var ok = await init(); if (!ok) { if (window.toast) toast("Bond with a soul first \u2726"); return; } }
    try { txStream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (e) { if (window.toast) toast("Microphone permission needed.", true); return; }
    liveUp = true; answered = false; chunks = [];
    vibe([45]); setState("reaching through the sky\u2026", "try");

    // parallel recording — the never-dies guarantee
    try {
      var mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      rec = new MediaRecorder(txStream, mime ? { mimeType: mime } : undefined);
      rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      rec.start();
    } catch (e) { rec = null; }

    // live WebRTC offer
    try {
      pc = new RTCPeerConnection(ice());
      txStream.getTracks().forEach(function (t) { pc.addTrack(t, txStream); });
      pc.onicecandidate = function (ev) { if (ev.candidate) send("ice-a", { from: myId, cand: ev.candidate }); };
      var off = await pc.createOffer({ offerToReceiveAudio: false });
      await pc.setLocalDescription(off);
      send("offer", { from: myId, name: (APP.me && APP.me.name) || "", sdp: off.sdp });
    } catch (e) {}

    fallbackTimer = setTimeout(function () {
      if (!answered) setState("they're away \u2014 your words will fly as a voice-flash", "flash");
    }, 2500);
  }

  async function holdEnd() {
    if (!liveUp) return;
    liveUp = false;
    if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
    send("end", { from: myId });
    var wasLive = answered;
    try { if (pc) pc.close(); } catch (e) {} pc = null;

    var doneRec = new Promise(function (res) {
      if (!rec) return res(null);
      rec.onstop = function () {
        try { txStream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
        if (!chunks.length) return res(null);
        res(new Blob(chunks, { type: (rec && rec.mimeType) || "audio/webm" }));
      };
      try { rec.stop(); } catch (e) { res(null); }
    });
    var blob = await doneRec;
    rec = null;

    if (wasLive) { setState("delivered live \u2726", "live"); vibe([40, 60, 110]); return; }
    if (!blob || blob.size < 900) { setState("hold longer to speak", ""); return; }
    setState("sending voice-flash\u2026", "flash");
    try {
      var file = window.File ? new File([blob], "akash.webm", { type: blob.type }) : blob;
      var up = await SP.media.upload(conv, file);
      if (up && up.data && up.data.path) {
        await SP.chat.send(conv, { type: "ptt", url: up.data.path, text: "\u26A1" });
        setState("voice-flash sent \u2014 it will find them \u2726", "flash");
        vibe([40, 60, 140]);
      } else setState("couldn't send \u2014 try again", "");
    } catch (e) { setState("couldn't send \u2014 try again", ""); }
  }

  async function init() {
    try {
      myId = APP.me.id;
      var r = await SP.contacts.list();
      var c = (r && r.data && r.data[0]) || null;
      if (!c) return false;
      partnerName = c.contact_name || c.name || "them";
      conv = SP.convIdFor(myId, c.contact_uid);
      armReceiver();
      return true;
    } catch (e) { return false; }
  }

  // ── the screen ──
  Router.register("akash", function (root) {
    root.appendChild(topBar({ title: "Akashvani", back: true }));
    var body = H.el("div", { class: "pad scroll grow reveal", style: "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;min-height:62vh;text-align:center" });
    root.appendChild(body);

    body.appendChild(H.el("div", { class: "akash-title" }, "\u0986\u0995\u09be\u09b6\u09ac\u09be\u09a3\u09c0"));
    body.appendChild(H.el("p", { class: "muted", style: "font-family:var(--f-soul);font-style:italic;max-width:300px;margin:0" },
      "The voice from the sky. Hold \u2014 and speak straight into their world."));

    var orb = H.el("button", { class: "akash-orb" }, "\u26A1");
    var status = H.el("div", { class: "akash-status" }, "hold to speak");
    stateFn = function (s, cls) { status.textContent = s; status.className = "akash-status " + (cls || ""); orb.classList.toggle("live", cls === "live"); orb.classList.toggle("try", cls === "try" || cls === "flash"); };

    var pressed = false;
    function down(e) { e.preventDefault(); pressed = true; holdStart(); }
    function up() { if (!pressed) return; pressed = false; holdEnd(); }
    orb.addEventListener("pointerdown", down);
    orb.addEventListener("pointerup", up);
    orb.addEventListener("pointercancel", up);
    orb.addEventListener("pointerleave", function () { if (pressed) up(); });

    body.appendChild(orb);
    body.appendChild(status);
    body.appendChild(H.el("p", { class: "muted", style: "font-size:11px;max-width:300px;opacity:.75" },
      "Live reaches an open Spurana instantly \u2014 no tap. If theirs is closed, your words fly as a \uD83C\uDF99\uFE0F voice-flash to their lock screen."));

    if (!conv) init();
    return { teardown: function () { stateFn = null; if (liveUp) holdEnd(); } };
  });

  // arm the sky once logged in
  try {
    var T = (typeof setInterval === "function") ? setInterval : (window.setInterval ? window.setInterval.bind(window) : null);
    var CI = (typeof clearInterval === "function") ? clearInterval : (window.clearInterval ? window.clearInterval.bind(window) : null);
    if (T) {
      var tries = 0;
      var iv = T(function () {
        tries++;
        if (window.APP && APP.me) { CI(iv); init(); }
        else if (tries > 60) CI(iv);
      }, 2500);
    }
  } catch (e) {}
})();
