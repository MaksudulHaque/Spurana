/* ============================================================
 * SPURANA · practice/library.js — ALL practices, one module.
 * Data-driven so it upgrades per need: add a line to LIB and a
 * new guided practice appears. Categories: meditation, heart,
 * couple, awakening. A shared guided player runs timed phases
 * and logs to hc_logs (solo) or cp_logs (couple). Breath &
 * Metta route to their dedicated interactive engines.
 * ============================================================ */
(function () {
  "use strict";

  // each guided practice: { id, t:title, i:icon, d:desc, kind, log, phases:[[text,seconds]...] }
  const LIB = {
    meditation: [
      { id: "silence", t: "Sit in Silence", i: "\uD83E\uDDD8", d: "Open stillness \u2014 bells at start, middle, end.", kind: "silence", sound: "bowls", defMin: 10, log: "hc_logs" },
      { id: "breath", t: "Breathing", i: "\uD83C\uDF2C", d: "Guided breath patterns.", kind: "breath" },
      { id: "metta", t: "Loving-Kindness", i: "\uD83D\uDC97", d: "Send warmth outward.", kind: "metta" },
      { id: "stillness", t: "Stillness", i: "\uD83E\uDDD8", d: "Rest as awareness itself.", kind: "guided", sound: "om", log: "hc_logs", defMin: 8,
        phases: [["Sit. Let the body settle.", 20], ["Notice the breath, without changing it.", 45], ["When a thought arises, gently return.", 60], ["Rest as the space in which all of this appears.", 60], ["Slowly return.", 12]] },
      { id: "bodyscan", t: "Body Scan", i: "\u2728", d: "Awareness through the body.", kind: "guided", sound: "bowls", log: "hc_logs", defMin: 8,
        phases: [["Bring attention to the crown of your head.", 25], ["Let it flow down the face, the throat, the chest.", 45], ["Through the arms, the belly, the hips.", 45], ["Down the legs, to the soles of the feet.", 45], ["Feel the whole body, alive and held.", 30]] },
      { id: "soham", t: "So-Ham", i: "\uD83D\uDD49", d: "The breath that says 'I am'.", kind: "guided", sound: "om", log: "hc_logs", defMin: 8,
        phases: [["Inhale, and hear 'So'.", 40], ["Exhale, and hear 'Ham'.", 40], ["So\u2026 Ham\u2026 let it breathe you.", 80], ["Dissolve the words. Just being.", 40]] },
      { id: "nidra", t: "Yoga Nidra", i: "\uD83C\uDF19", d: "Conscious deep rest.", kind: "guided", sound: "choir", log: "hc_logs", defMin: 15,
        phases: [["Lie down. Let the body grow heavy.", 30], ["You are about to rest while staying awake.", 30], ["Sink, but keep a thread of awareness.", 90], ["The body sleeps; awareness remains.", 60], ["Gently stir.", 15]] },
      { id: "vipassana", t: "Vipassana", i: "\uD83D\uDC41", d: "Insight \u2014 seeing things as they are.", kind: "guided", sound: "bowls", log: "hc_logs", defMin: 12,
        phases: [["Sit upright. Let the eyes close. Simply arrive.", 30], ["Rest attention on the breath at the nostrils \u2014 the bare sensation of air.", 60], ["Now scan the body slowly, part by part, noticing sensation without reacting.", 90], ["Whatever arises \u2014 an itch, an ache, a calm \u2014 watch it rise, and watch it pass.", 90], ["See how every sensation is impermanent. Nothing stays.", 60], ["Rest in bare awareness. Only knowing remains.", 40]] },
      { id: "chakra", t: "Chakra Awakening", i: "\uD83C\uDF08", d: "The seven centres, base to crown.", kind: "guided", sound: "om", log: "hc_logs", defMin: 14,
        phases: [["Sit tall, spine like a rising stem. Breathe into its base \u2014 Muladhara, deep red. Feel your ground.", 70], ["Rise to the sacral centre below the navel \u2014 Svadhisthana, orange. Let feeling flow.", 60], ["To the solar plexus \u2014 Manipura, gold. Your will, your warmth, your inner fire.", 60], ["To the heart \u2014 Anahata, green. Let it soften and open.", 70], ["To the throat, blue; the brow, indigo \u2014 your truth, and your seeing.", 70], ["To the crown \u2014 Sahasrara, violet light. The whole column alight. Rest in the glow.", 60]] },
      { id: "kundalini", t: "Kundalini Awareness", i: "\uD83D\uDC0D", d: "The serpent energy rising.", kind: "guided", sound: "tanpura", log: "hc_logs", defMin: 12,
        phases: [["Sit with a straight spine. Breathe slow and full.", 40], ["Imagine a coiled light resting at the base of the spine.", 60], ["With each inhale, invite it to stir \u2014 gently, without force.", 80], ["Feel warmth begin to rise, vertebra by vertebra.", 80], ["Let it climb toward the crown, unhurried.", 70], ["Rest in the current. Let it settle on its own.", 40]] },
      { id: "astral", t: "The Boundless Visualization", i: "\u2728", d: "A journey beyond the edges of the body.", kind: "guided", sound: "choir", log: "hc_logs", defMin: 15,
        phases: [["Lie or sit. Let the body grow heavy and still.", 40], ["Feel the edges of the body soften, less and less defined.", 70], ["Imagine awareness lifting, weightless, just above you.", 90], ["Expand outward \u2014 the room, the sky, the dark between the stars.", 90], ["You are vast, boundless, held by everything.", 60], ["Slowly, gently, return to the weight of the body.", 40]] },
    ],
    heart: [
      { id: "open_heart", t: "Opening the Heart", i: "\uD83D\uDC9E", d: "Soften what's guarded.", kind: "guided", sound: "choir", log: "hc_logs", defMin: 8,
        phases: [["Place a hand on your heart.", 25], ["Breathe into the warmth beneath it.", 45], ["Recall a moment you felt truly loved.", 60], ["Let that feeling fill the chest.", 45], ["Carry it with you.", 12]] },
      { id: "forgive_self", t: "Self-Forgiveness", i: "\uD83C\uDF15", d: "Lay down a weight.", kind: "guided", sound: "choir", log: "hc_logs", defMin: 6,
        phases: [["Name, gently, what you carry.", 40], ["Say: I did what I knew then.", 40], ["Say: I am allowed to grow.", 40], ["Let the shoulders drop.", 30]] },
    ],
    couple: [
      { id: "sync_breath", t: "Synced Breathing", i: "\uD83E\uDEC1", d: "Breathe as one.", kind: "guided", sound: "flute", log: "cp_logs", defMin: 8,
        phases: [["Sit facing each other.", 20], ["Find their rhythm. Match your breath to theirs.", 60], ["Inhale together\u2026 exhale together.", 90], ["Feel the single rhythm between you.", 60], ["Rest in it.", 15]] },
      { id: "gratitude_x", t: "Gratitude Exchange", i: "\uD83C\uDF1F", d: "Speak what you treasure.", kind: "guided", sound: "choir", log: "cp_logs", defMin: 6,
        phases: [["Take turns. One speaks, one receives.", 25], ["Tell them one thing you're grateful for.", 60], ["Now switch. Receive without deflecting.", 60], ["Let it land in you both.", 25]] },
      { id: "gazing", t: "Eye Gazing", i: "\uD83D\uDC41", d: "Be seen, and see.", kind: "guided", sound: "tanpura", log: "cp_logs", defMin: 6,
        phases: [["Sit close. Soften your gaze into theirs.", 30], ["Let it be awkward, then let it settle.", 60], ["Breathe. There is nothing to perform.", 90], ["Offer a small smile.", 20]] },
      { id: "appreciations", t: "Three Appreciations", i: "\uD83D\uDC91", d: "End the day in praise.", kind: "guided", sound: "choir", log: "cp_logs", defMin: 5,
        phases: [["Each name three things about the other today.", 30], ["Be specific. Small is sacred.", 70], ["Thank them for hearing you.", 20]] },
    ],
    awakening: [
      { id: "presence", t: "Pure Presence", i: "\u2728", d: "Drop into now.", kind: "guided", sound: "om", log: "hc_logs", defMin: 8,
        phases: [["What is here, right now, before thought?", 40], ["Sounds. Sensation. The fact of being.", 50], ["You are the awareness, not the content.", 60], ["Rest as that.", 30]] },
      { id: "witness", t: "The Witness", i: "\uD83D\uDC41", d: "Watch the watcher.", kind: "guided", sound: "bowls", log: "hc_logs", defMin: 8,
        phases: [["Notice a thought arise.", 35], ["Now notice what noticed it.", 50], ["Can you find the edge of awareness?", 60], ["Abide where there is no edge.", 35]] },
      { id: "atma_vichara", t: "Self-Inquiry", i: "\uD83E\uDE94", d: "Who am I? \u2014 the path of Ramana.", kind: "guided", sound: "tanpura", log: "hc_logs", defMin: 12,
        phases: [["Sit quietly. Ask, silently: who am I?", 50], ["Not the body, not the thoughts \u2014 who is it that watches them?", 80], ["Each time a thought arises, ask: to whom does this come? To me. And who am I?", 90], ["Trace the sense of 'I' back to its source. Rest where it dissolves.", 60]] },
      { id: "shadow", t: "Meeting the Shadow", i: "\uD83C\uDF11", d: "Befriend what you have disowned.", kind: "guided", sound: "voidd", log: "hc_logs", defMin: 12,
        phases: [["Settle. Bring to mind a trait in others that disturbs you.", 50], ["Breathe. Ask gently: where does this live in me, too?", 80], ["Do not judge what you find. Meet it as a frightened part of you.", 80], ["Offer it understanding. Let it be seen, and soften.", 60]] },
      { id: "parts", t: "Parts Work", i: "\uD83E\uDDE9", d: "Turn toward the parts of you.", kind: "guided", sound: "choir", log: "hc_logs", defMin: 12,
        phases: [["Close the eyes. Notice a part of you that is loud today \u2014 anxious, critical, sad.", 50], ["Turn toward it with curiosity, not war. Ask what it wants for you.", 80], ["Thank it for trying, all this time, to protect you.", 70], ["Let it relax, knowing you are here, leading with calm.", 60]] },
      { id: "muraqaba", t: "Heart Watching", i: "\uD83D\uDD4C", d: "Sufi muraqaba \u2014 silent communion.", kind: "guided", sound: "ney", log: "hc_logs", defMin: 12,
        phases: [["Rest your attention in the centre of the chest.", 50], ["Imagine the divine gaze resting gently upon your heart.", 80], ["Be watched, and watch \u2014 a wordless communion.", 80], ["Dissolve into the warmth. Only presence remains.", 60]] },
      { id: "sedona", t: "The Release", i: "\uD83C\uDF43", d: "Could I let this go? Could I, now?", kind: "guided", sound: "bowls", log: "hc_logs", defMin: 10,
        phases: [["Bring to mind something you are holding \u2014 a worry, a wanting.", 40], ["Ask: could I let this go? Could I, just for now?", 70], ["Ask: would I? And when? Why not now?", 70], ["Let it go. Feel the space that opens. Repeat with whatever returns.", 60]] },
      { id: "breathwork", t: "Conscious Breathwork", i: "\uD83C\uDF2C", d: "Let the breath move what is held.", kind: "guided", sound: "samudra", log: "hc_logs", defMin: 12,
        phases: [["Breathe a little fuller than usual, in and out, with no pause between.", 50], ["Keep a soft, circular rhythm. Let feeling begin to rise.", 90], ["Whatever surfaces \u2014 let it move through you, on the breath.", 90], ["Now slow the breath. Rest. Let the body integrate.", 60]] },
      { id: "maranasati", t: "Death Awareness", i: "\uD83C\uDF11", d: "Maranasati \u2014 the clarifying truth.", kind: "guided", sound: "voidd", log: "hc_logs", defMin: 10,
        phases: [["Sit. Breathe. Remember, gently: this life will end.", 50], ["Not morbid \u2014 clarifying. In this light, what truly matters?", 80], ["Let the small worries fall away.", 70], ["Return to this breath, more alive for having remembered.", 60]] },
      { id: "hesychasm", t: "Prayer of the Heart", i: "\u271D\uFE0F", d: "A sacred word, breathed into the heart.", kind: "guided", sound: "choir", log: "hc_logs", defMin: 12,
        phases: [["Rest attention in the heart. Breathe slowly.", 50], ["On the inhale, a sacred word or name. On the exhale, let it settle deeper.", 90], ["Let the words grow quiet, their meaning remaining.", 70], ["Abide in the stillness of the heart.", 60]] },
      { id: "koan", t: "The Koan", i: "\u2753", d: "A question with no answer, to open you.", kind: "guided", sound: "mandir", log: "hc_logs", defMin: 10,
        phases: [["Hold this question \u2014 not for an answer: what was your face before your parents were born?", 60], ["Do not think it through. Let it sit in you, unsolved.", 90], ["When the mind grasps for an answer, release. Return to the question.", 80], ["Rest in not-knowing. That openness is the point.", 60]] },
    ],
    world: [
      { id: "zazen", t: "Zazen (Japan)", i: "\u26E9\uFE0F", d: "Zen seated meditation \u2014 just sitting.", kind: "guided", sound: "bowls", log: "hc_logs", defMin: 10,
        phases: [["Sit. Hands in the cosmic mudra, eyes soft and low.", 40], ["Breathe naturally. Count each exhale, one to ten, then begin again.", 90], ["When the count is lost, simply begin again. There is no failure here.", 90], ["Let thoughts pass like clouds \u2014 do not follow, do not push away.", 80], ["Just sitting. Nothing to attain.", 60]] },
      { id: "taiji", t: "Qi Flow (China)", i: "\u262F\uFE0F", d: "Taoist microcosmic orbit.", kind: "guided", sound: "flute", log: "hc_logs", defMin: 11,
        phases: [["Sit, tongue lightly to the palate, breath slow.", 40], ["On the inhale, draw warm energy up the spine to the crown.", 80], ["On the exhale, let it flow down the front, to the navel.", 80], ["Circle it \u2014 up the back, down the front \u2014 a gentle orbit.", 90], ["Let the circle turn on its own. Rest in the flow.", 50]] },
      { id: "tonglen", t: "Tonglen (Tibet)", i: "\uD83C\uDFD4\uFE0F", d: "Giving and taking, breath by breath.", kind: "guided", sound: "bowls", log: "hc_logs", defMin: 10,
        phases: [["Settle. Breathe evenly.", 30], ["On the inhale, breathe in suffering \u2014 yours, or another's \u2014 as warm dark smoke.", 80], ["On the exhale, breathe out relief, coolness, light.", 80], ["Take in pain; send out ease. Breath after breath.", 80], ["Widen it \u2014 to all who suffer as you do.", 60], ["Rest, heart softened.", 30]] },
    ],
    pranayama: [
      { id: "box", t: "Box Breathing", i: "\uD83D\uDFE6", d: "Equal four-count breath \u2014 calm under pressure.", kind: "guided", sound: "flute", log: "hc_logs", defMin: 4,
        phases: [["Sit tall. We breathe in equal counts of four.", 25], ["Inhale\u2026 two, three, four.", 30], ["Hold\u2026 two, three, four.", 30], ["Exhale\u2026 two, three, four.", 30], ["Hold empty\u2026 two, three, four. And again.", 60], ["Let the square breathe you. Calm and steady.", 45]] },
      { id: "b478", t: "4-7-8 Breath", i: "\uD83C\uDF19", d: "The natural tranquiliser for the nerves.", kind: "guided", sound: "flute", log: "hc_logs", defMin: 5,
        phases: [["Rest the tip of the tongue behind the upper teeth.", 20], ["Inhale through the nose for four.", 25], ["Hold for seven.", 35], ["Exhale through the mouth for eight, softly.", 40], ["Again \u2014 four in, seven hold, eight out.", 70], ["Feel the nervous system settle.", 30]] },
      { id: "nadi", t: "Nadi Shodhana", i: "\u262F\uFE0F", d: "Alternate nostril \u2014 balancing the channels.", kind: "guided", sound: "flute", log: "hc_logs", defMin: 6,
        phases: [["Rest the right thumb and ring finger near the nostrils.", 25], ["Close the right; inhale through the left.", 35], ["Close the left; exhale right. Then inhale right.", 45], ["Close the right; exhale left. That is one round.", 45], ["Continue, smooth and slow, balancing the two channels.", 70], ["Release the hand. Breathe freely. Feel the balance.", 30]] },
      { id: "ujjayi", t: "Ujjayi Ocean Breath", i: "\uD83C\uDF0A", d: "The victorious breath, sound of the inner sea.", kind: "guided", sound: "samudra", log: "hc_logs", defMin: 5,
        phases: [["Breathe through the nose, mouth gently closed.", 25], ["Narrow the throat softly, as if fogging a mirror from within.", 45], ["Hear the soft ocean sound on the inhale.", 50], ["And on the exhale \u2014 the tide drawing back.", 50], ["Let the sound carry you, wave after wave.", 60]] },
      { id: "kapal", t: "Kapalabhati", i: "\uD83D\uDD25", d: "Skull-shining breath \u2014 the inner fire.", kind: "guided", sound: "tanpura", log: "hc_logs", defMin: 3,
        phases: [["Sit tall. A passive inhale, then a sharp exhale from the belly.", 30], ["Short, rhythmic exhales \u2014 the belly pulses.", 60], ["Let each inhale happen on its own between pulses.", 60], ["Find a steady, light rhythm. Never strain.", 50], ["Stop. Breathe normally. Feel the bright, clear space.", 40]] },
    ],
  };
  function find(id) { for (const k in LIB) { const m = LIB[k].find((p) => p.id === id); if (m) return m; } return null; }

  function listScreen(name, title, cats, sub) {
    Router.register(name, function (root) {
      root.appendChild(topBar({ title: title, back: true }));
      const body = H.el("div", { class: "pad scroll grow stack reveal" });
      root.appendChild(body);
      if (sub) body.appendChild(H.el("p", { class: "center", style: "font-family:var(--f-soul);font-style:italic;color:var(--text-dim)" }, sub));
      cats.forEach((cat) => (LIB[cat] || []).forEach((p) => {
        body.appendChild(H.el("button", { class: "zone-card", onClick: () => {
          if (p.kind === "breath") return Router.go("breathe");
          if (p.kind === "metta") return Router.go("metta");
          Router.go("practice", { id: p.id });
        } }, [
          H.el("div", { class: "zc-icon" }, p.i),
          H.el("div", { class: "zc-body" }, [H.el("div", { class: "zc-title" }, p.t), H.el("div", { class: "zc-desc" }, p.d)]),
        ]));
      }));
      return {};
    });
  }
  listScreen("meditation", "Meditation Zone", ["meditation", "awakening"], "Guided journeys for the solitary soul.");
  listScreen("heart", "Heart-Centred", ["heart"], "Rituals to open and mend the heart.");
  listScreen("couple", "Couple Practices", ["couple"], "Done together, two as one.");

  // ── every practice runs through the shared Guide engine ──
  Router.register("practice", function (root, query) {
    var p = find(query && query.id);
    if (!p) { Router.go("meditation"); return {}; }
    root.appendChild(topBar({ title: p.t, back: true }));
    return Guide.mount(root, {
      title: p.t,
      sound: p.sound || "cosmos",
      defaultMin: p.defMin || 5,
      silence: p.kind === "silence",
      phases: p.phases || [],
      log: p.log,
      getConv: function () { return APP.activeConv; },
    });
  });

  // ── ANTARYATRA — the seven-stage inner pilgrimage (restored from V1) ──
  // phase = [prompt(shown), baseSeconds, voice(narrated), question(reflection)]
  var ANTARYATRA = [
    ["Sit. Settle into your body. Feel the weight of your hands. The pilgrimage begins not when you move, but when you arrive.", 120,
     "Welcome, traveller. The journey begins here, with the simple act of arriving in your own skin.",
     "What did you bring with you? What did you leave at the door?"],
    ["Your breath is a bridge between worlds. The outer world fades on the inhale. The inner world opens on the exhale. Cross slowly.", 120,
     "Breathe deeply now. Each breath is a step. The world outside grows distant. The world within draws near.",
     "On this side of the bridge, what grows quiet? What grows clearer?"],
    ["Step into the chamber of your heart. Light a candle in its centre. Sit on the floor. Whatever has been waiting here, let it speak.", 120,
     "You enter the heart chamber now. Sacred. Tender. You are safe here. What waits for you?",
     "What is the heart holding that you have been refusing to see?"],
    ["Walk through the forest of your memories. Do not stop at any one tree. Just notice which ones bloom in late season, and which stand bare.", 130,
     "The memory forest is vast. Walk among the trees. Some bloom. Some are winter-stripped. Both are sacred.",
     "Which memory tugged at your sleeve, asking to be held one more time?"],
    ["Descend now into the ocean within. Do not fear the depth. Things live here that have always loved you. You are not alone in your own darkness.", 130,
     "Down now. Into the deep. Trust the descent. What lives here is part of you. It has been waiting.",
     "What feeling rose from the deep, that you usually keep buried?"],
    ["Now meet yourself. Not the role. Not the mask. The witness behind your own eyes. Sit across from them. Look without flinching.", 130,
     "Here, you meet yourself. The one behind all the others. They have been waiting longer than you know.",
     "What did they want to tell you, that no one else has been able to?"],
    ["Begin the journey back now. Carry only what is yours. Leave what you released. Move slowly upward, toward the world. The threshold approaches.", 130,
     "Now the return. Slowly. Gently. Carry what you found. The world is waiting, but unhurried. You are different now.",
     "What is one word you bring back with you?"],
  ];
  var ATR_STAGES = [
    { name: "Prarambha · The Beginning", icon: "🌑", color: "#E2C28A", visual: "breath", sound: "om" },
    { name: "Shvasa-Setu · Bridge of Breath", icon: "🌒", color: "#E8009A", visual: "bridge", sound: "flute" },
    { name: "Hridayasthala · The Heart Place", icon: "🌓", color: "#FF6088", visual: "heart", sound: "choir" },
    { name: "Smriti-Vana · Memory Forest", icon: "🌔", color: "#A8D8B9", visual: "forest", sound: "bowls" },
    { name: "Antar-Sagar · The Inner Ocean", icon: "🌕", color: "#5B8FB9", visual: "ocean", sound: "samudra" },
    { name: "Atmadarshan · The Soul Witness", icon: "🌖", color: "#C9A96E", visual: "mirror", sound: "tanpura" },
    { name: "Punaragama · The Return", icon: "🌗", color: "#FFD480", visual: "rise", sound: "choir" },
  ];
  Router.register("antaryatra", function (root) {
    root.appendChild(topBar({ title: "Antaryatra", back: true }));
    return Guide.mount(root, {
      title: "Antaryatra · Inner Pilgrimage",
      sound: "cosmos", defaultMin: 14, minutes: [7, 10, 14, 20, 30],
      phases: ANTARYATRA, stages: ATR_STAGES, log: "hc_logs",
    });
  });

  window.PRACTICE_LIB = LIB;
})();
