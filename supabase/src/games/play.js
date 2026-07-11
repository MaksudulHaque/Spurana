/* ============================================================
 * SPURANA · games/play.js — Sacred Games.
 *   • Sacred Questions (couple) — a deck of deepening questions
 *     to draw together; any card can be sent to your beloved as
 *     a Love Letter (reuses the secure keepsake pattern).
 *   • Symbol Memory (solo) — a calm pairs game of sacred glyphs,
 *     entirely client-side; best score kept locally.
 * No new tables; the memory game uses no network; fixed content
 * decks (no free-text sink); timers cleaned up on teardown.
 * ============================================================ */
(function () {
  "use strict";

  var QUESTIONS = [
    "When did you first feel truly safe with me?",
    "What is a small thing I do that you quietly love?",
    "What does your soul most long for this season?",
    "When do you feel closest to me?",
    "What part of yourself are you still learning to love?",
    "What memory of us would you keep if you could keep only one?",
    "What are you afraid to ask me for?",
    "How do you most like to be comforted when you're low?",
    "What dream have you not yet spoken aloud?",
    "What did love look like in the home you grew up in?",
    "Where in your body do you carry your worry?",
    "What would a perfectly gentle day together look like?",
    "What is something you forgive yourself for now?",
    "When have you felt most proud of us?",
    "What do you need more of from me, lately?",
    "What does home mean to you, beyond a place?",
    "What is a fear you've outgrown?",
    "What song feels like us?",
    "What do you hope we are like when we are old?",
    "What is the kindest thing anyone has ever said to you?",
    "What does your heart do when you miss me?",
    "What ritual would you like us to keep, always?",
    "What part of your day do you wish I could see?",
    "What are you grateful for that you rarely say?",
    "What does stillness feel like to you?",
    "When did you last feel fully understood?",
    "What is a wound you're ready to let soften?",
    "What would you do with a slow, empty afternoon together?",
    "What is something true you've never told me?",
    "How do you know when you are loved?",
  ];

  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* ════════ hub ════════ */
  Router.register("games", function (root) {
    root.appendChild(topBar({ title: "Sacred Games", back: true }));
    var body = H.el("div", { class: "pad scroll grow stack reveal" });
    root.appendChild(body);
    function card(icon, name, desc, go) {
      return H.el("button", { class: "zone-card", onClick: go }, [
        H.el("div", { class: "zc-icon" }, icon),
        H.el("div", { class: "zc-body" }, [H.el("div", { class: "zc-title" }, name), H.el("div", { class: "zc-desc" }, desc)]),
      ]);
    }
    body.appendChild(card("\uD83C\uDCCF", "Sacred Questions", "Draw a deepening question, together.", function () { Router.go("game_questions"); }));
    body.appendChild(card("\uD83E\uDDE9", "Symbol Memory", "A calm game of matching sacred glyphs.", function () { Router.go("game_memory"); }));
    return {};
  });

  /* ════════ Sacred Questions (couple) ════════ */
  Router.register("game_questions", function (root) {
    root.appendChild(topBar({ title: "Sacred Questions", back: true }));
    var wrap = H.el("div", { class: "pad scroll grow stack reveal", style: "align-items:center;text-align:center" });
    root.appendChild(wrap);

    var deck = shuffle(QUESTIONS), i = 0;
    var qcard = H.el("div", { class: "sq-card" }, deck[i]);
    var nextBtn = H.el("button", { class: "btn btn-ghost btn-block" }, "Draw another \u2726");
    var sendBtn = H.el("button", { class: "btn btn-primary btn-block" }, "Send to beloved \uD83D\uDC8C");

    nextBtn.addEventListener("click", function () {
      i = (i + 1) % deck.length; if (i === 0) deck = shuffle(QUESTIONS);
      qcard.style.opacity = "0";
      setTimeout(function () { qcard.textContent = deck[i]; qcard.style.opacity = "1"; }, 220);
    });
    sendBtn.addEventListener("click", async function () {
      var conv = APP.activeConv; if (!conv) { if (window.toast) toast("Bond with your beloved first.", true); return; }
      var ok = await Keepsake.add(conv, "letter", { text: "A question for us \u2014 " + deck[i] });
      if (window.toast) toast(ok ? "Sent to Love Letters \u2726" : "Couldn't send.", !ok);
    });

    wrap.append(qcard, H.el("div", { class: "stack", style: "width:100%;max-width:360px" }, [nextBtn, sendBtn]));
    return {};
  });

  /* ════════ Symbol Memory (solo) ════════ */
  Router.register("game_memory", function (root) {
    root.appendChild(topBar({ title: "Symbol Memory", back: true }));
    var body = H.el("div", { class: "pad scroll grow stack reveal", style: "align-items:center" });
    root.appendChild(body);

    var GLYPHS = ["\uD83E\uDEB7", "\uD83D\uDD49\uFE0F", "\u263E", "\u2726", "\uD83D\uDD31", "\u267E\uFE0F", "\uD83C\uDF38", "\uD83D\uDD4A\uFE0F"];
    var pending = null, lock = false, moves = 0, matched = 0, first = null;
    var best = 0; try { best = +(localStorage.getItem("spurana.mem.best") || 0); } catch (e) {}

    var status = H.el("div", { class: "mem-status" }, "");
    var grid = H.el("div", { class: "mem-grid" });
    var resetBtn = H.el("button", { class: "btn btn-ghost" }, "New game");
    body.append(status, grid, resetBtn);

    function setStatus() { status.textContent = "Moves " + moves + (best ? "  \u00b7  Best " + best : ""); }
    function start() {
      if (pending) { clearTimeout(pending); pending = null; }
      lock = false; moves = 0; matched = 0; first = null; setStatus(); H.clear(grid);
      shuffle(GLYPHS.concat(GLYPHS)).forEach(function (g) {
        var cell = H.el("button", { class: "mem-cell" }, H.el("span", { class: "mem-face" }, g));
        cell._g = g;
        cell.addEventListener("click", function () { flip(cell); });
        grid.appendChild(cell);
      });
    }
    function flip(cell) {
      if (lock || cell.classList.contains("open") || cell.classList.contains("done")) return;
      cell.classList.add("open");
      if (!first) { first = cell; return; }
      if (first === cell) return;
      moves++; setStatus();
      if (first._g === cell._g) {
        first.classList.add("done"); cell.classList.add("done"); matched += 2; first = null;
        if (matched === GLYPHS.length * 2) win();
      } else {
        lock = true; var a = first, b = cell; first = null;
        pending = setTimeout(function () { a.classList.remove("open"); b.classList.remove("open"); lock = false; pending = null; }, 750);
      }
    }
    function win() {
      if (!best || moves < best) { best = moves; try { localStorage.setItem("spurana.mem.best", String(best)); } catch (e) {} }
      setStatus();
      if (window.toast) toast("Matched all \u2726 " + moves + " moves");
    }
    resetBtn.addEventListener("click", start);
    start();
    return { teardown: function () { if (pending) { clearTimeout(pending); pending = null; } } };
  });
})();
