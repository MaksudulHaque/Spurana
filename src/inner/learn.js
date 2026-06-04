/* ============================================================
 * SPURANA · inner/learn.js — Spiritual Learning Zone
 * Contemplative topics to study and practice (text from V1).
 * Offered as wisdom to study, not as claims to believe.
 * ============================================================ */
(function () {
  "use strict";
  const TOPICS = [
    ["\uD83E\uDDE0", "Enhancing Mind Ability", "The mind is trained like a muscle. Concentration practices (Trataka, breath-counting) build the capacity to hold a single point. Memory and clarity follow focus. Begin with five minutes of unbroken attention daily \u2014 on the breath, a flame, a sound. The wandering mind, gently returned a thousand times, becomes the steady mind."],
    ["\uD83D\uDD4A", "Knowing Calmness", "Calm is not the absence of feeling \u2014 it is a wide enough space to hold feeling without being swept away. It is built through the body: slow exhales signal safety to the nervous system. The 4-7-8 breath, coherent breathing, and Yoga Nidra all teach the body that it is safe. Calm practiced becomes calm available."],
    ["\uD83C\uDF08", "Activating the Chakras", "The chakra system maps seven centers of energy along the spine, from root (grounding) to crown (transcendence). Each has a color, a seed sound, and a frequency. Activation is awareness plus breath plus sound directed to each center in turn."],
    ["\uD83D\uDD2E", "Telepathy & Mind-to-Mind", "In the contemplative traditions, telepathy is understood less as sending words and more as deep attunement \u2014 the practiced ability to feel another's state. It grows from loving-kindness and from real presence: listening so completely that the gap between two minds narrows. Approach it as profound empathy, cultivated."],
    ["\u2728", "Spiritual Awakening", "Awakening is not a single event but a gradual clarifying \u2014 seeing that you are not only your thoughts, roles, or fears, but the awareness in which all of those appear. It is often quiet, not dramatic. Markers: more presence, less reactivity, a softening of the sense of separation."],
    ["\uD83C\uDF11", "Knowing Your Shadow", "The shadow is everything in you that you have disowned \u2014 desires, angers, fears pushed out of sight. The task is not to indulge or crush them, but to meet them honestly: to look at what you want and what you hide, with curiosity instead of shame. Wholeness is integration, not perfection."],
    ["\u26A1", "Awakening the Nerves", "In yogic understanding, the body is woven with nadis \u2014 channels of subtle energy. Practices like breathwork and body-scan bring awareness flooding through these channels until the body feels alive. Identification softens; awareness feels larger than the form it inhabits. Reached through stillness, never forced."],
    ["\uD83C\uDF20", "The Subtle Journey", "The threshold state \u2014 profound physical relaxation while the mind stays awake \u2014 is described across many traditions. Whether understood as literal travel or a vivid threshold-of-sleep visualization, it is cultivated the same way: deep stillness, no fear, no grasping."],
  ];
  Router.register("learn", function (root) {
    root.appendChild(topBar({ title: "Spiritual Learning", back: true }));
    const body = H.el("div", { class: "pad scroll grow stack reveal" });
    root.appendChild(body);
    body.appendChild(H.el("p", { class: "muted", style: "font-family:var(--f-soul);font-style:italic;font-size:14.5px" },
      "Understanding from the contemplative traditions \u2014 offered as wisdom to study and practice, not as claims to believe."));
    TOPICS.forEach((t) => {
      const text = H.el("div", { class: "learn-body hidden" }, t[2]);
      const arrow = H.el("div", { style: "color:var(--q-bright);font-size:20px" }, "\uFF0B");
      const head = H.el("div", { class: "row", style: "gap:14px;cursor:pointer", onClick: () => { const open = !text.classList.contains("hidden"); text.classList.toggle("hidden", open); arrow.textContent = open ? "\uFF0B" : "\u2212"; } },
        [H.el("div", { class: "zc-icon" }, t[0]), H.el("div", { class: "zc-title", style: "flex:1" }, t[1]), arrow]);
      body.appendChild(H.el("div", { class: "card" }, [head, text]));
    });
    return {};
  });
})();
