/* ============================================================
 * SPURANA · core/codelock.js — Pattern & PIN sanctum locks.
 * Two more ways to seal the space, beside the fingerprint:
 *  · a 3\u00d73 pattern (draw your sigil), or
 *  · a numeric PIN.
 * The secret is hashed and kept only on this device. On open and
 * on return from background, the chosen lock veils everything
 * until it's drawn/entered. Native + web.
 * ============================================================ */
(function () {
  "use strict";

  var MODE = "spurana.lock.mode";   // 'off' | 'pattern' | 'pin'
  var HASH = "spurana.lock.hash";
  var veil = null, active = false, lastOK = 0;

  function mode() { try { return localStorage.getItem(MODE) || "off"; } catch (e) { return "off"; } }
  function vibe(seq) { try { if (window.Native && Native.pattern) Native.pattern(seq); else if (navigator.vibrate) navigator.vibrate(seq); } catch (e) {} }

  // tiny non-crypto hash — fine for a local device gate
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return "h" + h.toString(16); }
  function saved() { try { return localStorage.getItem(HASH) || ""; } catch (e) { return ""; } }

  /* ── pattern grid ── */
  function patternPad(onDone) {
    var wrap = H.el("div", { class: "lock-pad" });
    var svgNS = "http://www.w3.org/2000/svg";
    var box = H.el("div", { class: "pat-box" });
    var dots = [], seq = [], drawing = false;
    for (var i = 0; i < 9; i++) {
      (function (idx) {
        var d = H.el("div", { class: "pat-dot" }); d.dataset.i = idx; box.appendChild(d); dots.push(d);
      })(i);
    }
    var line = document.createElementNS(svgNS, "svg"); line.setAttribute("class", "pat-line");
    box.appendChild(line);

    function center(idx) { var d = dots[idx].getBoundingClientRect(), b = box.getBoundingClientRect(); return { x: d.left - b.left + d.width / 2, y: d.top - b.top + d.height / 2 }; }
    function redraw(px, py) {
      line.innerHTML = "";
      for (var k = 0; k < seq.length - 1; k++) { var a = center(seq[k]), c = center(seq[k + 1]); mkline(a.x, a.y, c.x, c.y); }
      if (drawing && seq.length && px != null) { var l = center(seq[seq.length - 1]); mkline(l.x, l.y, px, py); }
    }
    function mkline(x1, y1, x2, y2) { var ln = document.createElementNS(svgNS, "line"); ln.setAttribute("x1", x1); ln.setAttribute("y1", y1); ln.setAttribute("x2", x2); ln.setAttribute("y2", y2); ln.setAttribute("stroke", "url(#pg)"); ln.setAttribute("stroke-width", "4"); ln.setAttribute("stroke-linecap", "round"); line.appendChild(ln); }
    line.innerHTML = '<defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="var(--gold-bright)"/><stop offset="1" stop-color="var(--q-bright)"/></linearGradient></defs>';

    function hitDot(x, y) {
      for (var i = 0; i < 9; i++) { var r = dots[i].getBoundingClientRect(); if (x >= r.left - 8 && x <= r.right + 8 && y >= r.top - 8 && y <= r.bottom + 8) return i; }
      return -1;
    }
    function addDot(i) { if (i < 0 || seq.indexOf(i) > -1) return; seq.push(i); dots[i].classList.add("on"); vibe([18]); }

    box.addEventListener("pointerdown", function (e) { drawing = true; seq = []; dots.forEach(function (d) { d.classList.remove("on"); }); var i = hitDot(e.clientX, e.clientY); addDot(i); redraw(e.clientX - box.getBoundingClientRect().left, e.clientY - box.getBoundingClientRect().top); });
    box.addEventListener("pointermove", function (e) { if (!drawing) return; var b = box.getBoundingClientRect(); addDot(hitDot(e.clientX, e.clientY)); redraw(e.clientX - b.left, e.clientY - b.top); });
    function finish() { if (!drawing) return; drawing = false; redraw(); if (seq.length >= 4) onDone("P" + seq.join("-")); else { dots.forEach(function (d) { d.classList.remove("on"); }); line.innerHTML = line.innerHTML; if (window.toast) toast("Connect at least 4 points.", true); } }
    box.addEventListener("pointerup", finish);
    box.addEventListener("pointerleave", finish);
    wrap.appendChild(box);
    return wrap;
  }

  /* ── PIN pad ── */
  function pinPad(onDone) {
    var wrap = H.el("div", { class: "lock-pad" });
    var val = "";
    var dotsRow = H.el("div", { class: "pin-dots" });
    var dEls = [];
    for (var i = 0; i < 6; i++) { var d = H.el("div", { class: "pin-d" }); dotsRow.appendChild(d); dEls.push(d); }
    function paint() { dEls.forEach(function (d, i) { d.classList.toggle("on", i < val.length); }); }
    wrap.appendChild(dotsRow);
    var pad = H.el("div", { class: "pin-grid" });
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "\u232B"].forEach(function (k) {
      if (k === "") { pad.appendChild(H.el("div")); return; }
      var b = H.el("button", { class: "pin-key" }, k);
      b.onclick = function () {
        if (k === "\u232B") { val = val.slice(0, -1); paint(); return; }
        if (val.length >= 6) return;
        val += k; vibe([16]); paint();
        if (val.length >= 4 && val.length === 6) onDone("N" + val);
      };
      pad.appendChild(b);
    });
    // confirm for 4-5 digit pins
    var ok = H.el("button", { class: "btn btn-primary", style: "width:100%;margin-top:14px" }, "Confirm");
    ok.onclick = function () { if (val.length >= 4) onDone("N" + val); else if (window.toast) toast("At least 4 digits.", true); };
    wrap.appendChild(pad); wrap.appendChild(ok);
    return wrap;
  }

  function buildVeil(forSetup, setupMode, cb) {
    remove();
    veil = H.el("div", { id: "codeVeil" });
    var inner = H.el("div", { class: "code-inner" });
    var mk = (window.Brand ? Brand.sigil(48, true) : "\u2726");
    inner.appendChild(H.el("div", { class: "code-sigil", html: mk }));
    if (window.Brand) inner.querySelector(".code-sigil").innerHTML = mk;
    inner.appendChild(H.el("div", { class: "code-title" }, forSetup ? (setupMode === "pattern" ? "Draw your pattern" : "Set your PIN") : "The Sanctum is sealed"));
    inner.appendChild(H.el("div", { class: "code-sub" }, forSetup ? "This seals your space on this device" : (mode() === "pattern" ? "draw to enter" : "enter your PIN")));

    var useMode = forSetup ? setupMode : mode();
    var firstCapture = null;
    function onEntry(code) {
      if (forSetup) {
        if (!firstCapture) { firstCapture = code; inner.querySelector(".code-title").textContent = "Confirm once more"; inner.replaceChild(pad(onEntry), inner.lastChild); return; }
        if (firstCapture !== code) { if (window.toast) toast("Didn't match — try again.", true); firstCapture = null; inner.querySelector(".code-title").textContent = (setupMode === "pattern" ? "Draw your pattern" : "Set your PIN"); inner.replaceChild(pad(onEntry), inner.lastChild); vibe([120]); return; }
        try { localStorage.setItem(MODE, setupMode); localStorage.setItem(HASH, hash(code)); } catch (e) {}
        vibe([40, 60, 90]); remove(); if (cb) cb(true);
      } else {
        if (hash(code) === saved()) { lastOK = Date.now(); vibe([30, 45, 70]); active = false; remove(); if (cb) cb(true); }
        else { vibe([160]); if (window.toast) toast("Not recognized.", true); inner.replaceChild(pad(onEntry), inner.lastChild); }
      }
    }
    function pad(done) { return useMode === "pattern" ? patternPad(done) : pinPad(done); }
    inner.appendChild(pad(onEntry));
    veil.appendChild(inner);
    document.body.appendChild(veil);
    requestAnimationFrame(function () { veil.classList.add("on"); });
  }
  function remove() { if (veil) { try { veil.remove(); } catch (e) {} veil = null; } }

  function lock() {
    if (mode() === "off" || !saved()) return;
    if (active) return;
    if (Date.now() - lastOK < 2500) return;
    active = true;
    buildVeil(false, null, function () { active = false; });
  }

  window.CodeLock = {
    mode: mode,
    isSet: function () { return mode() !== "off" && !!saved(); },
    setup: function (which, cb) { buildVeil(true, which, cb); },
    clear: function (cb) {
      // require current lock to remove
      if (mode() === "off") { if (cb) cb(true); return; }
      buildVeil(false, null, function () { try { localStorage.setItem(MODE, "off"); localStorage.removeItem(HASH); } catch (e) {} if (window.toast) toast("Lock removed."); if (cb) cb(true); });
    },
    lock: lock,
  };

  // gate on cold open + resume
  try {
    var T = (typeof setInterval === "function") ? setInterval : (window.setInterval ? window.setInterval.bind(window) : null);
    var CI = (typeof clearInterval === "function") ? clearInterval : (window.clearInterval ? window.clearInterval.bind(window) : null);
    if (T) {
      var tries = 0;
      var iv = T(function () { tries++; if (window.APP && APP.me) { CI(iv); lock(); } else if (tries > 60) CI(iv); }, 1000);
      var C = window.Capacitor;
      if (C && C.Plugins && C.Plugins.App && C.Plugins.App.addListener) {
        C.Plugins.App.addListener("resume", function () { if (Date.now() - lastOK > 2500) lock(); });
      }
    }
  } catch (e) {}
})();
