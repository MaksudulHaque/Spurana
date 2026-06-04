/* ============================================================
 * SPURANA · calls/engine.js  (STEP 7 — SacredCall engine)
 * 1:1 voice/video over WebRTC. Non-trickle ICE: we gather, then
 * send a full-SDP offer/answer through Signaling. One peer
 * connection at a time; teardown stops tracks + closes pc.
 * States: idle | calling | ringing | connecting | connected | ended
 * ============================================================ */
(function () {
  "use strict";

  let pc = null, localStream = null, remoteStream = null;
  let state = "idle", conv = null, media = "audio", partner = null, pendingOffer = null;
  let listening = null, timer = null, startedAt = 0;

  function set(s) { state = s; }
  function isBusy() { return state !== "idle" && state !== "ended"; }

  async function getMedia(video) {
    return navigator.mediaDevices.getUserMedia({ audio: true, video: video ? { facingMode: "user" } : false });
  }
  function buildPc() {
    pc = new RTCPeerConnection(Signaling.iceConfig());
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
    pc.ontrack = (e) => { remoteStream = e.streams[0]; if (window.CallUI) CallUI.setRemote(remoteStream); };
    pc.onconnectionstatechange = () => {
      if (!pc) return;
      const st = pc.connectionState;
      if (st === "connected") { set("connected"); if (window.CallUI) CallUI.connected(); startTimer(); }
      else if (st === "failed" || st === "disconnected" || st === "closed") { if (state !== "ended") endLocal(st === "failed" ? "Call failed" : "Call ended"); }
    };
  }
  // Non-trickle: wait until ICE gathering completes (2.5s cap), then read localDescription.
  function gathered() {
    if (!pc || pc.iceGatheringState === "complete") return Promise.resolve();
    return new Promise((res) => {
      const chk = () => { if (pc && pc.iceGatheringState === "complete") { pc.removeEventListener("icegatheringstatechange", chk); res(); } };
      pc.addEventListener("icegatheringstatechange", chk);
      setTimeout(res, 2500);
    });
  }
  function startTimer() { startedAt = Date.now(); clearInterval(timer); timer = setInterval(() => { if (window.CallUI) CallUI.tick(Math.floor((Date.now() - startedAt) / 1000)); }, 1000); }

  async function start(c, kind, who) {
    if (isBusy()) { toast("Already in a call."); return; }
    if (!navigator.mediaDevices || !window.RTCPeerConnection) { toast("Calls aren't supported on this device.", true); return; }
    conv = c; media = kind; partner = who || APP.partner || { name: "Your beloved" };
    set("calling");
    if (window.CallUI) CallUI.outgoing(partner, media, controls);
    try { localStream = await getMedia(media === "video"); }
    catch (e) { toast("Camera/microphone permission needed.", true); cleanup(); if (window.CallUI) CallUI.close(); set("idle"); return; }
    if (window.CallUI) CallUI.setLocal(localStream, media);
    buildPc();
    try {
      await pc.setLocalDescription(await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: media === "video" }));
      await gathered();
      await Signaling.send(conv, "offer", { sdp: pc.localDescription.sdp, media: media });
      set("connecting");
    } catch (e) { console.warn(e); endLocal("Could not start the call"); }
  }

  // incoming offer arrived (from listen router)
  function onOffer(row) {
    if (isBusy()) { Signaling.send(row.channel || conv, "decline"); return; }   // busy → auto-decline
    conv = row.channel || APP.activeConv; media = row.media || "audio";
    partner = APP.partner || { name: "Your beloved" };
    pendingOffer = { sdp: row.sdp, media: media };
    set("ringing");
    if (window.CallUI) CallUI.incoming(partner, media, accept, decline);
    try { Audio2.received(); } catch (e) {}
  }
  async function accept() {
    if (state !== "ringing" || !pendingOffer) return;
    try { localStream = await getMedia(media === "video"); }
    catch (e) { toast("Camera/microphone permission needed.", true); decline(); return; }
    if (window.CallUI) { CallUI.connecting(); CallUI.setLocal(localStream, media); }
    buildPc();
    try {
      await pc.setRemoteDescription({ type: "offer", sdp: pendingOffer.sdp });
      await pc.setLocalDescription(await pc.createAnswer());
      await gathered();
      await Signaling.send(conv, "answer", { sdp: pc.localDescription.sdp });
      set("connecting");
    } catch (e) { console.warn(e); endLocal("Could not connect"); }
    pendingOffer = null;
  }
  async function onAnswer(row) {
    if (!pc || (state !== "connecting" && state !== "calling")) return;
    try { await pc.setRemoteDescription({ type: "answer", sdp: row.sdp }); } catch (e) { console.warn(e); }
  }
  function decline() { Signaling.send(conv, "decline"); cleanup(); if (window.CallUI) CallUI.close(); set("idle"); }
  function end() { if (conv) { Signaling.send(conv, "bye"); Signaling.clear(conv); } endLocal("Call ended", true); }
  function endLocal(msg, silent) { if (!silent && msg) toast(msg); cleanup(); if (window.CallUI) CallUI.close(); set("ended"); setTimeout(() => { if (state === "ended") set("idle"); }, 400); }
  function cleanup() {
    clearInterval(timer); timer = null;
    if (pc) { try { pc.close(); } catch (e) {} pc = null; }
    if (localStream) { localStream.getTracks().forEach((t) => t.stop()); localStream = null; }
    remoteStream = null; pendingOffer = null;
  }

  const controls = {
    end: end,
    toggleMute() { if (!localStream) return false; const a = localStream.getAudioTracks()[0]; if (a) a.enabled = !a.enabled; return a ? !a.enabled : false; },
    toggleCam() { if (!localStream) return false; const v = localStream.getVideoTracks()[0]; if (v) v.enabled = !v.enabled; return v ? !v.enabled : false; },
  };

  function route(row) {
    if (row.type === "offer") onOffer(row);
    else if (row.type === "answer") onAnswer(row);
    else if (row.type === "decline") { if (isBusy()) endLocal("Call declined"); }
    else if (row.type === "bye") { if (isBusy()) endLocal("Call ended"); }
  }

  // Subscribe to a conversation's signaling channel for incoming calls.
  function listen(c) {
    if (!c || listening === c) return;
    listening = c; if (!conv) conv = c;
    Signaling.watch(c, route);
  }
  // Load the bonded conversation(s) and listen, so calls can arrive on any screen.
  async function boot() {
    try {
      const { data } = await SP.contacts.list();
      const me = APP.me && APP.me.id; if (!me || !data || !data.length) return;
      const c = data[0]; const puid = c.contact_uid || c.partner_uid || c.uid;
      if (!puid) return;
      const cid = SP.convIdFor(me, puid);
      if (!APP.partner) APP.partner = { uid: puid, name: c.contact_name || c.name || "Your beloved" };
      listen(cid);
    } catch (e) { /* calls remain available once a thread is opened */ }
  }

  window.Calls = { start: start, accept: accept, decline: decline, end: end, listen: listen, boot: boot, controls: controls, get state() { return state; } };
})();
