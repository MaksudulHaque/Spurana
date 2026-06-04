/* ============================================================
 * SPURANA · reflect/reflect.js — the REFLECT section.
 * Our Stats · Connection Tree · Soul Qi · Deeper Reflection.
 * Everything is computed from real stored data (messages,
 * keepsakes, hc_logs) — no mock numbers.
 * ============================================================ */
(function () {
  "use strict";
  function needConv() { if (!APP.activeConv) { Router.go("chat"); return null; } return APP.activeConv; }

  const Stats = {
    async count(conv, types) {
      try {
        let q = SP._sb.from("messages").select("id", { count: "exact", head: true }).eq("conv_id", conv).neq("deleted", true);
        if (types) q = q.in("type", types);
        const { count, error } = await q; return error ? 0 : (count || 0);
      } catch (e) { return 0; }
    },
    async since(conv) {
      try { const { data } = await SP._sb.from("messages").select("ts").eq("conv_id", conv).order("ts", { ascending: true }).limit(1); return data && data[0] ? Number(data[0].ts) : null; }
      catch (e) { return null; }
    },
    async recentMessages(conv) {
      try { const cutoff = Date.now() - 7 * 86400000; const { count } = await SP._sb.from("messages").select("id", { count: "exact", head: true }).eq("conv_id", conv).gte("ts", cutoff); return count || 0; }
      catch (e) { return 0; }
    },
    async practiceSeconds() {
      try { const me = APP.me && APP.me.id; const { data } = await SP._sb.from("hc_logs").select("seconds").eq("uid", me).limit(2000); return (data || []).reduce((a, r) => a + (Number(r.seconds) || 0), 0); }
      catch (e) { return 0; }
    },
    async all(conv) {
      const [msgs, memories, letters, grats, days, sinceTs, recent, secs] = await Promise.all([
        this.count(conv, ["text", "image", "voice"]), this.count(conv, ["memory"]), this.count(conv, ["letter"]),
        this.count(conv, ["gratitude"]), this.count(conv, ["sacred_day"]), this.since(conv), this.recentMessages(conv), this.practiceSeconds(),
      ]);
      const together = sinceTs ? Math.max(0, Math.floor((Date.now() - sinceTs) / 86400000)) : 0;
      return { msgs, memories, letters, grats, days, together, recent, minutes: Math.round(secs / 60) };
    },
  };

  // ── Our Stats ──
  Router.register("stats", function (root) {
    const conv = needConv(); if (!conv) return {};
    root.appendChild(topBar({ title: "Our Stats", back: true }));
    const body = H.el("div", { class: "pad scroll grow reveal" });
    root.appendChild(body);
    body.appendChild(H.el("div", { class: "faint center", style: "padding:10px" }, "Gathering\u2026"));
    (async () => {
      const s = await Stats.all(conv);
      H.clear(body);
      const grid = H.el("div", { class: "stat-grid" });
      [["\uD83D\uDCAC", s.msgs, "messages"], ["\uD83D\uDD52", s.together, "days bonded"], ["\uD83D\uDC9E", s.memories, "memories"],
       ["\uD83D\uDC8C", s.letters, "letters"], ["\uD83C\uDF1F", s.grats, "gratitudes"], ["\uD83D\uDDD3", s.days, "sacred days"],
       ["\uD83E\uDDD8", s.minutes, "practice min"], ["\u2728", s.recent, "msgs this week"]].forEach((t) =>
        grid.appendChild(H.el("div", { class: "stat-card" }, [H.el("div", { class: "stat-ico" }, t[0]), H.el("div", { class: "stat-num" }, String(t[1])), H.el("div", { class: "stat-lbl" }, t[2])])));
      body.appendChild(grid);
      body.appendChild(H.el("p", { class: "center muted", style: "font-family:var(--f-soul);font-style:italic;margin-top:18px" }, "Every number here is a moment you chose each other."));
    })();
    return {};
  });

  // ── Connection Tree ──
  function treeSVG(score) {
    const leaves = Math.min(46, 7 + Math.round(score / 2.4));
    let parts = "";
    for (let i = 0; i < leaves; i++) {
      const a = (i / leaves) * Math.PI * 2 + i * 0.7;
      const rad = 28 + (i % 5) * 13 + (i * 9 % 17);
      const x = 100 + Math.cos(a) * rad * 0.8;
      const y = 78 - Math.abs(Math.sin(a)) * rad - (i % 3) * 4;
      const r = 3 + (i % 3);
      const gold = i % 4 === 0;
      parts += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r + '" fill="' + (gold ? "#E2C28A" : "#E8009A") + '" opacity="' + (0.55 + (i % 4) * 0.12) + '"/>';
    }
    return '<svg viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><filter id="tg"><feGaussianBlur stdDeviation="2.2"/></filter></defs>' +
      '<g filter="url(#tg)" opacity="0.5">' + parts + "</g>" + parts +
      '<path d="M100 175 L100 95 M100 120 Q80 108 66 92 M100 110 Q122 100 138 86 M100 132 Q86 124 74 112 M100 128 Q118 120 130 108" stroke="#C9A96E" stroke-width="3.2" fill="none" stroke-linecap="round" opacity="0.85"/>' +
      "</svg>";
  }
  Router.register("tree", function (root) {
    const conv = needConv(); if (!conv) return {};
    root.appendChild(topBar({ title: "Connection Tree", back: true }));
    const body = H.el("div", { class: "pad scroll grow reveal", style: "display:flex;flex-direction:column;align-items:center" });
    root.appendChild(body);
    const holder = H.el("div", { class: "tree-holder" });
    body.appendChild(holder);
    const cap = H.el("p", { class: "center", style: "font-family:var(--f-soul);font-style:italic;font-size:18px;color:#eaccff;max-width:320px" }, "Your tree grows with every shared moment.");
    body.appendChild(cap);
    (async () => {
      const s = await Stats.all(conv);
      const score = s.msgs + s.memories * 5 + s.letters * 8 + s.grats * 3 + s.days * 6 + s.minutes;
      holder.innerHTML = treeSVG(score);
      cap.textContent = score < 30 ? "A seedling \u2014 tend it together." : score < 150 ? "Growing, leaf by leaf." : "Flourishing. Look how far you've come.";
    })();
    return {};
  });

  // ── Soul Qi ──
  Router.register("qi", function (root) {
    const conv = needConv(); if (!conv) return {};
    root.appendChild(topBar({ title: "Soul Qi", back: true }));
    const body = H.el("div", { class: "pad scroll grow reveal", style: "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;min-height:60vh" });
    root.appendChild(body);
    const orb = H.el("div", { class: "qi-orb" });
    const label = H.el("div", { style: "font-family:var(--f-ui);letter-spacing:.24em;text-transform:uppercase;color:var(--q-bright)" }, "\u2026");
    const desc = H.el("p", { class: "center muted", style: "font-family:var(--f-soul);font-style:italic;max-width:300px" }, "");
    body.append(orb, label, desc);
    (async () => {
      const recent = await Stats.recentMessages(conv);
      const secs = await Stats.practiceSeconds();
      const score = Math.max(6, Math.min(100, Math.round(recent * 2 + secs / 120)));
      const scale = 0.55 + score / 100 * 0.6;
      orb.style.transform = "scale(" + scale.toFixed(2) + ")";
      orb.style.opacity = String(0.5 + score / 100 * 0.5);
      label.textContent = score >= 70 ? "Radiant \u00b7 " + score : score >= 35 ? "Warm \u00b7 " + score : "Quiet \u00b7 " + score;
      desc.textContent = score >= 70 ? "Your bond hums with life right now." : score >= 35 ? "A steady, gentle current flows between you." : "The field is quiet. A word or a breath will stir it.";
    })();
    return {};
  });

  // ── Deeper Reflection ──
  const PROMPTS = [
    "When did you last feel truly understood by me?",
    "What is one way I've grown since we began?",
    "What do we protect in each other?",
    "What does our love ask of us right now?",
    "What are we building together, really?",
  ];
  Router.register("reflection", function (root) {
    const conv = needConv(); if (!conv) return {};
    root.appendChild(topBar({ title: "Deeper Reflection", back: true }));
    const body = H.el("div", { class: "pad scroll grow stack reveal", style: "align-items:center" });
    root.appendChild(body);
    const prompt = H.el("p", { class: "center", style: "font-family:var(--f-soul);font-style:italic;font-size:22px;color:#eaccff;max-width:340px" }, PROMPTS[new Date().getDate() % PROMPTS.length]);
    const ta = H.el("textarea", { class: "input", rows: "4", placeholder: "Sit with it, then write\u2026", style: "resize:none;max-width:440px" });
    const keep = H.el("button", { class: "sacred-btn", onClick: async () => { const t = ta.value.trim(); if (!t) return; const m = await Keepsake.add(conv, "reflection", { text: t }); if (m) { toast("Reflection kept \u2726"); ta.value = ""; } else toast("Couldn't save.", true); } }, "Keep \u2726");
    const shuffle = H.el("button", { class: "btn btn-ghost", onClick: () => { prompt.textContent = PROMPTS[Math.floor(Math.random() * PROMPTS.length)]; } }, "Another prompt");
    body.append(prompt, ta, keep, shuffle);
    return {};
  });
})();
