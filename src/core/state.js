/* ============================================================
 * SPURANA · core/state.js
 * ONE app-state object (window.APP) + minimal helpers used
 * across modules. No duplicate state stores anywhere.
 * ============================================================ */
(function () {
  "use strict";

  window.APP = {
    session: null,     // supabase session
    me: null,          // auth user { id, email }
    profile: null,     // profiles row
    activeConv: null,  // conv_id currently open
    partner: null,     // { uid, name } for the active conversation
    contacts: [],      // bonded souls
    pendingInvite: null, // invite code captured from URL before login
  };
  // ── language: 'en' | 'bn' (Bangla). T(en, bn) returns the active-language string. ──
  try { window.LANG = (localStorage.getItem("spurana.lang") === "bn") ? "bn" : "en"; } catch (e) { window.LANG = "en"; }
  window.T = function (en, bn) { return (window.LANG === "bn" && bn) ? bn : en; };
  window.setLang = function (l) { window.LANG = (l === "bn") ? "bn" : "en"; try { localStorage.setItem("spurana.lang", window.LANG); } catch (e) {} try { document.documentElement.setAttribute("lang", window.LANG); if (window.Router && Router.render) Router.render(); } catch (e) {} };

  // --- tiny DOM helpers (no frameworks, no DOM-scanning loops) ---
  const H = {
    el(tag, attrs, children) {
      const n = document.createElement(tag);
      if (attrs) for (const k in attrs) {
        if (k === "class") n.className = attrs[k];
        else if (k === "html") n.innerHTML = attrs[k];
        else if (k === "text") n.textContent = attrs[k];
        else if (k.slice(0, 2) === "on" && typeof attrs[k] === "function")
          n.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
      }
      if (children != null) {
        const arr = Array.isArray(children) ? children : [children];
        for (const c of arr) if (c != null) n.append(c.nodeType ? c : document.createTextNode(c));
      }
      return n;
    },
    clear(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; },
    esc(s) { const d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; },
    initials(name) {
      const p = (name || "?").trim().split(/\s+/);
      return ((p[0] || "?")[0] + (p[1] ? p[1][0] : "")).toUpperCase();
    },
    timeLabel(ts) {
      const d = new Date(Number(ts) || ts);
      if (isNaN(d)) return "";
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    },
  };
  window.H = H;

  // --- toast ---
  let toastTimer = null;
  window.toast = function (msg, bad) {
    let t = document.getElementById("toast");
    if (!t) { t = H.el("div", { id: "toast" }); document.body.appendChild(t); }
    t.textContent = msg;
    t.className = "show" + (bad ? " bad" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = bad ? "bad" : ""; }, 3200);
  };
})();
