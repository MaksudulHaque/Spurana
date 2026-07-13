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
    signup: { i: "\u25C8", t: "Awakened into Spurana" },
    login: { i: "\u263D", t: "Returned to the sanctuary" },
    pair_redeem: { i: "\uD83D\uDD17", t: "Bonded with a soul" },
    pair_create: { i: "\u2709", t: "Sent an invitation" },
    call: { i: "\u260E", t: "Shared a call" },
  };

  Router.register("settings", function (root) {
    root.appendChild(topBar({ title: "Settings", back: true }));
    const body = H.el("div", { class: "pad scroll grow stack reveal" });
    root.appendChild(body);

    function sec(title, hint) {
      var card = H.el("div", { class: "card stack set-card", style: "gap:12px" });
      card.appendChild(H.el("div", { class: "f-label" }, title));
      if (hint) card.appendChild(H.el("div", { class: "zc-desc", style: "margin-top:-4px" }, hint));
      body.appendChild(card);
      return card;
    }

    /* ═══ 1 · Identity ═══ */
    (function () {
      var c = sec("Identity");
      const name = H.el("input", { class: "input", value: (APP.profile && APP.profile.name) || "", placeholder: "Your name" });
      const save = H.el("button", { class: "btn btn-primary", onClick: async () => {
        const v = name.value.trim(); if (!v) { toast("Enter a name.", true); return; }
        const { error } = await SP.profile.update({ name: v });
        if (error) { toast("Couldn't save.", true); return; }
        APP.profile = APP.profile || {}; APP.profile.name = v; toast("Saved");
      } }, "Save");
      c.appendChild(H.el("div", { class: "row", style: "gap:8px" }, [name, save]));
    })();

    /* ═══ 2 · The Living World ═══ */
    (function () {
      if (!window.Env) return;
      var c = sec("The Living World", "Spurana breathes with the hour \u2014 or hold one world still.");
      var curLine = H.el("div", { class: "env-now" }, "");
      function nowLine() {
        var e = Env.current(); curLine.innerHTML = ""; if (!e) return;
        curLine.appendChild(H.el("span", { class: "env-now-bn bn" }, e.bn));
        curLine.appendChild(H.el("span", { class: "env-now-en" }, "  \u00b7  " + e.en + (Env.pinned() ? "  \u00b7 pinned" : "  \u00b7 living")));
      }
      var modeRow = H.el("div", { class: "row", style: "gap:8px" });
      var autoBtn = H.el("button", { class: "btn", style: "flex:1" }, "Auto \u2014 let it live");
      var showBtn = H.el("button", { class: "btn btn-ghost", style: "flex:1" }, "Choose a world \u25BE");
      var pickWrap = H.el("div", { class: "env-grid", style: "display:none" });
      var open = false;
      showBtn.onclick = function () { open = !open; pickWrap.style.display = open ? "grid" : "none"; showBtn.textContent = open ? "Hide worlds \u25B4" : "Choose a world \u25BE"; };
      function paintButtons() {
        var pinned = !!Env.pinned();
        autoBtn.className = "btn " + (pinned ? "btn-ghost" : "btn-primary");
        Array.prototype.forEach.call(pickWrap.children, function (sw) { sw.classList.toggle("on", sw.dataset.id === Env.pinned()); });
        nowLine();
      }
      autoBtn.onclick = function () { Env.pin(null); paintButtons(); toast("The world lives on its own"); };
      modeRow.appendChild(autoBtn); modeRow.appendChild(showBtn);
      Env.list().forEach(function (e) {
        var sw = H.el("button", { class: "env-sw", title: e.en });
        sw.dataset.id = e.id;
        var dot = H.el("span", { class: "env-dot" });
        dot.style.background = "linear-gradient(135deg," + e.qb + "," + e.goldb + ")";
        sw.appendChild(dot);
        sw.appendChild(H.el("span", { class: "env-sw-bn bn" }, e.bn));
        sw.appendChild(H.el("span", { class: "env-sw-en" }, e.en));
        sw.onclick = function () { Env.pin(e.id); paintButtons(); };
        pickWrap.appendChild(sw);
      });
      c.appendChild(curLine); c.appendChild(modeRow); c.appendChild(pickWrap);
      Env.onChange(nowLine);
      paintButtons();
    })();

    /* ═══ 3 · Language & Voice ═══ */
    (function () {
      var MV = window.MedVoice;
      var c = sec("Language & Voice");
      var row = H.el("div", { class: "row", style: "gap:8px" });
      ["en", "bn"].forEach(function (L) {
        var on = (window.LANG || "en") === L;
        row.appendChild(H.el("button", { class: "btn" + (on ? " btn-primary" : " btn-ghost"), style: "flex:1",
          onClick: function () { window.setLang(L); toast(L === "bn" ? "\u09ad\u09be\u09b7\u09be: \u09ac\u09be\u0982\u09b2\u09be" : "Language: English"); Router.go("settings"); } },
          L === "bn" ? "\u09ac\u09be\u0982\u09b2\u09be" : "English"));
      });
      c.appendChild(H.el("div", {}, [H.el("div", { class: "zc-desc", style: "margin-bottom:6px" }, "Guidance language"), row]));
      if (!MV) return;
      var grow = H.el("div", { class: "row", style: "gap:8px" });
      [["her", "Her"], ["him", "Him"]].forEach(function (g) {
        var on = MV.gender() === g[0];
        grow.appendChild(H.el("button", { class: "btn" + (on ? " btn-primary" : " btn-ghost"), style: "flex:1",
          onClick: function () { MV.setGender(g[0]); MV.speak(window.T("This is my voice.", "\u098f\u0987 \u0986\u09ae\u09be\u09b0 \u0995\u09a3\u09cd\u09a0\u09b8\u09cd\u09ac\u09b0\u0964")); Router.go("settings"); } }, g[1]));
      });
      c.appendChild(H.el("div", {}, [H.el("div", { class: "zc-desc", style: "margin-bottom:6px" }, "Narrator"), grow]));
      try {
        var list = MV.listVoices ? MV.listVoices() : [];
        if (list.length) {
          var sel = H.el("select", { class: "input" });
          sel.appendChild(H.el("option", { value: "" }, "Auto (best available)"));
          list.forEach(function (v) { var o = H.el("option", { value: v.uri }, v.name + " \u00b7 " + v.lang); if (v.uri === MV.currentVoiceURI()) o.setAttribute("selected", "selected"); sel.appendChild(o); });
          sel.addEventListener("change", function () { MV.setVoice(sel.value); MV.speak(window.T("This is my voice.", "\u098f\u0987 \u0986\u09ae\u09be\u09b0 \u0995\u09a3\u09cd\u09a0\u09b8\u09cd\u09ac\u09b0\u0964")); });
          c.appendChild(H.el("div", {}, [H.el("div", { class: "zc-desc", style: "margin-bottom:6px" }, "Voice (uses your phone's voices)"), sel]));
          if (window.LANG === "bn" && !MV.hasBangla()) c.appendChild(H.el("div", { class: "zc-desc", style: "color:var(--gold)" }, "No Bangla voice on this device \u2014 install one in phone settings for spoken Bangla."));
        }
      } catch (e) {}
    })();

    /* ═══ 4 · Sound & Touch ═══ */
    (function () {
      var MV = window.MedVoice; if (!MV) return;
      var c = sec("Sound & Touch");
      var hOn = MV.haptic();
      var hb = H.el("button", { class: "btn" + (hOn ? " btn-primary" : " btn-ghost"), style: "width:100%" }, hOn ? "Breath vibration: On" : "Breath vibration: Off");
      hb.onclick = function () { MV.setHaptic(!MV.haptic()); Router.go("settings"); };
      c.appendChild(H.el("div", {}, [H.el("div", { class: "zc-desc", style: "margin-bottom:6px" }, "Feel the breath as a pulse"), hb]));
      var tb = H.el("button", { class: "btn btn-ghost", style: "width:100%" }, "Test the pulse \u26A1");
      tb.onclick = function () {
        var Cap = window.Capacitor;
        var hp = !!(Cap && Cap.Plugins && Cap.Plugins.Haptics);
        var nv = !!navigator.vibrate;
        var isN = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
        var msg = (isN ? "native app" : "browser") + " \u00b7 haptics: " + (hp ? "yes" : "NO") + " \u00b7 web vibrate: " + (nv ? "yes" : "NO");
        try {
          if (hp) { Cap.Plugins.Haptics.vibrate({ duration: 400 }); msg = "FIRED native 400ms \u00b7 " + msg; }
          else if (nv) { navigator.vibrate([300, 120, 300]); msg = "FIRED web vibrate \u00b7 " + msg; }
          else msg = "NO vibration path \u00b7 " + msg;
        } catch (e) { msg = "threw: " + (e && e.message); }
        if (window.toast) toast(msg);
      };
      c.appendChild(tb);
    })();

    /* ═══ 5 · Security & Locks ═══ */
    (function () {
      var c = sec("Security & Locks");
      c.appendChild(H.el("div", { class: "zc-desc" }, "Sanctum Seal \u2014 fingerprint to open Spurana"));
      var bioBtn = H.el("button", { class: "btn btn-ghost", style: "width:100%" }, "\u2026");
      function bioLabel() {
        if (!window.BioLock) { bioBtn.textContent = "Native app only"; bioBtn.disabled = true; return; }
        BioLock.available().then(function (ok) {
          if (!ok) { bioBtn.textContent = "Biometrics unavailable"; bioBtn.disabled = true; return; }
          bioBtn.disabled = false;
          bioBtn.textContent = BioLock.enabled() ? "Seal is ON \uD83D\uDD12 \u2014 tap to remove" : "Set the seal \uD83D\uDD12";
        });
      }
      bioBtn.onclick = function () { if (!window.BioLock) return; BioLock.setEnabled(!BioLock.enabled()).then(bioLabel); };
      bioLabel(); c.appendChild(bioBtn);
      c.appendChild(H.el("div", { class: "zc-desc", style: "margin-top:8px" }, "Pattern or PIN"));
      var lockRow = H.el("div", { class: "row", style: "gap:8px" });
      var patBtn = H.el("button", { class: "btn btn-ghost", style: "flex:1" }, "Pattern");
      var pinBtn = H.el("button", { class: "btn btn-ghost", style: "flex:1" }, "PIN");
      var offBtn = H.el("button", { class: "btn btn-ghost", style: "flex:1" }, "Off");
      function lockLabel() {
        if (!window.CodeLock) { patBtn.disabled = pinBtn.disabled = true; return; }
        var m = CodeLock.mode();
        patBtn.className = "btn " + (m === "pattern" ? "btn-primary" : "btn-ghost");
        pinBtn.className = "btn " + (m === "pin" ? "btn-primary" : "btn-ghost");
        offBtn.className = "btn " + (m === "off" ? "btn-primary" : "btn-ghost");
      }
      patBtn.onclick = function () { if (window.CodeLock) CodeLock.setup("pattern", lockLabel); };
      pinBtn.onclick = function () { if (window.CodeLock) CodeLock.setup("pin", lockLabel); };
      offBtn.onclick = function () { if (window.CodeLock) CodeLock.clear(lockLabel); };
      lockRow.append(patBtn, pinBtn, offBtn);
      c.appendChild(lockRow); lockLabel();
      c.appendChild(H.el("div", { class: "zc-desc", style: "margin-top:8px" }, "Idle veil \u2014 the re-entry orb after stillness"));
      var idleRow = H.el("div", { class: "row", style: "gap:8px" });
      [["Off", 0], ["60s", 60], ["2m", 120], ["5m", 300]].forEach(function (opt) {
        var b = H.el("button", { class: "btn btn-ghost", style: "flex:1" }, opt[0]);
        b.onclick = function () {
          if (!window.Idle) return;
          if (opt[1] === 0) { Idle.set(false); try { localStorage.setItem("spurana.idle", "0"); } catch (e) {} }
          else { Idle.set(true); Idle.setDelay(opt[1]); try { localStorage.setItem("spurana.idle", "1"); localStorage.setItem("spurana.idle.sec", String(opt[1])); } catch (e) {} }
          Array.prototype.forEach.call(idleRow.children, function (x) { x.className = "btn btn-ghost"; }); b.className = "btn btn-primary";
        };
        idleRow.appendChild(b);
      });
      c.appendChild(idleRow);
    })();

    /* ═══ 6 · Presence & Bond ═══ */
    (function () {
      var c = sec("Presence & Bond");
      c.appendChild(H.el("div", { class: "zc-desc" }, "Soul Bubble \u2014 a floating orb over every app; tap it to open your chat"));
      var bubBtn = H.el("button", { class: "btn btn-ghost", style: "width:100%" }, "\u2026");
      function bubLabel() {
        if (!window.SoulBubbleJS || !SoulBubbleJS.available()) { bubBtn.textContent = "Native app only"; bubBtn.disabled = true; return; }
        bubBtn.disabled = false;
        bubBtn.textContent = SoulBubbleJS.enabled() ? "Bubble is floating \u2014 tap to rest it" : "Release the bubble";
      }
      bubBtn.onclick = function () { if (!window.SoulBubbleJS) return; SoulBubbleJS.setEnabled(!SoulBubbleJS.enabled()).then(bubLabel); };
      bubLabel(); c.appendChild(bubBtn);
      if (window.Wing) {
        var line = H.el("p", { class: "muted", style: "font-family:var(--f-soul);font-style:italic;margin:8px 0 0;font-size:13px" }, "Loading\u2026");
        var btn = H.el("button", { class: "btn btn-ghost", style: "width:100%" }, "\u2026");
        c.appendChild(line); c.appendChild(btn);
        (async function () {
          var ok = await Wing.resolve(); if (!ok) { line.textContent = "Bond with a soul to grant trust."; btn.style.display = "none"; return; }
          var nm = Wing.partnerName();
          async function refresh() {
            var mine = await Wing.iTrust(), theirs = await Wing.theyTrust();
            line.textContent =
              (mine ? ("You let " + nm + " open live-sight with you instantly. ") : (nm + " must accept when you reach for live-sight. ")) +
              (theirs ? (nm + " trusts you \u2014 your live-sight opens on their side at once.") : (nm + " hasn't granted you instant trust yet."));
            btn.className = "btn " + (mine ? "btn-ghost" : "btn-primary");
            btn.textContent = mine ? ("Withdraw trust from " + nm) : ("Make " + nm + " a Trusted Soul");
          }
          btn.onclick = async function () { var mine = await Wing.iTrust(); await Wing.setTrust(!mine); refresh(); };
          refresh();
        })();
      }
    })();

    /* ═══ 7 · More ═══ */
    (function () {
      var c = sec("More");
      function link(icon, title, go) {
        return H.el("button", { class: "zone-card", onClick: () => Router.go(go) }, [
          H.el("div", { class: "zc-icon" }, icon),
          H.el("div", { class: "zc-body" }, [H.el("div", { class: "zc-title" }, title)]),
        ]);
      }
      c.append(
        link("\uD83C\uDF0C", "World & Atmosphere", "world"),
        link("\u26A1", "Performance", "perf"),
        link("\uD83D\uDDFA", "Your Journey", "journey"),
        link("\uD83D\uDD12", "Security", "security"),
        link("\uD83D\uDEE1", "Privacy & Data", "privacy"),
      );
      if (!(window.isStandalone && window.isStandalone())) {
        c.appendChild(H.el("button", { class: "zone-card", onClick: () => window.installApp && window.installApp() }, [
          H.el("div", { class: "zc-icon" }, "\u2B07"),
          H.el("div", { class: "zc-body" }, [
            H.el("div", { class: "zc-title" }, "Install Spurana"),
            H.el("div", { class: "zc-desc" }, "Add to your home screen \u2014 opens like a real app."),
          ]),
        ]));
      }
    })();

    body.appendChild(H.el("button", { class: "btn btn-danger btn-block", style: "margin-top:8px", onClick: () => Session.logout() }, "Sign out"));
    body.appendChild(H.el("div", { class: "nwp-credit" }, [H.el("span", { class: "bn nwp-bn" }, "\u09b8\u09cd\u09ab\u09c1\u09b0\u09a3"), H.el("span", null, " \u00b7 Sacred Architecture \u00b7 2026")]));
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
