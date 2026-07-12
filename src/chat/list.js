/* ============================================================
 * SPURANA · chat/list.js  (STEP 4)
 * The signed-in home: your bonded souls. Tapping one opens the
 * thread (sets the active conv_id, deterministic from the 2 uids).
 * Refreshes on mount and when the tab regains focus so a freshly
 * redeemed bond appears on the inviter's side too.
 * ============================================================ */
(function () {
  "use strict";

  Router.register("chat", function (root) {
    root.appendChild(topBar({
      title: CFG.APP_NAME,
      back: true, home: "sanctuary",
      action: { icon: "⋯", title: "Account", onClick: openMenu },
    }));

    const list = H.el("div", { class: "grow scroll" });
    root.appendChild(list);

    // (invite bar intentionally hidden — the bond is private; join via code only)
    const actions = H.el("div", { style: "display:none" });
    root.appendChild(actions);

    async function load() {
      H.clear(list);
      list.appendChild(H.el("div", { class: "pad faint center" }, "Gathering your bonds…"));
      const { data: contacts, error } = await SP.contacts.list();
      if (error) { H.clear(list); list.appendChild(errCard(error.message)); return; }
      APP.contacts = contacts || [];

      if (!APP.contacts.length) { actions.classList.add("hidden"); H.clear(list); list.appendChild(emptyState()); return; }
      actions.classList.remove("hidden");

      // resolve partner uids -> conv ids
      const me = APP.me.id;
      const rows = APP.contacts.map((c) => {
        const puid = c.contact_uid || c.partner_uid || c.uid;
        return { puid, conv: SP.convIdFor(me, puid), name: c.contact_name || c.name || null };
      }).filter((r) => r.puid && r.puid !== me);

      // batch-enrich names + last-message previews (read-only convenience reads)
      const convIds = rows.map((r) => r.conv);
      const puids = rows.map((r) => r.puid);
      const [profs, convs] = await Promise.all([
        SP._sb.from("profiles").select("id,name,avatar_url").in("id", puids),
        SP._sb.from("conversations").select("conv_id,last_msg_preview,last_msg_ts").in("conv_id", convIds),
      ]);
      const nameById = {}; (profs.data || []).forEach((p) => { nameById[p.id] = p.name; });
      const convById = {}; (convs.data || []).forEach((c) => { convById[c.conv_id] = c; });
      rows.forEach((r) => {
        r.name = r.name || nameById[r.puid] || "Your soul";
        const cm = convById[r.conv];
        r.preview = (cm && cm.last_msg_preview) || "Say the first word…";
        r.ts = (cm && cm.last_msg_ts) || 0;
      });
      rows.sort((a, b) => (b.ts || 0) - (a.ts || 0));

      H.clear(list);
      rows.forEach((r) => list.appendChild(convItem(r)));
    }

    function convItem(r) {
      return H.el("button", { class: "conv-item", onClick: () => {
        APP.activeConv = r.conv;
        APP.partner = { uid: r.puid, name: r.name };
        Router.go("thread", { c: r.conv });
      } }, [
        (function(){ var a=H.el("div",{class:"avatar avatar-sigil"}); if(window.Souls) a.innerHTML=Souls.sign(Souls.signFor(r.puid),34); else a.textContent=H.initials(r.name); return a; })(),
        H.el("div", { class: "meta" }, [
          H.el("div", { class: "nm" }, r.name),
          H.el("div", { class: "pv" }, r.preview),
        ]),
      ]);
    }

    function emptyState() {
      var myName = (APP.profile && APP.profile.name) || (APP.me && APP.me.name) || "You";
      var mySign = (window.Souls && APP.me) ? Souls.signFor(APP.me.id) : "taurus";
      var glyph = H.el("div", { class: "soul-await-sigil" });
      if (window.Souls) glyph.innerHTML = Souls.sign(mySign, 92);
      return H.el("div", { class: "soul-await reveal" }, [
        H.el("div", { class: "soul-await-halo" }, [glyph]),
        H.el("div", { class: "soul-await-name" }, myName),
        H.el("div", { class: "soul-await-sign" }, (mySign.charAt(0).toUpperCase() + mySign.slice(1)) + " \u00b7 a soul in waiting"),
        H.el("div", { class: "soul-await-sub" }, "When your beloved joins, they will appear here."),
      ]);
    }

    function errCard(m) { return H.el("div", { class: "pad" }, H.el("div", { class: "card center", style: "color:var(--bad)" }, m || "Could not load.")); }

    function openMenu() {
      const who = ((APP.profile && APP.profile.name) || (APP.me && APP.me.name) || "You") + " · " + ((APP.me && APP.me.email) || "");
      const back = H.el("div", { style: "position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9990" });
      const sheet = H.el("div", {
        class: "pad stack",
        style: "position:fixed;left:50%;transform:translateX(-50%);bottom:calc(20px + var(--sab));width:88%;max-width:480px;z-index:9991;" +
               "background:#140f1c;border:1px solid var(--border);border-radius:var(--r-lg);box-shadow:var(--shadow)",
      }, [
        H.el("div", { class: "muted center", style: "font-size:13px;font-family:var(--f-tech);letter-spacing:.05em;word-break:break-all" }, who),
        H.el("button", { class: "btn btn-ghost btn-block", onClick: () => { close(); Router.go("invite"); } }, "Invite a soul"),
        H.el("button", { class: "btn btn-ghost btn-block", onClick: () => { close(); Router.go("sanctuary"); } }, "The Sanctuary"),
        H.el("button", { class: "btn btn-ghost btn-block", onClick: () => { close(); Router.go("settings"); } }, "Settings"),
        H.el("button", { class: "btn btn-ghost btn-block", onClick: () => { close(); Router.go("innerjourney"); } }, "Inner Journey \uD83E\uDEB7"),
        H.el("button", { class: "btn btn-danger btn-block", onClick: async () => { close(); await Session.logout(); } }, "Sign out"),
        H.el("button", { class: "btn btn-ghost btn-block", onClick: () => close() }, "Close"),
      ]);
      function close() { sheet.remove(); back.remove(); }
      back.addEventListener("click", close);
      document.body.append(back, sheet);
    }

    function onFocus() { if (Router.current === "chat") load(); }
    window.addEventListener("focus", onFocus);

    load();
    return { teardown() { window.removeEventListener("focus", onFocus); } };
  });
})();
