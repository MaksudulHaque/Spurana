/* ============================================================
 * SPURANA · wall/wall.js — The Awareness Wall.
 * Post-login feed of randomized self-awareness content:
 * insights, self-inquiry questions, affirmations, sensory
 * prompts, and interactive micro-activities. Reshuffles every
 * visit. A one-tap "Play the mood" starts a background YouTube
 * track chosen by time of day (ambient + devotional mix).
 * ============================================================ */
(function () {
  "use strict";

  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }

  // ── original self-awareness content (no copyrighted text) ──
  var INSIGHTS = [
    "Awareness is not something you do. It is what you already are, quietly watching everything else.",
    "You are not your thoughts. You are the open sky in which they pass.",
    "The moment you notice you drifted — that is the moment you woke up.",
    "Feelings are visitors. Let them come, offer them tea, and let them leave.",
    "Between what happens and how you respond, there is a space. In that space lives your freedom.",
    "You cannot calm the sea, but you can learn to sail. The same is true of the mind.",
    "Self-awareness begins the instant you stop judging what you find.",
    "The breath is always now. Whenever you are lost, return to it.",
    "You are both the wave and the ocean. Forget neither.",
    "What you resist persists. What you allow, softens.",
  ];
  var QUESTIONS = [
    "What am I feeling right now — and where do I feel it in my body?",
    "If this emotion could speak, what would it be asking for?",
    "What is one thing I am pretending not to know?",
    "Who am I, beneath all the roles I have played today?",
    "What would change if I trusted myself completely?",
    "What am I holding onto that is ready to be set down?",
  ];
  var AFFIRM = [
    "I am allowed to take up space, exactly as I am.",
    "I meet myself with patience today.",
    "My worth is not a performance.",
    "I can feel this fully and still be okay.",
    "I return to my breath, and my breath returns me to myself.",
    "I am becoming more awake, one breath at a time.",
  ];
  var NOTICE = [
    "Name three things you can hear right now.",
    "Notice five things you can see — without labelling them good or bad.",
    "Feel the weight of your body where it meets the chair or floor.",
    "Notice the temperature of the air on your skin.",
    "Take one slow breath and feel exactly where it begins.",
    "Soften your jaw, your shoulders, your hands. Notice the difference.",
  ];
  var EMOTIONS = ["Calm", "Anxious", "Grateful", "Tired", "Hopeful", "Heavy", "Tender", "Restless"];
  var EMO_REPLY = {
    Calm: "Stay here a moment. Let calm sink one layer deeper.",
    Anxious: "Anxiety is energy without a home. Give it a slow breath to rest in.",
    Grateful: "Let it overflow — name one more thing you are grateful for.",
    Tired: "Tiredness is honest. Can you offer yourself a little gentleness?",
    Hopeful: "Hope is a seed. What small step could water it today?",
    Heavy: "You don't have to carry it all at once. Set down one thing.",
    Tender: "Tenderness means you are open. That is a kind of courage.",
    Restless: "Restlessness is looking for movement. Let the breath move first.",
  };

  // ── card builders (each returns a feed card element) ──
  function card(kind, inner) { return H.el("div", { class: "wall-card wall-" + kind + " reveal" }, inner); }
  function tag(t) { return H.el("div", { class: "wall-tag" }, t); }

  function insightCard() {
    return card("insight", [tag("Insight"), H.el("div", { class: "wall-body f-soul" }, pick(INSIGHTS))]);
  }
  function questionCard() {
    return card("question", [tag("Ask Yourself"), H.el("div", { class: "wall-body f-soul" }, pick(QUESTIONS))]);
  }
  function affirmCard() {
    return card("affirm", [tag("Today"), H.el("div", { class: "wall-body f-sacred wall-affirm" }, pick(AFFIRM))]);
  }
  function noticeCard() {
    var done = H.el("button", { class: "wall-do" }, "I did it \u2713");
    var c = card("notice", [tag("Right Now"), H.el("div", { class: "wall-body" }, pick(NOTICE)), done]);
    done.onclick = function () { done.textContent = "\u2726 noticed"; done.disabled = true; c.classList.add("wall-glow"); };
    return c;
  }
  function breathCard() {
    var orb = H.el("div", { class: "wall-orb" });
    var label = H.el("div", { class: "wall-breath-label" }, "tap the orb \u2014 breathe with it");
    var on = false, t = null;
    function step(inh) { if (!on) return; orb.style.transform = inh ? "scale(1.35)" : "scale(0.85)"; label.textContent = inh ? "breathe in\u2026" : "breathe out\u2026"; t = setTimeout(function () { step(!inh); }, 4000); }
    orb.onclick = function () { on = !on; if (on) { orb.classList.add("live"); step(true); } else { orb.classList.remove("live"); clearTimeout(t); orb.style.transform = ""; label.textContent = "tap the orb \u2014 breathe with it"; } };
    return card("breath", [tag("One Minute of Breath"), orb, label]);
  }
  function gratitudeCard() {
    var n = 0;
    var num = H.el("div", { class: "wall-count" }, "0");
    var btn = H.el("button", { class: "wall-do" }, "Tap for each thing \u2726");
    btn.onclick = function () { n++; num.textContent = String(n); if (n >= 3) btn.textContent = "Beautiful. Keep going \u2726"; };
    return card("grat", [tag("Gratitude"), H.el("div", { class: "wall-body" }, "Tap once for each thing you are grateful for today."), num, btn]);
  }
  function emotionCard() {
    var reply = H.el("div", { class: "wall-emo-reply" }, "");
    var grid = H.el("div", { class: "wall-emo-grid" }, shuffle(EMOTIONS).map(function (e) {
      var b = H.el("button", { class: "wall-emo" }, e);
      b.onclick = function () { Array.prototype.forEach.call(grid.children, function (x) { x.classList.remove("sel"); }); b.classList.add("sel"); reply.textContent = EMO_REPLY[e] || ""; };
      return b;
    }));
    return card("emo", [tag("How are you, really?"), grid, reply]);
  }

  var BUILDERS = [insightCard, questionCard, affirmCard, noticeCard, breathCard, gratitudeCard, emotionCard, insightCard, questionCard, noticeCard];

  function buildFeed(host) {
    host.innerHTML = "";
    // always lead with one interactive + then a shuffled mix
    var order = shuffle(BUILDERS);
    order.unshift(pick([breathCard, emotionCard, gratitudeCard]));
    order.slice(0, 11).forEach(function (fn) { try { host.appendChild(fn()); } catch (e) {} });
  }

  // ── mood music (background YouTube, time-of-day, ambient + devotional) ──
  var MOODS = {
    dawn: ["DWcJFNfaw9c", "1ZYbU82GVz4", "lTRiuFIWV54"],   // calm / morning ambient
    day: ["jfKfPfyJRdk", "5qap5aO4i9A", "rUxyKA_-grg"],     // lofi / focus
    dusk: ["S_MOd40zlYU", "t_zm0nLezDI", "FjHGZj2IjBk"],    // warm ambient / devotional
    night: ["1ZYbU82GVz4", "V-_O7nl0Ii0", "WkQXKt9-ym0"],   // deep ambient / chant
  };
  function daypart() { var h = new Date().getHours(); if (h >= 5 && h < 8) return "dawn"; if (h >= 8 && h < 17) return "day"; if (h >= 17 && h < 20) return "dusk"; return "night"; }

  var ytReady = false, ytPlayer = null, ytQueue = [], ytIdx = 0;
  function loadYT(cb) {
    if (window.YT && window.YT.Player) { cb(); return; }
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () { if (prev) try { prev(); } catch (e) {} cb(); };
    if (!document.getElementById("yt-api")) { var s = document.createElement("script"); s.id = "yt-api"; s.src = "https://www.youtube.com/iframe_api"; document.body.appendChild(s); }
  }
  function playMood(host, label) {
    ytQueue = shuffle(MOODS[daypart()] || MOODS.night); ytIdx = 0;
    label.textContent = "tuning the mood\u2026";
    loadYT(function () {
      if (!ytPlayer) {
        ytPlayer = new YT.Player(host, {
          height: "1", width: "1",
          playerVars: { autoplay: 1, controls: 0, playsinline: 1 },
          events: {
            onReady: function (e) { e.target.setVolume(45); e.target.loadVideoById(ytQueue[ytIdx]); e.target.playVideo(); label.textContent = "the mood is playing \u2726  (tap to stop)"; },
            onError: function () { ytIdx++; if (ytIdx < ytQueue.length && ytPlayer) ytPlayer.loadVideoById(ytQueue[ytIdx]); else label.textContent = "couldn't load \u2014 try again"; },
            onStateChange: function (e) { if (e.data === YT.PlayerState.ENDED) { ytIdx = (ytIdx + 1) % ytQueue.length; ytPlayer.loadVideoById(ytQueue[ytIdx]); } },
          },
        });
      } else { ytPlayer.setVolume(45); ytPlayer.loadVideoById(ytQueue[ytIdx]); ytPlayer.playVideo(); label.textContent = "the mood is playing \u2726  (tap to stop)"; }
    });
  }
  function stopMood(label) { try { if (ytPlayer && ytPlayer.stopVideo) ytPlayer.stopVideo(); } catch (e) {} label.textContent = "Play the mood \u266a"; }

  Router.register("wall", function (root) {
    root.appendChild(topBar({ title: "Awareness", home: "self", action: { label: "\u21bb", onClick: function () { buildFeed(feed); } } }));
    var body = H.el("div", { class: "scroll grow wall-wrap reveal" });
    root.appendChild(body);

    // mood music bar
    var musicLabel = H.el("div", { class: "wall-music-label" }, "Play the mood \u266a");
    var ytHost = H.el("div", { id: "wall-yt", style: "width:1px;height:1px;overflow:hidden;opacity:0;position:absolute" });
    var playing = false;
    var musicBtn = H.el("button", { class: "wall-music" }, [H.el("span", { class: "wall-music-ico" }, "\u25B6"), musicLabel]);
    musicBtn.onclick = function () { playing = !playing; if (playing) { musicBtn.classList.add("on"); playMood(ytHost, musicLabel); } else { musicBtn.classList.remove("on"); stopMood(musicLabel); } };
    body.appendChild(H.el("div", { class: "wall-head" }, [
      H.el("div", { class: "wall-title f-sacred" }, "The Awakening Wall"),
      H.el("div", { class: "wall-sub" }, "a little awareness, fresh each time"),
      musicBtn, ytHost,
    ]));

    // quick links
    body.appendChild(H.el("div", { class: "wall-links" }, [
      H.el("button", { class: "wall-link", onClick: function () { Router.go("self"); } }, "\u25C8  Dashboard"),
      H.el("button", { class: "wall-link", onClick: function () { Router.go("sanctuary"); } }, "\u2726  Sanctuary"),
    ]));

    var feed = H.el("div", { class: "wall-feed" });
    body.appendChild(feed);
    buildFeed(feed);

    return { teardown: function () { try { stopMood(musicLabel); } catch (e) {} } };
  });
})();
