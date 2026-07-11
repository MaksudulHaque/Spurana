/* ============================================================
 * SPURANA · core/biolock.js — the Sanctum Seal.
 * Bank-grade biometric lock. When enabled, opening or returning
 * to Spurana veils everything behind the void until your
 * fingerprint touches the seal (Android BiometricPrompt).
 * Your session persists — the seal is a local gate, like a
 * banking app. Native app only; silent no-op on the web.
 * ============================================================ */
(function () {
  "use strict";

  var KEY = "spurana.biolock";
  var availCache = null, veil = null, prompting = false, expectResume = false, lastUnlock = 0;

  function BIO() {
    var C = window.Capacitor;
    if (!(C && C.isNativePlatform && C.isNativePlatform())) return null;
    return (C.Plugins && C.Plugins.BiometricAuthNative) || null;
  }
  function enabled() { try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; } }
  function vibe(seq) { try { if (window.Native && Native.pattern) Native.pattern(seq); else if (navigator.vibrate) navigator.vibrate(seq); } catch (e) {} }

  async function available() {
    if (availCache !== null) return availCache;
    var b = BIO(); if (!b) { availCache = false; return false; }
    try { var r = await b.checkBiometry(); availCache = !!(r && r.isAvailable); }
    catch (e) { availCache = false; }
    return availCache;
  }

  function prompt(reason) {
    var b = BIO();
    if (!b) return Promise.reject(new Error("no biometry"));
    expectResume = true; // the biometric sheet pauses/resumes US — don't re-lock for it
    setTimeout(function () { expectResume = false; }, 6000);
    return b.internalAuthenticate({
      reason: reason || "Unlock Spurana",
      androidTitle: "The Sanctum Seal",
      androidSubtitle: "Only your touch may open this space",
      cancelTitle: "Not now",
      allowDeviceCredential: true, // PIN/pattern fallback, like a bank
    });
  }

  function buildVeil() {
    if (veil) return veil;
    veil = document.createElement("div");
    veil.className = "bio-veil";
    veil.innerHTML =
      '<div class="bio-inner">' +
      '<div class="bio-seal">\u2726</div>' +
      '<div class="bio-title">The Sanctum is sealed</div>' +
      '<div class="bio-sub">Touch the seal to enter</div>' +
      '<button class="bio-btn" id="bioTry">Touch the seal</button>' +
      '<button class="bio-alt" id="bioOut">Sign in with password instead</button>' +
      "</div>";
    document.body.appendChild(veil);
    veil.querySelector("#bioTry").onclick = tryUnlock;
    veil.querySelector("#bioOut").onclick = function () {
      hide();
      try { SP._sb.auth.signOut().then(function () { location.hash = "#/login"; location.reload(); }); }
      catch (e) { location.hash = "#/login"; }
    };
    return veil;
  }
  function show() { buildVeil().classList.add("on"); }
  function hide() { if (veil) veil.classList.remove("on"); }

  function tryUnlock() {
    if (prompting) return;
    prompting = true;
    prompt("Unlock Spurana").then(function () {
      prompting = false; lastUnlock = Date.now();
      vibe([30, 45, 70]);
      hide();
    }).catch(function () {
      prompting = false;
      vibe([120]);
      var s = veil && veil.querySelector(".bio-sub");
      if (s) s.textContent = "The seal did not yield \u2014 try again";
    });
  }

  async function lock() {
    if (!enabled()) return;
    if (!(await available())) return;
    show();
    setTimeout(tryUnlock, 350); // raise the prompt without waiting for a tap
  }

  window.BioLock = {
    available: available,
    enabled: enabled,
    setEnabled: async function (v) {
      if (!(await available())) { if (window.toast) toast("Biometrics aren't available on this device.", true); return false; }
      try {
        await prompt(v ? "Confirm to seal the sanctum" : "Confirm to remove the seal");
        lastUnlock = Date.now();
        try { localStorage.setItem(KEY, v ? "1" : "0"); } catch (e) {}
        vibe([40, 60, 90]);
        if (window.toast) toast(v ? "The Sanctum Seal is set \u2726" : "The seal is lifted.");
        return true;
      } catch (e) { if (window.toast) toast("Not confirmed.", true); return false; }
    },
    lock: lock,
  };

  // gate on cold open (once logged in) and on every return from background
  try {
    var T = (typeof setInterval === "function") ? setInterval : (window.setInterval ? window.setInterval.bind(window) : null);
    var CI = (typeof clearInterval === "function") ? clearInterval : (window.clearInterval ? window.clearInterval.bind(window) : null);
    if (T && BIO()) {
      var tries = 0;
      var iv = T(function () {
        tries++;
        if (window.APP && APP.me) { CI(iv); lock(); }
        else if (tries > 60) CI(iv);
      }, 1200);
      var C = window.Capacitor;
      if (C && C.Plugins && C.Plugins.App && C.Plugins.App.addListener) {
        C.Plugins.App.addListener("resume", function () {
          if (prompting) return;
          if (expectResume) { expectResume = false; return; } // our own fingerprint sheet closing
          if (Date.now() - lastUnlock < 2500) return;          // just unlocked — grace
          if (enabled()) lock();
        });
      }
    }
  } catch (e) {}
})();
