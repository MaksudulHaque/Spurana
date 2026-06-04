/* ============================================================
 * SPURANA · calls/signaling.js  (STEP 7 — transport)
 * Thin wrapper over SP.calls (rtc_signals). Filters out our own
 * echoed rows (caller_uid === me) and routes signals to a handler.
 * SIGNAL CONTRACT (one upserted row per conversation):
 *   { channel:conv, caller_uid:writer, type, sdp, media, updated_at }
 *   type ∈ offer | answer | bye | decline | ring
 * Non-trickle ICE → only offer/answer (full SDP) + control msgs.
 * ============================================================ */
(function () {
  "use strict";
  window.Signaling = {
    me() { return APP.me && APP.me.id; },
    iceConfig() { const ice = (CFG.ICE || []).slice(); if (CFG.TURN) ice.push(CFG.TURN); return { iceServers: ice }; },
    async send(conv, type, extra) {
      try {
        const r = await SP.calls.sendSignal(conv, Object.assign({ type: type }, extra || {}));
        if (r && r.error) { console.warn("[calls] signal failed:", r.error.message || r.error); return r; }
        return r;
      } catch (e) { console.warn("[calls] signal threw:", e); return { error: e }; }
    },
    watch(conv, handler) {
      return SP.calls.subscribe(conv, (row) => {
        if (!row || row.caller_uid === this.me()) return;   // ignore our own echo
        handler(row);
      });
    },
    stop() { try { SP.calls.unsubscribe(); } catch (e) {} },
    async clear(conv) { try { await SP.calls.clear(conv); } catch (e) {} },
  };
})();
