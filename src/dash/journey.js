/* ============================================================
 * SPURANA · dash/journey.js  (STEP 10)
 * The Settings hub (name editor + links) and "Your Journey" —
 * a timeline of your activity_log via SP.activity.recent.
 * ============================================================ */
(function () {
  "use strict";

  function rel(iso) {
    const t = iso ? new Date(iso).getTime() : 0; if (!t) return "";
    const m = (Date.now() - t) / 60000;
    if (m < 1) return "just now"; if (m < 60) return Math.floor(m) + "m ago";
    const h = m / 60; if (h < 24) return Math.floor(h) + "h ago";
    const d = h / 24; if (d < 30) return Math.floor(d) + "d ago";
    return new Date(t).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  }
  const KINDS = {
    signup: { i: "\u2726", t: "Awakened into Spurana" },
    login: { i: "\u263D", t: "Returned to the sanctuary" },
    pair_redeem: { i: "\uD83D\uDD17", t: "Bonded with a soul" },
    pair_create: { i: "\u2709", t: "Sent an invitation" },
    call: { i: "\u260E", t: "Shared a call" },
  };

  Router.register("settings", function (root) {
    root.appendChild(topBar({ title: "Settings", back: true }));
    const body = H.el("div", { class: "pad scroll grow stack reveal" });
    root.appendChild(body);

    // name editor (fixes empty display names)
    const name = H.el("input", { class: "input", value: (APP.profile && APP.profile.name) || "", placeholder: "Your name" });
    const save = H.el("button", { class: "btn btn-primary", onClick: async () => {
      const v = name.value.trim(); if (!v) { toast("Enter a name.", true); return; }
      const { error } = await SP.profile.update({ name: v });
      if (error) { toast("Couldn't save.", true); return; }
      APP.profile = APP.profile || {}; APP.profile.name = v; toast("Saved \u2726");
    } }, "Save");
    body.appendChild(H.el("div", { class: "card" }, [
      H.el("div", { class: "f-label" }, "Your name"),
      H.el("div", { class: "row", style: "gap:8px" }, [name, save]),
    ]));

    function link(icon, title, go) {
      return H.el("button", { class: "zone-card", onClick: () => Router.go(go) }, [
        H.el("div", { class: "zc-icon" }, icon),
        H.el("div", { class: "zc-body" }, [H.el("div", { class: "zc-title" }, title)]),
      ]);
    }
    body.append(
      link("\uD83C\uDF0C", "World & Atmosphere", "world"),
      link("\u26A1", "Performance", "perf"),
      link("\uD83D\uDDFA", "Your Journey", "journey"),
      link("\uD83D\uDD12", "Security", "security"),
      link("\uD83D\uDEE1", "Privacy & Data", "privacy"),
    );
    if (!(window.isStandalone && window.isStandalone())) {
      body.appendChild(H.el("button", { class: "zone-card", onClick: () => window.installApp && window.installApp() }, [
        H.el("div", { class: "zc-icon" }, "\u2B07"),
        H.el("div", { class: "zc-body" }, [
          H.el("div", { class: "zc-title" }, "Install Spurana"),
          H.el("div", { class: "zc-desc" }, "Add it to your home screen \u2014 opens like a real app, works offline."),
        ]),
      ]));
    }
    body.appendChild(H.el("button", { class: "btn btn-danger btn-block", style: "margin-top:8px", onClick: () => Session.logout() }, "Sign out"));
    body.appendChild(H.el("div", { class: "nwp-credit" }, "NWP \u00b7 Sacred Architecture \u00b7 v6 \u00b7 2026"));
    return {};
  });

  Router.register("journey", function (root) {
    root.appendChild(topBar({ title: "Your Journey", back: true }));
    const body = H.el("div", { class: "pad scroll grow reveal" });
    root.appendChild(body);
    body.appendChild(H.el("div", { class: "faint center", style: "padding:14px" }, "Gathering your steps\u2026"));

    (async () => {
      const { data, error } = await SP.activity.recent(60);
      H.clear(body);
      if (error || !data || !data.length) {
        body.appendChild(H.el("div", { class: "empty" }, [
          H.el("div", { class: "big" }, "\uD83D\uDDFA"),
          H.el("p", { class: "muted", style: "font-family:var(--f-soul);font-style:italic" }, "Your journey is just beginning."),
        ]));
        return;
      }
      const tl = H.el("div", { class: "timeline" });
      data.forEach((e) => {
        const k = KINDS[e.kind] || { i: "\u2022", t: e.kind || "A moment" };
        tl.appendChild(H.el("div", { class: "tl-item" }, [
          H.el("div", { class: "tl-dot" }, k.i),
          H.el("div", { class: "tl-body" }, [
            H.el("div", { class: "tl-title" }, k.t),
            H.el("div", { class: "tl-time" }, rel(e.created_at)),
          ]),
        ]));
      });
      body.appendChild(tl);
    })();
    return {};
  });
})();
