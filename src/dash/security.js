/* ============================================================
 * SPURANA · dash/security.js  (STEP 10)
 * Session overview + sign out / sign out everywhere.
 * ============================================================ */
(function () {
  "use strict";
  Router.register("security", function (root) {
    root.appendChild(topBar({ title: "Security", back: true }));
    const body = H.el("div", { class: "pad scroll grow stack reveal" });
    root.appendChild(body);

    const email = (APP.me && APP.me.email) || "\u2014";
    const sid = (APP.me && APP.me.id) ? (APP.me.id.slice(0, 8) + "\u2026") : "\u2014";
    body.appendChild(H.el("div", { class: "card stack" }, [
      H.el("div", null, [H.el("div", { class: "f-label" }, "Signed in as"), H.el("div", null, email)]),
      H.el("div", null, [H.el("div", { class: "f-label" }, "Soul ID"), H.el("div", { style: "font-family:var(--f-tech);font-size:13px;color:var(--text-dim)" }, sid)]),
      H.el("div", { class: "row", style: "gap:8px" }, [H.el("span", { class: "dot", style: "width:8px;height:8px;border-radius:50%;background:var(--online);display:inline-block;box-shadow:0 0 8px var(--online)" }), H.el("span", { class: "muted", style: "font-size:13px" }, "This session is active")]),
    ]));

    body.appendChild(H.el("p", { class: "muted", style: "font-size:13.5px" },
      "Sign out ends this device only. If you've signed in somewhere you don't recognise, sign out everywhere to revoke all sessions."));

    body.appendChild(H.el("button", { class: "btn btn-ghost btn-block", onClick: () => Session.logout() }, "Sign out (this device)"));
    body.appendChild(H.el("button", { class: "btn btn-danger btn-block", onClick: async () => {
      try { await SP.auth.signOutEverywhere(); } catch (e) {}
      APP.session = null; APP.me = null; APP.profile = null;
      toast("Signed out of all devices.");
      Router.go("login");
    } }, "Sign out everywhere"));
    return {};
  });
})();
