/* ============================================================
 * SPURANA · calls/ui.js  (STEP 7 — call screen)
 * Full-screen overlay: incoming/outgoing/connected phases, video
 * tiles (or avatar for voice), mute/cam/end controls, timer.
 * Pure view — the engine drives it.
 * ============================================================ */
(function () {
  "use strict";

  let root = null, remoteV = null, localV = null, statusEl = null, ctrlEl = null, stage = null, nameEl = null, ctl = null, curMedia = "audio";

  function build() {
    remoteV = H.el("video", { autoplay: "true", playsinline: "true", class: "rv" });
    localV = H.el("video", { autoplay: "true", playsinline: "true", muted: "true", class: "lv" });
    const avatar = H.el("div", { class: "call-ava", id: "callAva" }, "");
    nameEl = H.el("div", { class: "call-name" }, "");
    statusEl = H.el("div", { class: "call-status" }, "");
    stage = H.el("div", { class: "call-stage" }, [remoteV, localV, avatar, nameEl, statusEl]);
    ctrlEl = H.el("div", { class: "call-controls" });
    root = H.el("div", { id: "callscreen" }, [stage, ctrlEl]);
    document.body.appendChild(root);
  }
  function ensure() { if (!root) build(); }
  function show(media) { ensure(); curMedia = media; root.classList.add("on"); root.classList.toggle("video", media === "video"); }
  function setAva(partner) {
    const a = document.getElementById("callAva"); if (a) a.textContent = H.initials(partner && partner.name);
    if (nameEl) nameEl.textContent = (partner && partner.name) || "Your beloved";
  }
  function iconBtn(cls, glyph, onClick) { return H.el("button", { class: "cbtn " + cls, onClick: onClick }, glyph); }

  function inCallControls() {
    H.clear(ctrlEl);
    let muted = false, camOff = false;
    const mute = iconBtn("mute", "\uD83C\uDF99", () => { muted = ctl.toggleMute(); mute.classList.toggle("off", muted); mute.textContent = muted ? "\uD83D\uDD07" : "\uD83C\uDF99"; });
    ctrlEl.appendChild(mute);
    if (curMedia === "video") {
      const cam = iconBtn("cam", "\uD83D\uDCF9", () => { camOff = ctl.toggleCam(); cam.classList.toggle("off", camOff); });
      ctrlEl.appendChild(cam);
    }
    ctrlEl.appendChild(iconBtn("end", "\u2715", () => ctl.end()));
  }

  window.CallUI = {
    outgoing(partner, media, controls) { ctl = controls; show(media); setAva(partner); statusEl.textContent = media === "video" ? "Calling\u2026 (video)" : "Calling\u2026"; H.clear(ctrlEl); ctrlEl.appendChild(iconBtn("end", "\u2715", () => ctl.end())); },
    incoming(partner, media, accept, decline) {
      ctl = { end: decline }; show(media); setAva(partner);
      statusEl.textContent = (media === "video" ? "Incoming video call\u2026" : "Incoming call\u2026");
      H.clear(ctrlEl);
      ctrlEl.appendChild(iconBtn("decline", "\u2715", () => decline()));
      ctrlEl.appendChild(iconBtn("accept", "\u2713", () => accept()));
      try { Audio2.received(); } catch (e) {}
    },
    connecting() { if (statusEl) statusEl.textContent = "Connecting\u2026"; },
    connected() { if (statusEl) statusEl.textContent = "0:00"; inCallControls(); if (root) root.classList.add("connected"); },
    tick(s) { if (statusEl && root && root.classList.contains("connected")) statusEl.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); },
    setLocal(stream, media) { ensure(); try { localV.srcObject = stream; } catch (e) {} root.classList.toggle("video", media === "video"); },
    setRemote(stream) { ensure(); try { remoteV.srcObject = stream; } catch (e) {} },
    close() { if (!root) return; root.classList.remove("on", "connected", "video"); try { remoteV.srcObject = null; localV.srcObject = null; } catch (e) {} },
  };
})();
