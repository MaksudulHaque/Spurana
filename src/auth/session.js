/* ============================================================
 * SPURANA · auth/session.js
 * Session helpers + the V1 "Awakening" screen, matched to the
 * original source (sigil, orbits, soul-card, Awaken/Begin tabs,
 * exact labels). The Begin form keeps V1's Invite Code field —
 * wired to bond at sign-up — plus the packet-required consent gate.
 * ============================================================ */
(function () {
  "use strict";

  const Session = {
    async refreshProfile() { const { data } = await SP.profile.get(); if (data) APP.profile = data; return APP.profile; },
    async logout() {
      try { await SP.presence.setOnline(false); } catch (e) {}
      await SP.auth.signOut();
      APP.session = null; APP.me = null; APP.profile = null; APP.activeConv = null; APP.partner = null; APP.contacts = [];
      Router.go("login");
    },
  };
  window.Session = Session;

  window.topBar = function (opts) {
    const o = opts || {};
    const left = o.back
      ? H.el("button", { class: "icon-btn", title: "Back", onClick: () => { if (o.home) Router.go(o.home); else if (window.history && history.length > 1) history.back(); else Router.go("self"); } }, "\u2039")
      : H.el("div", { class: "icon-btn", title: APP.profile && APP.profile.name }, H.initials(APP.profile && APP.profile.name));
    const kids = [left, H.el("div", { class: "title" }, o.title || CFG.APP_NAME)];
    if (o.action) kids.push(H.el("button", { class: "icon-btn", title: o.action.title || "", onClick: o.action.onClick }, o.action.icon));
    return H.el("div", { class: "bar" }, kids);
  };

  function fgroup(label, input) { return H.el("div", { class: "f-group" }, [H.el("label", { class: "f-label" }, label), input]); }

  // Shared awakening view. mode: "in" (Awaken) | "reg" (Begin).
  window.renderAuth = function (root, mode) {
    const isReg = mode === "reg";
    const err = H.el("div", { class: "err-box" });
    const showErr = (m) => { err.textContent = m; err.className = "err-box on"; };

    const tabIn = H.el("button", { class: "soul-tab" + (isReg ? "" : " on"), onClick: () => Router.go("login") }, "Awaken");
    const tabReg = H.el("button", { class: "soul-tab" + (isReg ? " on" : ""), onClick: () => Router.go("signup") }, "Begin");

    const name = H.el("input", { class: "f-inp", type: "text", placeholder: "Name you go by in this realm" });
    const email = H.el("input", { class: "f-inp", type: "email", placeholder: "your@soul.com", autocomplete: "email" });
    const code = H.el("input", { class: "f-inp", type: "text", placeholder: "Sacred passage code", autocomplete: "off" });
    const pass = H.el("input", { class: "f-inp", type: "password", placeholder: isReg ? "Min 6 characters" : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", autocomplete: isReg ? "new-password" : "current-password" });
    const consent = H.el("input", { type: "checkbox" });
    const btn = H.el("button", { class: "sacred-btn" }, isReg ? "Begin the Journey \u2726" : "Enter the Sanctum \u2726");
    if (isReg) btn.setAttribute("disabled", "true");
    consent.addEventListener("change", () => { if (consent.checked) btn.removeAttribute("disabled"); else btn.setAttribute("disabled", "true"); });
    function reset() { btn.removeAttribute("disabled"); btn.textContent = isReg ? "Begin the Journey \u2726" : "Enter the Sanctum \u2726"; if (isReg && !consent.checked) btn.setAttribute("disabled", "true"); }

    async function submit() {
      err.className = "err-box";
      const em = email.value.trim(), pw = pass.value;
      if (!em || !pw) { showErr("Email and a Sacred Key are required."); return; }
      btn.setAttribute("disabled", "true"); btn.textContent = isReg ? "Beginning\u2026" : "Entering\u2026";
      if (isReg) {
        const nm = name.value.trim();
        if (!nm) { showErr("What name shall you carry in this realm?"); reset(); return; }
        if (pw.length < 6) { showErr("Your Sacred Key must be at least 6 characters."); reset(); return; }
        if (!consent.checked) { showErr("Please accept the Privacy & Consent Notice."); reset(); return; }
        const { error } = await SP.auth.signUp({ email: em, password: pw, name: nm, consent: true });
        if (error) { showErr(error.message || "Could not begin."); reset(); return; }
        const { data: sess } = await SP.auth.getSession();
        if (sess) { const c = code.value.trim(); if (c) APP.pendingInvite = c; return window.afterAuth(); }
        toast("Check your email to confirm, then awaken."); Router.go("login");
      } else {
        const { error } = await SP.auth.signIn({ email: em, password: pw });
        if (error) { showErr(error.message || "Could not awaken."); reset(); return; }
        return window.afterAuth();
      }
    }
    btn.addEventListener("click", submit);
    pass.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });

    const form = [];
    if (isReg) {
      form.push(fgroup("Sacred Name", name), fgroup("Email", email), fgroup("Invite Code", code), fgroup("Sacred Key", pass), consentRow(consent), btn, err,
        H.el("div", { class: "invite-hint" }, ["Have account? ", H.el("em", { onClick: () => Router.go("login") }, "Awaken here")]));
    } else {
      form.push(fgroup("Email", email), fgroup("Sacred Key", pass), btn, err,
        H.el("div", { class: "invite-hint" }, ["No account? ", H.el("em", { onClick: () => Router.go("signup") }, "Begin your journey")]));
    }

    const wrap = H.el("div", { class: "awakening-wrap" }, [
      window.sigil(),
      H.el("div", { class: "brand-name" }, CFG.APP_NAME),
      H.el("div", { class: "brand-soul" }, CFG.TAGLINE),
      H.el("div", { class: "soul-card" }, [H.el("div", { class: "soul-tabs" }, [tabIn, tabReg]), H.el("div", null, form)]),
      H.el("div", { class: "nwp-credit" }, [H.el("span", { class: "bn nwp-bn" }, "\u09b8\u09cd\u09ab\u09c1\u09b0\u09a3"), H.el("span", null, " \u00b7 Sacred Architecture \u00b7 2026")]),
      H.el("div", { class: "invite-hint", style: "margin-top:6px" }, [H.el("em", { onClick: function () { Router.go("privacy"); } }, "Privacy & Consent")]),
    ]);
    root.appendChild(H.el("div", { class: "awaken-screen" }, wrap));
    // keep the login alive with her real local weather (rain/snow), nothing else changed
    try { if (window.Weather && Weather.once) Weather.once(); } catch (e) {}
    return { teardown: function () { try { if (window.Weather && Weather.clearPreview) Weather.clearPreview(); } catch (e) {} } };
  };

  // Privacy & Consent — reachable from the login footer
  Router.register("privacy", function (root) {
    root.appendChild(topBar({ title: "Privacy & Consent", back: true, home: "login" }));
    var body = H.el("div", { class: "pad scroll grow reveal" });
    function para(t) { return H.el("p", { style: "margin:0 0 14px;line-height:1.65;color:var(--text-dim);font-size:14px" }, t); }
    function head(t) { return H.el("div", { class: "s-section", style: "padding-left:0;color:var(--gold)" }, t); }
    body.append(
      H.el("div", { style: "font-family:var(--f-soul);font-size:23px;color:var(--text);margin-bottom:8px" }, "Your privacy, simply."),
      para(CFG.CONSENT_SHORT),
      head("What we store"),
      para("Your email, the name and avatar you choose, and the messages, voice notes, and activities you share with your bonded partner. Nothing more."),
      head("Who can see it"),
      para("Only you and the one soul you bond with. Your conversation is protected at the database level, so no other user can read it. We never sell your data and never show ads."),
      head("Your control"),
      para("You can export or permanently delete everything at any time from Settings \u2192 The Keeper. Deleting your account removes your profile, messages, and shared data for good."),
      head("Beta"),
      para("Spurana is an early beta. Things may change, break, or be reset \u2014 please don\u2019t keep anything here you can\u2019t afford to lose yet.")
    );
    root.appendChild(body);
    return {};
  });

  function consentRow(box) {
    return H.el("label", { class: "soul-consent" }, [box, H.el("span", null, [
      H.el("b", null, CFG.CONSENT_AGREE), document.createElement("br"), CFG.CONSENT_SHORT,
    ])]);
  }
})();
