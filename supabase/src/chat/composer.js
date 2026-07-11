/* ============================================================
 * SPURANA · chat/composer.js  (STEP 4)
 * Growing input + attach + send. Emits typing (SP throttles to
 * 1/sec) and clears it on idle/blur/send. Optimistic echo via
 * onSent (realtime also delivers the row; thread de-dupes by id).
 * ============================================================ */
(function () {
  "use strict";

  window.Composer = {
    build(convId, opts) {
      const o = opts || {};
      const ta = H.el("textarea", { rows: "1", placeholder: "Whisper something\u2026", "aria-label": "Message" });
      const send = H.el("button", { class: "send", title: "Send", disabled: "true" }, "\u27a4");
      const attach = H.el("button", { class: "attach", title: "Send media", onClick: () => {
        if (window.Media && window.Media.pick) window.Media.pick(convId, o);
        else toast("Photos & voice arrive in the next step.");
      } }, "\uFF0B");

      let typingOff = null;
      function autosize() {
        ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
        if (ta.value.trim()) send.removeAttribute("disabled"); else send.setAttribute("disabled", "true");
      }
      function signalTyping() {
        try { SP.presence.setTyping(true); } catch (e) {}
        clearTimeout(typingOff);
        typingOff = setTimeout(() => { try { SP.presence.setTyping(false); } catch (e) {} }, 3000);
      }
      async function doSend() {
        const text = ta.value.trim(); if (!text) return;
        ta.value = ""; autosize();
        clearTimeout(typingOff); try { SP.presence.setTyping(false); } catch (e) {}
        const { data, error } = await SP.chat.send(convId, { text });
        if (error) { toast(error.message || "Message didn\u2019t send.", true); ta.value = text; autosize(); return; }
        try { Audio2.sent(); } catch (e) {}
        if (o.onSent) o.onSent(data);
      }

      ta.addEventListener("input", () => { autosize(); if (ta.value.trim()) signalTyping(); });
      ta.addEventListener("blur", () => { clearTimeout(typingOff); try { SP.presence.setTyping(false); } catch (e) {} });
      ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doSend(); } });
      send.addEventListener("click", doSend);

      return H.el("div", { class: "composer" }, [attach, H.el("div", { class: "wrap" }, ta), send]);
    },
  };
})();
