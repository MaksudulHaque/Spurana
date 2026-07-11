/* ============================================================
 * SPURANA · chat/media.js  (STEP 5 — photos & voice notes)
 * Owns BOTH sending media (pick/record -> upload -> send) and
 * rendering media bubbles (signed-url image + voice player) so
 * thread.js can delegate. Private 'media' bucket; messages.url
 * holds the storage path; signed URLs are fetched + cached.
 * ============================================================ */
(function () {
  "use strict";

  const urlCache = {};                 // path -> signed url
  async function signed(path) {
    if (!path) return null;
    if (urlCache[path]) return urlCache[path];
    const { data, error } = await SP.media.signedUrl(path, 3600);
    if (error || !data) return null;
    urlCache[path] = data; return data;
  }

  function lightbox(src) {
    const box = H.el("div", { id: "lightbox", onClick: () => box.remove() }, H.el("img", { src: src }));
    document.body.appendChild(box);
  }

  // bubble content for media messages; returns a node or null (text → null)
  function bubbleContent(m) {
    if (m.type === "image") {
      const img = H.el("img", { class: "photo loading", alt: "photo" });
      signed(m.url).then((u) => { if (u) { img.src = u; img.classList.remove("loading"); } });
      img.addEventListener("click", () => { if (img.src) lightbox(img.src); });
      return img;
    }
    if ((m.type === "voice" || m.type === "ptt")) {
      const audio = H.el("audio", { preload: "none" });
      const dur = Number(m.text) || 0;
      const play = H.el("button", { class: "play", title: "Play" }, "\u25B6");
      const bar = H.el("div", { class: "bar" }, H.el("i"));
      const label = H.el("div", { class: "dur" }, fmt(dur));
      let loaded = false;
      play.addEventListener("click", async () => {
        if (!loaded) { const u = await signed(m.url); if (!u) { toast("Couldn't load voice note.", true); return; } audio.src = u; loaded = true; }
        if (audio.paused) { audio.play(); play.textContent = "\u275A\u275A"; } else { audio.pause(); play.textContent = "\u25B6"; }
      });
      audio.addEventListener("timeupdate", () => { if (audio.duration) bar.firstChild.style.width = (audio.currentTime / audio.duration * 100) + "%"; if (audio.currentTime) label.textContent = fmt(audio.currentTime); });
      audio.addEventListener("ended", () => { play.textContent = "\u25B6"; bar.firstChild.style.width = "0%"; label.textContent = fmt(dur); });
      return H.el("div", { class: "voice" }, [play, bar, label, audio]);
    }
    return null;
  }
  function fmt(s) { s = Math.round(s || 0); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }

  // ── sending ──
  async function uploadAndSend(convId, file, type, extra) {
    toast(type === "voice" ? "Sending voice note\u2026" : "Sending photo\u2026");
    const up = await SP.media.upload(convId, file);
    if (up.error || !up.data) { toast((up.error && up.error.message) || "Upload failed.", true); return; }
    const opts = Object.assign({ type: type, url: up.data.path }, extra || {});
    const sent = await SP.chat.send(convId, opts);
    if (sent.error) { toast("Couldn't send.", true); return; }
    try { Audio2.sent(); } catch (e) {}
  }

  function pickImage(convId) {
    const input = H.el("input", { type: "file", accept: "image/*", style: "display:none" });
    document.body.appendChild(input);
    input.addEventListener("change", async () => {
      const f = input.files && input.files[0]; input.remove();
      if (f) await uploadAndSend(convId, f, "image");
    });
    input.click();
  }

  let rec = null, chunks = [], recStart = 0, recTimer = null, recBar = null;
  async function startVoice(convId) {
    if (!navigator.mediaDevices || !window.MediaRecorder) { toast("Voice notes aren't supported on this device.", true); return; }
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (e) { toast("Microphone permission needed for voice notes.", true); return; }
    chunks = []; recStart = Date.now();
    const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
    rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const secs = Math.round((Date.now() - recStart) / 1000);
      const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
      const file = (window.File) ? new File([blob], "voice.webm", { type: blob.type }) : blob;
      if (!file.name) try { file.name = "voice.webm"; } catch (e) {}
      teardownRecUI();
      if (secs >= 1) await uploadAndSend(convId, file, "voice", { text: String(secs) });
    };
    rec.start();
    showRecUI(convId);
  }
  function showRecUI(convId) {
    const time = H.el("span", null, "0:00");
    recTimer = setInterval(() => { time.textContent = fmt((Date.now() - recStart) / 1000); }, 250);
    const stop = H.el("button", { class: "btn btn-primary", onClick: () => rec && rec.state !== "inactive" && rec.stop() }, "Send");
    const cancel = H.el("button", { class: "btn btn-ghost", onClick: () => { chunks = []; if (rec) { rec.onstop = () => { try { rec.stream && rec.stream.getTracks().forEach((t) => t.stop()); } catch (e) {} }; } recCancel(); } }, "Cancel");
    recBar = H.el("div", { class: "rec-bar" }, [H.el("span", { class: "rec-dot" }), H.el("span", { class: "rec-lbl" }, "Recording"), time, stop, cancel]);
    document.body.appendChild(recBar);
  }
  function recCancel() { try { if (rec && rec.state !== "inactive") { rec.stop(); } } catch (e) {} teardownRecUI(); }
  function teardownRecUI() { clearInterval(recTimer); if (recBar) { recBar.remove(); recBar = null; } }

  function pick(convId) {
    const back = H.el("div", { style: "position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9990" });
    const sheet = H.el("div", { class: "pad stack", style: "position:fixed;left:50%;transform:translateX(-50%);bottom:calc(20px + var(--sab));width:88%;max-width:480px;z-index:9991;background:#140f1c;border:1px solid var(--border);border-radius:var(--r-lg);box-shadow:var(--shadow)" }, [
      H.el("button", { class: "btn btn-ghost btn-block", onClick: () => { close(); pickImage(convId); } }, "\uD83D\uDCF7  Photo"),
      H.el("button", { class: "btn btn-ghost btn-block", onClick: () => { close(); startVoice(convId); } }, "\uD83C\uDF99  Voice note"),
      H.el("button", { class: "btn btn-ghost btn-block", onClick: () => close() }, "Cancel"),
    ]);
    function close() { sheet.remove(); back.remove(); }
    back.addEventListener("click", close);
    document.body.append(back, sheet);
  }

  window.Media = { pick: pick, bubbleContent: bubbleContent, lightbox: lightbox };
})();
