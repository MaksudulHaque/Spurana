/* ============================================================
 * SPURANA · connect/wing.js — the SOULS WING.
 * A premium action layer that lives inside the chat: a floating
 * orb that blooms open into live ways to reach your soul —
 * Antordrishti (live sight), Akashvani (voice from the sky),
 * Push-to-Talk. Plus the TRUSTED SOUL pact: your partner can
 * pre-grant you instant live-connect, so reaching out opens the
 * stage on their side at once — always with the green dot,
 * always revocable. Consent granted once, never invisible.
 *
 * There is no silent camera/mic access here and never will be —
 * Android forbids it and so does Spurana's soul. This is instant
 * reach WITH knowing, which is what love actually wants.
 * ============================================================ */
(function () {
  "use strict";

  var myId = null, partnerUid = null, partnerName = "them", conv = null;
  var inviteCh = null, incoming = null;

  function vibe(seq) { try { if (window.Native && Native.pattern) Native.pattern(seq); else if (navigator.vibrate) navigator.vibrate(seq); } catch (e) {} }

  async function resolve() {
    try {
      myId = APP.me.id;
      var r = await SP.contacts.list();
      var c = (r && r.data && r.data[0]) || null;
      if (!c) return false;
      partnerUid = c.contact_uid;
      partnerName = c.contact_name || c.name || "them";
      conv = SP.convIdFor(myId, partnerUid);
      return true;
    } catch (e) { return false; }
  }

  /* ── Trusted Soul pact ── */
  async function iTrust() { // do I let THEM connect to me instantly?
    try { var r = await SP._sb.from("trust_grants").select("trusted_uid").eq("granter_uid", myId).eq("trusted_uid", partnerUid).maybeSingle(); return !!(r && r.data); }
    catch (e) { return false; }
  }
  async function theyTrust() { // may I connect to THEM instantly?
    try { var r = await SP._sb.from("trust_grants").select("granter_uid").eq("granter_uid", partnerUid).eq("trusted_uid", myId).maybeSingle(); return !!(r && r.data); }
    catch (e) { return false; }
  }
  async function setTrust(on) {
    try {
      if (on) await SP._sb.from("trust_grants").upsert({ granter_uid: myId, trusted_uid: partnerUid, updated_at: new Date().toISOString() }, { onConflict: "granter_uid,trusted_uid" });
      else await SP._sb.from("trust_grants").delete().eq("granter_uid", myId).eq("trusted_uid", partnerUid);
      vibe([40, 60, 90]);
      if (window.toast) toast(on ? "You've made " + partnerName + " a Trusted Soul \u2726" : "Trust withdrawn.");
      return true;
    } catch (e) { if (window.toast) toast("Couldn't save.", true); return false; }
  }

  /* ── the invite channel (visible knock; auto-open if pre-trusted) ── */
  function armInvites() {
    if (inviteCh || !conv || !SP._sb) return;
    inviteCh = SP._sb.channel("wing:" + conv, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "invite" }, function (m) {
        var p = m.payload; if (!p || p.from === myId) return;
        onInvite(p);
      })
      .on("broadcast", { event: "cancel" }, function (m) { if (m.payload && m.payload.from !== myId) dismissInvite(); })
      .subscribe();
  }
  function sendInvite(kind) {
    try { if (inviteCh) inviteCh.send({ type: "broadcast", event: "invite", payload: { from: myId, name: (APP.me && APP.me.name) || "", kind: kind } }); } catch (e) {}
  }

  async function onInvite(p) {
    var route = p.kind === "akash" ? "akash" : "antor";
    // pre-trusted → open at once (still shows the green dot natively)
    var trusted = await iTrust();
    if (trusted && route === "antor") {
      vibe([60, 60, 120]);
      if (window.toast) toast("\u2726 " + (p.name || partnerName) + " is opening the sight \u2014 you allowed this");
      Router.go("antor");
      return;
    }
    // else a beautiful visible knock
    showInvite(p, route);
  }

  function showInvite(p, route) {
    dismissInvite();
    incoming = H.el("div", { class: "wing-knock" });
    var card = H.el("div", { class: "wing-knock-card" });
    card.appendChild(H.el("div", { class: "wing-knock-orb" }, route === "akash" ? "\u26A1" : "\uD83D\uDC41\uFE0F"));
    card.appendChild(H.el("div", { class: "wing-knock-name" }, (p.name || partnerName)));
    card.appendChild(H.el("div", { class: "wing-knock-sub" }, route === "akash" ? "wants to speak into your world" : "wants to open the inner-sight with you"));
    var row = H.el("div", { class: "wing-knock-row" });
    var no = H.el("button", { class: "wing-knock-no" }, "Not now");
    var yes = H.el("button", { class: "wing-knock-yes" }, "Open \u2726");
    no.onclick = function () { dismissInvite(); };
    yes.onclick = function () { dismissInvite(); Router.go(route); };
    row.append(no, yes); card.appendChild(row);
    incoming.appendChild(card);
    document.body.appendChild(incoming);
    requestAnimationFrame(function () { incoming.classList.add("on"); });
    vibe([120, 90, 120]);
    setTimeout(function () { if (incoming) dismissInvite(); }, 30000);
  }
  function dismissInvite() { if (incoming) { try { incoming.remove(); } catch (e) {} incoming = null; } }

  /* ── the floating action orb (blooms open) ── */
  function buildOrb(root) {
    var wrap = H.el("div", { class: "wing-fab-wrap" });
    var fan = H.el("div", { class: "wing-fan" });

    function act(icon, label, cls, fn) {
      var b = H.el("button", { class: "wing-act " + cls, title: label });
      b.appendChild(H.el("span", { class: "wing-act-ic" }, icon));
      b.appendChild(H.el("span", { class: "wing-act-lb" }, label));
      b.onclick = function () { close(); fn(); };
      return b;
    }

    var aSight = act("\uD83D\uDC41\uFE0F", "Live Sight", "a-sight", async function () {
      if (!(await resolve())) return;
      sendInvite("antor");
      if (await theyTrust()) { if (window.toast) toast("Opening the sight \u2014 " + partnerName + " trusts you \u2726"); }
      else if (window.toast) toast("Knocking on " + partnerName + "'s world\u2026");
      Router.go("antor");
    });
    var aSky = act("\u26A1", "Akashvani", "a-sky", function () { sendInvite("akash"); Router.go("akash"); });
    var aVoice = act("\uD83C\uDF99", "Push-to-Talk", "a-voice", function () { if (window.toast) toast("Hold the \uD83C\uDF99 orb to speak"); });

    fan.append(aSight, aSky, aVoice);

    var fab = H.el("button", { class: "wing-fab" }, "\u2726");
    var open = false;
    function openFan() { open = true; wrap.classList.add("open"); vibe([30]); }
    function close() { open = false; wrap.classList.remove("open"); }
    fab.onclick = function () { open ? close() : openFan(); };

    wrap.append(fan, fab);
    root.appendChild(wrap);
    return { close: close };
  }

  // exposed for the thread screen + settings
  window.Wing = {
    mount: async function (root) {
      if (!(await resolve())) return null;
      armInvites();
      return buildOrb(root);
    },
    // Trusted Soul controls for Settings
    resolve: resolve,
    iTrust: iTrust, theyTrust: theyTrust, setTrust: setTrust,
    partnerName: function () { return partnerName; },
  };

  // arm invites globally too (so a knock reaches you outside the thread)
  try {
    var T = (typeof setInterval === "function") ? setInterval : (window.setInterval ? window.setInterval.bind(window) : null);
    var CI = (typeof clearInterval === "function") ? clearInterval : (window.clearInterval ? window.clearInterval.bind(window) : null);
    if (T) {
      var tries = 0;
      var iv = T(function () {
        tries++;
        if (window.APP && APP.me) { CI(iv); resolve().then(function (ok) { if (ok) armInvites(); }); }
        else if (tries > 60) CI(iv);
      }, 3000);
    }
  } catch (e) {}
})();
