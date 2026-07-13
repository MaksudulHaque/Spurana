/* ============================================================
 * SPURANA · connect/buzz.js — JHANKAR (\u099d\u0999\u09cd\u0995\u09be\u09b0), the Buzz.
 * The Yahoo Messenger buzz, reborn for two souls. Send it and
 * their whole screen SHAKES, the light STROBES like madness, a
 * spooky cry sounds, and the phone convulses. Pure mischief,
 * delivered to a pocket anywhere. Rides the realtime channel
 * (instant if their app is open) + push (a jolt to the lock
 * screen if it's closed).
 * ============================================================ */
(function () {
  "use strict";

  var conv = null, myId = null, partnerName = "them", ch = null, lastRecv = 0;
  var audioCtx = null;

  function vibe(seq) { try { if (window.Native && Native.pattern) Native.pattern(seq); else if (navigator.vibrate) navigator.vibrate(seq); } catch (e) {} }

  async function resolve() {
    try {
      myId = APP.me.id;
      var r = await SP.contacts.list();
      var c = (r && r.data && r.data[0]) || null;
      if (!c) return false;
      partnerName = c.contact_name || c.name || "them";
      conv = SP.convIdFor(myId, c.contact_uid);
      return true;
    } catch (e) { return false; }
  }

  /* ── the spooky sound: a detuned wail + noise burst (no asset needed) ── */
  function spookySound() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      audioCtx = audioCtx || new AC();
      var ctx = audioCtx, now = ctx.currentTime;
      // descending detuned wail
      [0, 0.04].forEach(function (det, i) {
        var o = ctx.createOscillator(), gg = ctx.createGain();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(420 + i * 8, now);
        o.frequency.exponentialRampToValueAtTime(70, now + 1.1);
        gg.gain.setValueAtTime(0.0001, now);
        gg.gain.exponentialRampToValueAtTime(0.22, now + 0.05);
        gg.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        o.connect(gg).connect(ctx.destination);
        o.start(now); o.stop(now + 1.25);
      });
      // rattling noise burst
      var buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var s = 0; s < d.length; s++) d[s] = (Math.random() * 2 - 1) * (1 - s / d.length);
      var src = ctx.createBufferSource(), ng = ctx.createGain();
      src.buffer = buf; ng.gain.setValueAtTime(0.12, now); ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      src.connect(ng).connect(ctx.destination); src.start(now);
    } catch (e) {}
  }

  /* ── the madness: shake the app + strobe the light ── */
  function unleash() {
    if (Date.now() - lastRecv < 800) return; // debounce a rapid double-hit
    lastRecv = Date.now();
    var app = document.getElementById("app") || document.body;

    // strobe overlay
    var strobe = document.createElement("div");
    strobe.className = "buzz-strobe";
    document.body.appendChild(strobe);

    // shake
    app.classList.add("buzz-shake");

    // sound + brutal vibration
    spookySound();
    vibe([0, 90, 40, 90, 40, 140, 60, 200, 40, 90, 40, 220]);

    // banner
    var b = document.createElement("div");
    b.className = "buzz-banner";
    b.textContent = "\u26A1 " + partnerName + " BUZZED you!";
    document.body.appendChild(b);

    setTimeout(function () {
      app.classList.remove("buzz-shake");
      try { strobe.remove(); } catch (e) {}
    }, 1400);
    setTimeout(function () { try { b.remove(); } catch (e) {} }, 2200);
  }

  function armReceiver() {
    if (ch || !conv || !SP._sb) return;
    ch = SP._sb.channel("buzz:" + conv, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "buzz" }, function (m) { if (m.payload && m.payload.from !== myId) unleash(); })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: "conv_id=eq." + conv },
        function (pl) { var n = pl && pl.new; if (n && n.type === "buzz" && n.uid !== myId) unleash(); })
      .subscribe();
  }

  async function send() {
    if (!conv) { var ok = await resolve(); if (!ok) { if (window.toast) toast("Bond with a soul first"); return; } armReceiver(); }
    // instant path (their app open)
    try { if (ch) ch.send({ type: "broadcast", event: "buzz", payload: { from: myId, name: (APP.me && APP.me.name) || "" } }); } catch (e) {}
    // durable path (their app closed) — a buzz message fires the push trigger
    try { SP.chat.send(conv, { type: "buzz", text: "\u26A1 BUZZ!" }); } catch (e) {}
    // feel it on your own side too — you threw the jolt
    vibe([0, 60, 40, 120]);
    if (window.toast) toast("\u26A1 You buzzed " + partnerName + "!");
  }

  window.Buzz = { send: send };

  // the Connect screen
  Router.register("buzz", function (root) {
    root.appendChild(topBar({ title: "Jhankar", back: true }));
    var body = H.el("div", { class: "pad scroll grow reveal", style: "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;min-height:62vh;text-align:center" });
    root.appendChild(body);

    body.appendChild(H.el("div", { class: "buzz-title" }, "\u099d\u0999\u09cd\u0995\u09be\u09b0"));
    body.appendChild(H.el("p", { class: "muted", style: "font-family:var(--f-soul);font-style:italic;max-width:300px;margin:0" },
      "Send a jolt through the void. Their whole world shakes, blinks, and cries out \u2014 they'll know you're thinking of them."));

    var btn = H.el("button", { class: "buzz-btn" }, "\u26A1");
    btn.onclick = function () { btn.classList.add("thrown"); setTimeout(function () { btn.classList.remove("thrown"); }, 400); send(); };
    body.appendChild(btn);
    body.appendChild(H.el("div", { class: "muted", style: "font-family:var(--f-ui);font-size:11px;letter-spacing:.18em;text-transform:uppercase" }, "press to buzz " + partnerName));

    if (!conv) resolve().then(function (ok) { if (ok) armReceiver(); });
    return { teardown: function () {} };
  });

  // arm the receiver globally so a buzz lands anywhere in the app
  try {
    var T = (typeof setInterval === "function") ? setInterval : (window.setInterval ? window.setInterval.bind(window) : null);
    var CI = (typeof clearInterval === "function") ? clearInterval : (window.clearInterval ? window.clearInterval.bind(window) : null);
    if (T) {
      var tries = 0;
      var iv = T(function () {
        tries++;
        if (window.APP && APP.me) { CI(iv); resolve().then(function (ok) { if (ok) armReceiver(); }); }
        else if (tries > 60) CI(iv);
      }, 2500);
    }
  } catch (e) {}
})();
