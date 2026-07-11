/* ============================================================
 * SPURANA · core/config.js
 * Single place for app-wide constants. No secrets here — the
 * Supabase URL + publishable key live in core/supabase.js (SP).
 * ============================================================ */
(function () {
  "use strict";
  window.CFG = {
    APP_NAME: "Spurana",
    TAGLINE: "A Sacred Space to Talk With Your Soul",
    BUILD: "couple-app · steps 1–4 · clean-sheets",
    HISTORY_LIMIT: 50,
    // Short consent copy shown at sign-up (from the Beta Consent & Privacy Notice).
    CONSENT_SHORT:
      "Spurana is a private sanctuary for two souls. This is an early beta — things may " +
      "change, break, or be reset. We collect only what the app needs (your email, name, " +
      "avatar, and the messages and activities you share with your partner). Your messages " +
      "and calls are private to you and your bonded partner. We never sell your data or show " +
      "ads. You can export or permanently delete everything at any time from Settings.",
    // WebRTC: public STUN works on same/simple networks; add a TURN server
    // (url/username/credential) for reliable connff across mobile NATs.
    ICE: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
    TURN: [
      { urls: "stun:stun.relay.metered.ca:80" },
      { urls: "turn:global.relay.metered.ca:80", username: "f76d5e2224b74e8ca8941a71", credential: "RMjAdrh0zm1Pnilz" },
      { urls: "turn:global.relay.metered.ca:80?transport=tcp", username: "f76d5e2224b74e8ca8941a71", credential: "RMjAdrh0zm1Pnilz" },
      { urls: "turn:global.relay.metered.ca:443", username: "f76d5e2224b74e8ca8941a71", credential: "RMjAdrh0zm1Pnilz" },
      { urls: "turns:global.relay.metered.ca:443?transport=tcp", username: "f76d5e2224b74e8ca8941a71", credential: "RMjAdrh0zm1Pnilz" },
    ],
    CONSENT_AGREE: "I have read and agree to the Privacy & Consent Notice.",
  };
})();
