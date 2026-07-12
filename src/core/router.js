/* ============================================================
 * SPURANA · core/router.js
 * ONE router. Hash-based. Screens register a render fn that may
 * return { teardown } — called when leaving the screen. This is
 * how realtime discipline is enforced: the chat thread unsubscribes
 * in its teardown, so only the OPEN conversation holds a channel.
 * ============================================================ */
(function () {
  "use strict";

  const screens = {};
  let current = null;     // { teardown }
  let mounted = "";

  function register(name, renderFn) { screens[name] = renderFn; }

  function parseHash() {
    const raw = (location.hash || "#/login").replace(/^#\/?/, "");
    const [path, qs] = raw.split("?");
    const name = path || "login";
    const query = {};
    if (qs) qs.split("&").forEach((kv) => {
      const [k, v] = kv.split("=");
      query[decodeURIComponent(k)] = decodeURIComponent(v || "");
    });
    return { name, query };
  }

  function go(name, query) {
    let h = "#/" + name;
    if (query) {
      const qs = Object.keys(query).map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(query[k])).join("&");
      if (qs) h += "?" + qs;
    }
    if (location.hash === h) render();      // force re-render on same hash
    else location.hash = h;                 // triggers hashchange -> render
  }

  function render() {
    const root = document.getElementById("app");
    if (!root) return;
    const { name, query } = parseHash();
    const fn = screens[name] || screens["login"];

    // tear down the previous screen (unsubscribe realtime, timers, etc.)
    if (current && typeof current.teardown === "function") {
      try { current.teardown(); } catch (e) { /* never let teardown break navigation */ }
    }
    H.clear(root);
    mounted = name;
    try {
      current = fn(root, query) || {};
      root.classList.remove("screen-in"); void root.offsetWidth; root.classList.add("screen-in");
    } catch (e) {
      console.error("[router] screen error:", name, e);
      root.appendChild(H.el("div", { class: "pad center muted" }, "Something went wrong loading this screen."));
      current = {};
    }
  }

  window.addEventListener("hashchange", render);

  window.Router = { register, go, render, parseHash, get current() { return mounted; } };
})();
