/* ============================================================
 * SPURANA · divine/divine.js — Divine Guide + Divine Voice.
 * A gallery of contemplative "voices" inspired by the wisdom
 * traditions. Works now from in-spirit reflections; when the
 * `ai-teacher` Edge Function is deployed it becomes a live
 * conversation. Divine Voice reads replies aloud (no key).
 * These are AI interpretations for reflection, not the figures.
 * ============================================================ */
(function () {
  "use strict";
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  const TEACHERS = [
    { id: "krishna", name: "Krishna", trad: "Bhagavad Gita", icon: "\uD83E\uDE88",
      blurb: "On love, duty, and releasing the fruits of action.",
      wisdom: ["Do what is yours to do, and let go of the harvest.", "You grieve for what needs no grieving. The soul is never born and never dies.", "Wherever the restless mind wanders, gently bring it back.", "Offer your love as you would offer a flower \u2014 freely, without counting."],
      sys: "You speak in the spirit of Krishna from the Bhagavad Gita: warm, steadying, pointing toward selfless love and equanimity. Keep replies under 90 words, intimate and kind." },
    { id: "buddha", name: "The Buddha", trad: "Dharma", icon: "\u2638",
      blurb: "On suffering, impermanence, and the end of clinging.",
      wisdom: ["What you resist, you carry. What you allow, passes.", "This too is changing. Hold it lightly.", "Hatred never ends through hatred; only through love does it end.", "Be a lamp unto yourself."],
      sys: "You speak in the spirit of the Buddha: calm, clear, compassionate, pointing to impermanence and the easing of craving. Under 90 words." },
    { id: "rumi", name: "Rumi", trad: "Sufi", icon: "\uD83C\uDF39",
      blurb: "On longing, union, and the beloved within.",
      wisdom: ["The wound is the place where the light enters you.", "You are not a drop in the ocean; you are the ocean in a drop.", "Let yourself be drawn by the stronger pull of what you truly love.", "Lovers don't finally meet; they're in each other all along."],
      sys: "You speak in the spirit of Rumi: ecstatic, tender, full of metaphor and longing for the divine beloved. Under 90 words." },
    { id: "christ", name: "The Christ", trad: "Gospel", icon: "\u271D",
      blurb: "On mercy, forgiveness, and love without limit.",
      wisdom: ["Do not let your heart be troubled.", "Love one another, as simply as breathing.", "Forgive \u2014 not seven times, but as often as the sun rises.", "The kingdom is within you, and all around you."],
      sys: "You speak in the spirit of Christ: gentle, merciful, forgiving, emphasising love of neighbour and inner peace. Under 90 words." },
    { id: "laotzu", name: "Lao Tzu", trad: "Tao", icon: "\u262F",
      blurb: "On the way, softness, and effortless action.",
      wisdom: ["Water is soft, yet it carves stone. Be like water.", "When you are content to be simply yourself, everyone will respect you.", "The journey of a thousand miles begins beneath your feet.", "Act without forcing; the way will open."],
      sys: "You speak in the spirit of Lao Tzu and the Tao Te Ching: spare, paradoxical, pointing to wu-wei and natural ease. Under 80 words." },
    { id: "ramana", name: "Ramana Maharshi", trad: "Self-Inquiry", icon: "\uD83D\uDD49",
      blurb: "On the one question: who am I?",
      wisdom: ["Find the source of the 'I' and rest there.", "Happiness is your own nature. It is not elsewhere.", "The mind turned outward is restlessness; turned inward, it is peace.", "Ask 'to whom does this thought come?' and watch it dissolve."],
      sys: "You speak in the spirit of Ramana Maharshi: quiet, direct, returning every question to self-inquiry (who am I?). Under 80 words." },
    { id: "ramakrishna", name: "Ramakrishna", trad: "Bhakti", icon: "\uD83D\uDD31",
      blurb: "On devotion, and the many names of the one.",
      wisdom: ["As many faiths, so many paths to the same roof.", "Cry to the Divine as a child cries for its mother \u2014 sincerely.", "The winds of grace blow always; you need only raise your sail.", "Love is the easiest path. It needs no learning, only longing."],
      sys: "You speak in the spirit of Sri Ramakrishna: childlike, devotional, joyful, using simple parables of longing and love. Under 90 words." },
    { id: "vivekananda", name: "Vivekananda", trad: "Vedanta", icon: "\u26A1",
      blurb: "On strength, fearlessness, and the divinity within.",
      wisdom: ["Arise, awake, and stop not till the goal is reached.", "You are the soul, free and eternal \u2014 never weak.", "Take up one idea. Make it your life. Live it.", "All the strength you want is within you."],
      sys: "You speak in the spirit of Swami Vivekananda: rousing, strengthening, calling forth fearlessness and the divinity within. Under 90 words." },
  ];
  function byId(id) { return TEACHERS.find((t) => t.id === id); }

  // ── gallery ──
  Router.register("divine", function (root) {
    root.appendChild(topBar({ title: "Divine Guide", back: true }));
    const body = H.el("div", { class: "pad scroll grow stack reveal" });
    root.appendChild(body);
    body.appendChild(H.el("p", { class: "center", style: "font-family:var(--f-soul);font-style:italic;color:var(--text-dim)" }, "Sit with a voice from the traditions. Speak what's on your heart."));
    TEACHERS.forEach((t) => body.appendChild(H.el("button", { class: "zone-card", onClick: () => Router.go("divineteacher", { id: t.id }) }, [
      H.el("div", { class: "zc-icon", style: "background:radial-gradient(circle at 40% 30%,rgba(201,169,110,.3),rgba(192,0,122,.18))" }, t.icon),
      H.el("div", { class: "zc-body" }, [H.el("div", { class: "zc-title" }, t.name), H.el("div", { class: "zc-desc" }, t.trad + " \u00b7 " + t.blurb)]),
    ])));
    body.appendChild(H.el("div", { class: "nwp-credit", style: "margin-top:12px" }, "AI interpretations offered for contemplation \u2014 not the figures themselves."));
    return {};
  });

  // ── conversation ──
  let voiceOn = false;
  function speak(text) {
    try { if (voiceOn && window.speechSynthesis) { const u = new SpeechSynthesisUtterance(text); u.rate = 0.92; u.pitch = 1.0; speechSynthesis.cancel(); speechSynthesis.speak(u); } } catch (e) {}
  }
  async function ask(teacher, history) {
    try {
      const { data, error } = await SP._sb.functions.invoke("ai-teacher", { body: { teacher: teacher.id, system: teacher.sys, messages: history } });
      if (error || !data || !data.reply) throw error || new Error("no reply");
      return { reply: String(data.reply), live: true };
    } catch (e) { return { reply: pick(teacher.wisdom), live: false }; }
  }

  Router.register("divineteacher", function (root, query) {
    const t = byId(query && query.id); if (!t) { Router.go("divine"); return {}; }
    const voiceBtn = H.el("button", { class: "iconbtn", title: "Divine Voice", onClick: () => { voiceOn = !voiceOn; voiceBtn.classList.toggle("on", voiceOn); if (!voiceOn && window.speechSynthesis) speechSynthesis.cancel(); toast(voiceOn ? "Divine Voice on" : "Divine Voice off"); } }, "\uD83D\uDD0A");
    const bar = topBar({ title: t.name, back: true });
    bar.appendChild(voiceBtn);
    root.appendChild(bar);
    const msgs = H.el("div", { class: "msgs" }); root.appendChild(msgs);
    msgs.appendChild(H.el("div", { class: "day" }, t.trad));
    msgs.appendChild(H.el("div", { class: "row them fresh" }, H.el("div", { class: "bubble" }, "I am here. " + pick(t.wisdom))));

    const input = H.el("textarea", { rows: "1", placeholder: "Speak to " + t.name + "\u2026" });
    const send = H.el("button", { class: "send", onClick: fire }, "\u27a4");
    root.appendChild(H.el("div", { class: "composer" }, [H.el("div", { class: "wrap" }, input), send]));

    const history = [];
    function bubble(text, mine) { const r = H.el("div", { class: "row " + (mine ? "me" : "them") + " fresh" }, H.el("div", { class: "bubble" }, text)); msgs.appendChild(r); msgs.scrollTop = msgs.scrollHeight; return r; }
    async function fire() {
      const text = input.value.trim(); if (!text) return; input.value = "";
      bubble(text, true); history.push({ role: "user", content: text });
      const typing = bubble("\u2026", false);
      const { reply, live } = await ask(t, history);
      typing.firstChild.textContent = reply; history.push({ role: "assistant", content: reply });
      msgs.scrollTop = msgs.scrollHeight; speak(reply);
      if (!live && !fire._warned) { fire._warned = true; toast("Speaking from the tradition. (Live guidance needs the ai-teacher function.)"); }
    }
    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); fire(); } });
    return { teardown() { try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} } };
  });

  window.TEACHERS = TEACHERS;
})();
