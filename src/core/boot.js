/* ============================================================
 * SPURANA · core/boot.js  (STEP 1 — runs last)
 * App entry point. Captures ?code= invite links (works pre-login),
 * checks the session, keeps APP state synced via onAuthStateChange,
 * and routes. afterAuth() is the single post-login pipeline reused
 * by login.js and signup.js.
 * ============================================================ */
(function () {
  "use strict";

  // Single post-authentication pipeline.
  window.afterAuth = async function () {
    const { data: session } = await SP.auth.getSession();
    APP.session = session;
    APP.me = session ? session.user : null;
    if (!APP.me) { Router.go("login"); return; }

    await Session.refreshProfile();
    try { await SP.presence.setOnline(true); } catch (e) {}
    try { if (window.Calls) Calls.boot(); } catch (e) {}

    // A pending invite captured from a ?code= link → bond now.
    if (APP.pendingInvite) {
      const code = APP.pendingInvite; APP.pendingInvite = null;
      const r = await window.redeemCode(code);
      if (r.ok) { toast("Bonded with " + r.partner.name + " ✦"); Router.go("thread", { c: r.conv }); return; }
      toast(r.msg, true);
    }
    Router.go("wall");
  };

  (async function boot() {
    const root = document.getElementById("app");

    // ABSOLUTE SAFETY: once the app has rendered anything, no boot veil may linger.
    try {
      var killBoot = setInterval(function () {
        var bv = document.getElementById("bootVeil");
        var appEl = document.getElementById("app");
        if (appEl && appEl.children && appEl.children.length > 0) {
          if (bv) { bv.classList.add("lift"); setTimeout(function () { try { bv.remove(); } catch (e) {} }, 900); }
          clearInterval(killBoot);
        }
      }, 150);
      setTimeout(function () { try { clearInterval(killBoot); var bv = document.getElementById("bootVeil"); if (bv) bv.remove(); } catch (e) {} }, 4000);
    } catch (e) {}

    try { window.PERF.init(); } catch (e) {}
    try { if (window.TimeWorld) TimeWorld.init(); } catch (e) {}
    try { if (window.Weather) Weather.init(); } catch (e) {}
    try { if (window.World) World.init(); } catch (e) {}
    window.addEventListener("pointerdown", function _ar() { try { if (window.Ambient) Ambient.resume(); } catch (e) {} window.removeEventListener("pointerdown", _ar); });
    if (!window.SP) {
      if (root) root.innerHTML = '<div class="pad center muted">Connection module failed to load. Please refresh.</div>';
      return;
    }

    // Capture ?code= (invite link) before anything else, then clean the URL.
    try {
      const sp = new URLSearchParams(location.search);
      const code = sp.get("code");
      if (code) {
        APP.pendingInvite = code;
        history.replaceState(null, "", location.pathname + (location.hash || ""));
      }
    } catch (e) {}

    // Keep state in sync; route to login on sign-out.
    SP.auth.onChange((event, session) => {
      APP.session = session;
      if (event === "SIGNED_OUT") {
        APP.me = null; APP.profile = null; APP.activeConv = null; APP.partner = null;
        Router.go("login");
      }
    });

    // Online/offline presence on focus/blur (cheap, throttled by SP).
    window.addEventListener("blur", () => { try { SP.presence.setOnline(false); } catch (e) {} });
    window.addEventListener("focus", () => { if (APP.me) { try { SP.presence.setOnline(true); } catch (e) {} } });

    const { data: session } = await SP.auth.getSession();
    if (session) await window.afterAuth();
    else {
      if (APP.pendingInvite) toast("Sign in or create an account to bond.");
      Router.go("login");
    }
  })();

  // ── PWA: service worker + install prompt ──
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
  }
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); window.__installPrompt = e; });
  window.canInstall = function () { return !!window.__installPrompt; };
  window.isStandalone = function () {
    return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
  };
  window.installApp = async function () {
    const p = window.__installPrompt;
    if (p) { p.prompt(); try { await p.userChoice; } catch (e) {} window.__installPrompt = null; return; }
    // iOS / unsupported: guide manually
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    toast(ios ? "Tap Share, then 'Add to Home Screen' \u2726" : "Use your browser menu \u2192 Install / Add to Home screen.");
  };
})();
