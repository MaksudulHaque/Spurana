/* ============================================================
 * SPURANA · connect/antor.js — ANTORDRISHTI (অন্তর্দৃষ্টি),
 * the seeing-within. A private always-on stage for two souls,
 * Discord-style: step in and you are connected — no ringing,
 * no accept. Both publish live mic + camera; both see and hear.
 * Open a window into their world; let them into yours.
 *
 * Presence-driven: when BOTH are on the stage, the link forms
 * itself, smoothly. If they're away, the stage waits and calls
 * them in. Honest law: their camera/mic can only be reached
 * while their Spurana is open (the green dot is Android's rule,
 * and it protects you both) — so this is a meeting of two
 * present souls, seamless the instant they arrive.
 * ============================================================ */
(function () {
  "use strict";

  var conv = null, myId = null, myName = "", partnerName = "them";
  var ch = null, pc = null, localStream = null, remoteStream = null;
  var iAmPolite = false;        // perfect-negotiation role (lower uid = polite)
  var joined = false, makingOffer = false, partnerHere = false;
  var ui = null, els = {};
  var presenceTimer = null, lastSeen = 0;

  function ice() {
    try { if (window.Signaling && Signaling.iceConfig) return Signaling.iceConfig(); } catch (e) {}
    return { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
  }
  function vibe(seq) { try { if (window.Native && Native.pattern) Native.pattern(seq); else if (navigator.vibrate) navigator.vibrate(seq); } catch (e) {} }
  function sig(event, payload) { try { if (ch) ch.send({ type: "broadcast", event: event, payload: Object.assign({ from: myId }, payload || {}) }); } catch (e) {} }
  function setStatus(t, cls) { if (els.status) { els.status.textContent = t; els.status.className = "antor-status " + (cls || ""); } }

  async function ensureLocal() {
    if (localStream) return localStream;
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    if (els.localV) { els.localV.srcObject = localStream; els.localV.muted = true; els.localV.play().catch(function () {}); }
    return localStream;
  }

  function freshPC() {
    if (pc) { try { pc.close(); } catch (e) {} }
    pc = new RTCPeerConnection(ice());
    localStream.getTracks().forEach(function (t) { pc.addTrack(t, localStream); });
    remoteStream = new MediaStream();
    if (els.remoteV) els.remoteV.srcObject = remoteStream;
    pc.ontrack = function (ev) {
      ev.streams[0].getTracks().forEach(function (t) {
        remoteStream.addTrack(t);
      });
      if (els.remoteV) { els.remoteV.srcObject = remoteStream; els.remoteV.play().catch(function () {}); }
      setStatus("connected \u2726", "live");
      els.stage && els.stage.classList.add("connected");
    };
    pc.onicecandidate = function (ev) { if (ev.candidate) sig("ice", { cand: ev.candidate }); };
    pc.onnegotiationneeded = async function () {
      try {
        makingOffer = true;
        await pc.setLocalDescription(await pc.createOffer());
        sig("desc", { sdp: pc.localDescription });
      } catch (e) {} finally { makingOffer = false; }
    };
    pc.oniceconnectionstatechange = function () {
      if (!pc) return;
      if (pc.iceConnectionState === "failed") { try { pc.restartIce(); } catch (e) {} }
      if (pc.iceConnectionState === "disconnected") setStatus("reconnecting\u2026", "wait");
    };
    return pc;
  }

  // ── perfect negotiation (glitch-free, both can offer) ──
  async function onDesc(desc) {
    try {
      var offerCollision = desc.type === "offer" && (makingOffer || (pc && pc.signalingState !== "stable"));
      if (offerCollision && !iAmPolite) return; // impolite peer ignores the collision
      if (!pc) freshPC();
      await pc.setRemoteDescription(desc);
      if (desc.type === "offer") {
        await pc.setLocalDescription(await pc.createAnswer());
        sig("desc", { sdp: pc.localDescription });
      }
    } catch (e) {}
  }
  function onIce(c) { if (pc && c) pc.addIceCandidate(c).catch(function () {}); }

  async function connectTo() {
    if (!pc) freshPC();
    // both call this; onnegotiationneeded drives the first offer
    setStatus("opening the inner sight\u2026", "wait");
  }

  // ── presence: hello/bye + heartbeat so the stage self-forms ──
  function startPresence() {
    sig("hello", { name: myName });
    presenceTimer = setInterval(function () {
      sig("ping", {});
      if (partnerHere && Date.now() - lastSeen > 9000) { partnerHere = false; onPartnerLeft(); }
    }, 3000);
  }
  function onPartnerHere(name) {
    lastSeen = Date.now();
    if (partnerHere) return;
    partnerHere = true;
    partnerName = name || partnerName;
    vibe([50, 60, 90]);
    setStatus(partnerName + " is here \u2014 joining\u2026", "wait");
    els.presence && els.presence.classList.add("on");
    connectTo();
  }
  function onPartnerLeft() {
    els.stage && els.stage.classList.remove("connected");
    els.presence && els.presence.classList.remove("on");
    setStatus(partnerName + " stepped away \u2014 the stage waits", "wait");
    if (pc) { try { pc.close(); } catch (e) {} pc = null; }
  }

  function armChannel() {
    ch = SP._sb.channel("antor:" + conv, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "hello" }, function (m) { if (m.payload.from !== myId) { onPartnerHere(m.payload.name); sig("hello-ack", { name: myName }); } })
      .on("broadcast", { event: "hello-ack" }, function (m) { if (m.payload.from !== myId) onPartnerHere(m.payload.name); })
      .on("broadcast", { event: "ping" }, function (m) { if (m.payload.from !== myId) { lastSeen = Date.now(); if (!partnerHere) onPartnerHere(partnerName); } })
      .on("broadcast", { event: "desc" }, function (m) { if (m.payload.from !== myId) onDesc(m.payload.sdp); })
      .on("broadcast", { event: "ice" }, function (m) { if (m.payload.from !== myId) onIce(m.payload.cand); })
      .on("broadcast", { event: "bye" }, function (m) { if (m.payload.from !== myId) onPartnerLeft(); })
      .subscribe(function (st) { if (st === "SUBSCRIBED") startPresence(); });
  }

  async function join() {
    if (joined) return;
    try { await ensureLocal(); }
    catch (e) { setStatus("mic + camera permission needed", ""); if (window.toast) toast("Allow mic & camera for Antordrishti.", true); return; }
    joined = true;
    myId = APP.me.id; myName = (APP.me && APP.me.name) || "";
    iAmPolite = myId < partnerUid; // deterministic role
    setStatus("you're on the stage \u2014 waiting for " + partnerName, "wait");
    armChannel();
  }

  function leave() {
    joined = false;
    try { sig("bye", {}); } catch (e) {}
    try { if (presenceTimer) clearInterval(presenceTimer); } catch (e) {}
    try { if (ch && SP._sb) SP._sb.removeChannel(ch); } catch (e) {} ch = null;
    try { if (pc) pc.close(); } catch (e) {} pc = null;
    try { if (localStream) localStream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
    localStream = null; remoteStream = null; partnerHere = false;
  }

  var partnerUid = null;
  async function resolvePartner() {
    myId = APP.me.id;
    var r = await SP.contacts.list();
    var c = (r && r.data && r.data[0]) || null;
    if (!c) return false;
    partnerUid = c.contact_uid;
    partnerName = c.contact_name || c.name || "them";
    conv = SP.convIdFor(myId, partnerUid);
    return true;
  }

  Router.register("antor", function (root) {
    root.appendChild(topBar({ title: "Antordrishti", back: true }));
    var stage = H.el("div", { class: "antor-stage" });
    els.stage = stage;

    els.remoteV = H.el("video", { class: "antor-remote", autoplay: "", playsinline: "" });
    els.localV = H.el("video", { class: "antor-local", autoplay: "", playsinline: "", muted: "" });
    var presence = H.el("div", { class: "antor-presence" }, "\u2726");
    els.presence = presence;
    var status = H.el("div", { class: "antor-status" }, "stepping onto the stage\u2026");
    els.status = status;

    // controls
    var muted = false, camOff = false, front = true;
    function ctl(label, cls, fn) { var b = H.el("button", { class: "antor-ctl " + cls }, label); b.onclick = fn; return b; }
    var micBtn = ctl("\uD83C\uDF99", "", function () {
      if (!localStream) return; var a = localStream.getAudioTracks()[0]; if (!a) return;
      a.enabled = !a.enabled; muted = !a.enabled; micBtn.classList.toggle("off", muted); micBtn.textContent = muted ? "\uD83D\uDD07" : "\uD83C\uDF99";
    });
    var camBtn = ctl("\uD83D\uDCF9", "", function () {
      if (!localStream) return; var v = localStream.getVideoTracks()[0]; if (!v) return;
      v.enabled = !v.enabled; camOff = !v.enabled; camBtn.classList.toggle("off", camOff);
    });
    var flipBtn = ctl("\uD83D\uDD04", "", async function () {
      // see their world: flip between front and back camera smoothly
      try {
        front = !front;
        var ns = await navigator.mediaDevices.getUserMedia({ video: { facingMode: front ? "user" : "environment" }, audio: false });
        var nt = ns.getVideoTracks()[0];
        var sender = pc && pc.getSenders().find(function (s) { return s.track && s.track.kind === "video"; });
        if (sender && nt) await sender.replaceTrack(nt);
        var old = localStream.getVideoTracks()[0];
        if (old) { localStream.removeTrack(old); old.stop(); }
        localStream.addTrack(nt);
        els.localV.srcObject = localStream;
      } catch (e) {}
    });
    var endBtn = ctl("\u2715", "end", function () { Router.go("chat"); });

    stage.appendChild(els.remoteV);
    stage.appendChild(presence);
    stage.appendChild(els.localV);
    stage.appendChild(status);
    stage.appendChild(H.el("div", { class: "antor-controls" }, [micBtn, camBtn, flipBtn, endBtn]));
    root.appendChild(stage);

    (async function () {
      var ok = await resolvePartner();
      if (!ok) { setStatus("bond with a soul first \u2726", ""); if (window.toast) toast("Bond with a soul first \u2726"); return; }
      status.textContent = "stepping onto the stage\u2026";
      join();
    })();

    return { teardown: leave };
  });
})();
