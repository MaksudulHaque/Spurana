/* ============================================================
 * SPURANA · core/applock.js — Pattern & PIN locks.
 * Two more ways to seal the sanctum, beside the fingerprint:
 *  · a 9-dot connect-the-pattern gate (like Android's own)
 *  · a 4–6 digit PIN gate
 * The secret is salted+hashed in local storage (never stored
 * plain). Either gate veils the app on open and on return from
 * background. Settings choose which lock is active.
 * ============================================================ */
(function () {
  "use strict";

  var MODE = "spurana.lock.mode";   // 'none' | 'pattern' | 'pin'
  var HASH = "spurana.lock.hash";
  var veil = null, armed = false, lastPass = 0, expectResume = false;

  function LS(k, v) { try { return v === undefined ? localStorage.getItem(k) : (localStorage.setItem(k, v), v); } catch (e) { return null; } }
  function mode() { return LS(MODE) || "none"; }
  function vibe(seq) { try { if (window.Native && Native.pattern) Native.pattern(seq); else if (navigator.vibrate) navigator.vibrate(seq); } catch (e) {} }

  // tiny salted hash (djb2 over salt+value) — obfuscation for a local gate
  function hash(s) {
    var str = "spurana\u2726" + s, h = 5381;
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return String(h);
  }

  /* ── veil UI ── */
  function clearVeil() { if (veil) { try { veil.remove(); } catch (e) {} veil = null; } }
  function makeVeil(title) {
    clearVeil();
    veil = document.createElement("div");
    veil.className = "lock-veil on";
    var head = '<div class="lock-mark"></div><div class="lock-title">' + title + '</div><div class="lock-sub" id="lockSub">' +
      (mode() === "pattern" ? "Draw your pattern" : "Enter your code") + "</div>";
    veil.innerHTML = head + '<div class="lock-body" id="lockBody"></div>';
    document.body.appendChild(veil);
    var mk = veil.querySelector(".lock-mark");
    if (window.Brand) mk.innerHTML = Brand.sigil(56, true);
    return veil;
  }
  function fail(msg) { var s = veil && veil.querySelector("#lockSub"); if (s) s.textContent = msg || "Try again"; vibe([120]); }
  function pass() { lastPass = Date.now(); vibe([30, 45, 70]); clearVeil(); }

  /* ── PIN pad ── */
  function pinPad(onDone) {
    var body = veil.querySelector("#lockBody");
    var entry = ""; 
    var dots = document.createElement("div"); dots.className = "pin-dots";
    function drawDots() { dots.innerHTML = ""; for (var i = 0; i < Math.max(4, entry.length); i++) { var d = document.createElement("span"); d.className = "pin-dot" + (i < entry.length ? " f" : ""); dots.appendChild(d); } }
    var pad = document.createElement("div"); pad.className = "pin-pad";
    ["1","2","3","4","5","6","7","8","9","","0","<"].forEach(function (k) {
      var b = document.createElement("button"); b.className = "pin-key" + (k === "" ? " ghost" : ""); b.textContent = k === "<" ? "\u232B" : k;
      if (k === "") b.disabled = true;
      b.onclick = function () {
        if (k === "<") { entry = entry.slice(0, -1); drawDots(); return; }
        if (k === "") return;
        if (entry.length >= 6) return;
        entry += k; drawDots(); vibe([18]);
        if (entry.length >= 4) { /* allow submit on 4-6 via done key */ }
        if (entry.length === 6) onDone(entry);
      };
      pad.appendChild(b);
    });
    var go = document.createElement("button"); go.className = "lock-go"; go.textContent = "Enter";
    go.onclick = function () { if (entry.length >= 4) onDone(entry); else fail("At least 4 digits"); };
    body.appendChild(dots); body.appendChild(pad); body.appendChild(go); drawDots();
  }

  /* ── pattern grid (3×3) ── */
  function patternGrid(onDone) {
    var body = veil.querySelector("#lockBody");
    var wrap = document.createElement("div"); wrap.className = "pat-wrap";
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "pat-svg"); svg.setAttribute("viewBox", "0 0 300 300");
    var line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    line.setAttribute("class", "pat-line"); svg.appendChild(line);
    var nodes = [], seq = [], drawing = false;
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
      var cx = 50 + c * 100, cy = 50 + r * 100, idx = r * 3 + c;
      var g = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      g.setAttribute("cx", cx); g.setAttribute("cy", cy); g.setAttribute("r", 26);
      g.setAttribute("class", "pat-node"); g.dataset.idx = idx; g.dataset.cx = cx; g.dataset.cy = cy;
      svg.appendChild(g); nodes.push(g);
    }
    function pt(e) { var rect = svg.getBoundingClientRect(); var t = e.touches ? e.touches[0] : e; return { x: (t.clientX - rect.left) / rect.width * 300, y: (t.clientY - rect.top) / rect.height * 300 }; }
    function near(p) { for (var i = 0; i < nodes.length; i++) { var n = nodes[i]; var dx = p.x - n.dataset.cx, dy = p.y - n.dataset.cy; if (dx * dx + dy * dy < 34 * 34) return n; } return null; }
    function redraw(extra) { var pts = seq.map(function (n) { return n.dataset.cx + "," + n.dataset.cy; }); if (extra) pts.push(extra.x + "," + extra.y); line.setAttribute("points", pts.join(" ")); }
    function add(n) { if (seq.indexOf(n) > -1) return; seq.push(n); n.classList.add("on"); vibe([16]); redraw(); }
    function start(e) { e.preventDefault(); drawing = true; seq = []; nodes.forEach(function (n) { n.classList.remove("on"); }); var n = near(pt(e)); if (n) add(n); }
    function move(e) { if (!drawing) return; var p = pt(e); var n = near(p); if (n) add(n); redraw(p); }
    function end() { if (!drawing) return; drawing = false; redraw(); if (seq.length >= 4) onDone(seq.map(function (n) { return n.dataset.idx; }).join("-")); else fail("Connect at least 4 dots"); }
    svg.addEventListener("pointerdown", start); svg.addEventListener("pointermove", move); svg.addEventListener("pointerup", end); svg.addEventListener("pointerleave", end);
    wrap.appendChild(svg); body.appendChild(wrap);
  }

  function prompt(title, onOk) {
    makeVeil(title);
    var check = function (val) {
      if (hash(val) === LS(HASH)) { onOk(); }
      else { fail("Incorrect"); setTimeout(function () { var b = veil && veil.querySelector("#lockBody"); if (b) { b.innerHTML = ""; (mode() === "pattern" ? patternGrid : pinPad)(check); } }, 500); }
    };
    (mode() === "pattern" ? patternGrid : pinPad)(check);
  }

  function lock() {
    if (mode() === "none" || armed) return;
    // skip if biometric is already handling the veil, or just passed
    if (Date.now() - lastPass < 2500) return;
    armed = true;
    prompt(mode() === "pattern" ? "The Pattern Seal" : "The Code Seal", function () { armed = false; pass(); });
  }

  /* ── setup flow (choose + confirm) ── */
  function setup(newMode) {
    return new Promise(function (resolve) {
      if (newMode === "none") { LS(MODE, "none"); LS(HASH, ""); resolve(true); return; }
      LS(MODE, newMode); // temporarily so the grids render right
      makeVeil(newMode === "pattern" ? "Draw a new pattern" : "Choose a code");
      var first = null;
      var capture = function (val) {
        if (!first) {
          first = val;
          var s = veil.querySelector("#lockSub"); if (s) s.textContent = newMode === "pattern" ? "Draw it again to confirm" : "Enter it again to confirm";
          var b = veil.querySelector("#lockBody"); b.innerHTML = "";
          (newMode === "pattern" ? patternGrid : pinPad)(capture);
        } else {
          if (val === first) { LS(HASH, hash(val)); LS(MODE, newMode); vibe([40, 60, 90]); clearVeil(); if (window.toast) toast((newMode === "pattern" ? "Pattern" : "Code") + " lock set"); resolve(true); }
          else { fail("Didn't match — start again"); first = null; var b2 = veil.querySelector("#lockBody"); b2.innerHTML = ""; var s2 = veil.querySelector("#lockSub"); if (s2) s2.textContent = newMode === "pattern" ? "Draw your pattern" : "Enter your code"; (newMode === "pattern" ? patternGrid : pinPad)(capture); }
        }
      };
      (newMode === "pattern" ? patternGrid : pinPad)(capture);
    });
  }

  window.AppLock = {
    mode: mode,
    setup: setup,
    disable: function () { return setup("none"); },
    lockNow: lock,
    markResume: function () { expectResume = true; },
  };

  // compat shim for Settings UI (expects window.CodeLock: mode 'off', setup(mode,cb), clear(cb))
  window.CodeLock = {
    mode: function () { var m = mode(); return m === "none" ? "off" : m; },
    setup: function (m, cb) { setup(m).then(function () { if (cb) cb(); }); },
    clear: function (cb) { setup("none").then(function () { if (window.toast) toast("Code lock removed"); if (cb) cb(); }); },
  };

  // gate on load + resume
  try {
    var T = (typeof setInterval === "function") ? setInterval : (window.setInterval ? window.setInterval.bind(window) : null);
    var CI = (typeof clearInterval === "function") ? clearInterval : (window.clearInterval ? window.clearInterval.bind(window) : null);
    if (T) {
      var tries = 0;
      var iv = T(function () {
        tries++;
        if (window.APP && APP.me) { CI(iv); lock(); }
        else if (tries > 60) CI(iv);
      }, 1000);
      var C = window.Capacitor;
      if (C && C.Plugins && C.Plugins.App && C.Plugins.App.addListener) {
        C.Plugins.App.addListener("resume", function () { if (expectResume) { expectResume = false; return; } if (Date.now() - lastPass > 2500) lock(); });
      }
    }
  } catch (e) {}
})();
