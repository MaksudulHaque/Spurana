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
        phases: [["Let the body find its seat. Nothing to fix, nowhere to be.", 18, "Welcome. Let yourself arrive — the body settling like silt drifting slowly to the floor of still water.", "Feel the places that touch the ground."], ["Soften the face — the brow, the jaw, the throat.", 22, "Soften the face now. The space between the eyebrows, the hinge of the jaw, the small muscles around the eyes. Let them be heavy.", "Unclench. Let your face be kind."], ["Find the breath where it already is. Do not change it.", 30, "Find the breath exactly as it is. You needn't deepen or slow it. Only feel it, arriving and leaving on its own.", "Where do you feel the breath most clearly?"], ["Thoughts will come. Let them pass like weather across a wide sky.", 36, "A thought arrives — that is alright. You don't have to chase it or push it away. Watch it drift, and let it go.", "Notice one thought. Now let it dissolve."], ["Each time you wander, return — gently, without blame.", 40, "The moment you notice you've drifted, that noticing is the whole practice. Come home softly, again and again.", "Returning is the practice, not failing."], ["Now rest as the space in which all of this appears.", 44, "Let go of holding anything at all. Rest as the open space in which every sound, sensation and thought simply comes and goes.", "You are the sky, not the weather."], ["Stay. Be the stillness that was here before you arrived.", 40, "Simply be here. This stillness beneath everything was here long before you sat. Let it hold you now.", ""], ["Slowly let the breath deepen. Begin to return.", 12, "Gently now, let the breath grow a little fuller. Begin to come back, carrying the quiet with you.", "Bring this calm into what comes next."]] },
      { id: "bodyscan", t: "Body Scan", i: "\u2728", d: "Awareness through the body.", kind: "guided", sound: "bowls", log: "hc_logs", defMin: 8,
        phases: [["Lie or sit. Let the whole body grow heavy and supported.", 18, "Let the body be completely held by what's beneath it. You don't have to carry yourself for these minutes.", "Let the ground take your full weight."], ["Bring soft attention to the crown of your head.", 22, "Rest your attention gently on the very top of your head. Feel whatever is there — warmth, tingling, or nothing at all.", "Just notice. Nothing to change."], ["Let it flow down — the face, the throat, the shoulders.", 34, "Let attention move down like warm water — over the face, softening it; down the throat; spreading across the shoulders.", "Feel the shoulders drop away from the ears."], ["Down through the arms, to the palms and fingertips.", 34, "Down through the arms now, all the way to the hands. Feel the palms, and the faint pulse in the fingertips.", "Can you feel your own heartbeat there?"], ["Into the chest and belly, rising and falling with breath.", 36, "Rest in the chest and the belly, moving with each breath. Let this whole centre soften and open.", "Feel the breath rock the body, gently."], ["Down through the hips, the legs, to the soles of the feet.", 36, "Let it pour down through the hips and the legs, all the way to the soles of the feet, where you meet the earth.", "Feel the feet, heavy and alive."], ["Now feel the whole body at once — alive, and held.", 40, "Now hold the entire body in one soft awareness — every part glowing faintly, alive, and completely held.", "One body. One breath. Whole."], ["Rest here a moment, then gently return.", 12, "Stay in this wholeness a little longer. Then, when you're ready, let the breath deepen and return.", "Carry this body-warmth with you."]] },
      { id: "soham", t: "So-Ham", i: "\uD83D\uDD49", d: "The breath that says 'I am'.", kind: "guided", sound: "om", log: "hc_logs", defMin: 8, breath: [5, 1, 6, 1],
        phases: [["Settle. Let the breath find a slow, natural rhythm.", 20, "Let the breath slow on its own, like a tide finding its pace. There is nothing to force.", "Let the breath lengthen by itself."], ["On the inhale, silently hear the sound 'So'.", 40, "As the breath flows in, let it carry one silent sound — Soooo. Don't say it; simply hear it arrive with the air.", "Inhale … Sooo."], ["On the exhale, silently hear 'Ham'.", 40, "As the breath leaves, hear its answer — Hummm. The two sounds are the breath's own quiet song.", "Exhale … Hummm."], ["So … Ham … let the breath breathe you.", 70, "So … Ham … So … Ham. You are not making this happen. Let the breath, and its sound, breathe you.", "'So-Ham' — 'I am That.'"], ["Let the sounds soften until only their meaning remains.", 44, "Let the words grow fainter and fainter, until only the quiet sense of being remains, with no sound at all.", "Stay with the feeling beneath the words."], ["Dissolve the words. Just being.", 30, "Let even the meaning go. What's left is simply you, here, breathing, being. Rest in that.", ""], ["Gently return, carrying the quiet.", 12, "Slowly return. Let the breath deepen, and carry this simple sense of being into your day.", "I am. That is enough."]] },
      { id: "nidra", t: "Yoga Nidra", i: "\uD83C\uDF19", d: "Conscious deep rest.", kind: "guided", sound: "tanpura", log: "hc_logs", defMin: 15, breath: [4, 2, 8, 2],
        phases: [["Lie down. Let the body become completely still.", 24, "Lie back and let the body grow still — stiller than sleep, while you stay softly awake. You are safe to let go.", "Make one last adjustment, then be still."], ["Set a gentle intention — a single, quiet wish.", 26, "In a few soft words, plant one intention in the heart — a wish for yourself. Say it once, then release it.", "Whisper your wish, once, inwardly."], ["Let the body grow heavy, part by part.", 60, "Feel the right hand grow heavy … the left … both arms … the legs … the whole body sinking, warm and weightless.", "Let each part grow too heavy to lift."], ["You are about to rest while staying awake.", 40, "This is the threshold of sleep — but you will stay here, awake and aware, floating on the very edge.", "Keep one thread of awareness lit."], ["Sink deeper, but keep a single thread of awareness.", 80, "Sink further into the warmth and the dark. Let everything go — except the faint knowing that you are still here.", "The body sleeps; you remain."], ["The body sleeps; awareness remains, clear and quiet.", 60, "The body has gone to sleep, and yet awareness has not. Rest as that quiet light that never closes its eyes.", "Notice: you are aware of resting."], ["Gently call yourself back. Begin to stir.", 18, "Slowly, begin to return. Deepen the breath. Feel the fingers, the toes. Carry this deep rest back with you.", "Wiggle the fingers. Welcome back."]] },
      { id: "vipassana", t: "Vipassana", i: "\uD83D\uDC41", d: "Insight \u2014 seeing things as they are.", kind: "guided", sound: "bowls", log: "hc_logs", defMin: 12,
        phases: [["Sit upright. Let the eyes close. Simply arrive.", 24, "Sit with a straight, easy spine. Let the eyes close, and simply arrive in this moment, just as it is.", "Feel the body sitting, right now."], ["Rest attention at the nostrils — the bare touch of air.", 50, "Bring attention to the rim of the nostrils, and feel the bare sensation of air — cool coming in, warm going out.", "Feel only the touch of the breath."], ["Now scan the body slowly, part by part.", 70, "Begin to sweep attention slowly through the body, from the crown to the toes, meeting each part with bare attention.", "Move slowly. Miss nothing."], ["Whatever arises — an itch, an ache, a calm — just observe.", 70, "When something calls — an itch, a tension, a pleasant warmth — don't move to fix it. Simply observe it, exactly as it is.", "Observe without reacting."], ["Watch each sensation rise — and watch it pass.", 60, "Notice how nothing stays. Each sensation swells, peaks, and fades. You are watching impermanence itself, moment by moment.", "Rise … and pass. Nothing holds."], ["See how all of it is changing. Nothing is solid.", 50, "See it clearly: the body, the breath, the mind — all of it flowing, never fixed. This seeing is insight.", "Everything moves. Even 'you'."], ["Rest in bare awareness. Only knowing remains.", 40, "Let go of the scanning now. Rest as the simple knowing that was watching all along — silent, clear, at ease.", "Just knowing. Just this."]] },
      { id: "chakra", t: "Chakra Awakening", i: "\uD83C\uDF08", d: "The seven centres, base to crown.", kind: "guided", sound: "om", log: "hc_logs", defMin: 14,
        phases: [["Sit tall, the spine like a rising stem of light.", 24, "Let the spine rise tall and soft, like a stem growing toward light. We will climb it, centre by centre.", "Imagine a thread lifting the crown."], ["Root — Muladhara, deep red, at the base. Feel your ground.", 60, "Breathe into the base of the spine — Muladhara, glowing deep red. This is your root, your safety, your ground.", "I am safe. I am here."], ["Sacral — Svadhisthana, orange, below the navel.", 54, "Rise to the centre below the navel — Svadhisthana, warm orange. Let feeling and creativity flow freely here.", "Let feeling move, like water."], ["Solar plexus — Manipura, gold. Your inner fire.", 54, "Up to the solar plexus — Manipura, bright gold. Your will, your warmth, your quiet strength. Feel it glow.", "Feel your own steady power."], ["Heart — Anahata, green. Let it soften and open.", 60, "Rest at the heart — Anahata, soft green. Let it open like a flower, without fear. This is where you love.", "Breathe the heart open."], ["Throat indigo brow — your truth, and your seeing.", 60, "Rise to the throat, glowing blue — your truth; and the brow, deep indigo — your inner sight. Let both grow clear.", "Speak true. See clearly."], ["Crown — Sahasrara, violet light. The whole column alight.", 54, "Reach the crown — Sahasrara, violet and white, opening to the sky. The whole column of you is alight now.", "Feel the whole spine glowing."], ["Rest in the glow of all seven, humming as one.", 30, "Let all seven centres hum together, a single ladder of light. Rest in the whole of it, complete.", "One light, root to crown."]] },
      { id: "kundalini", t: "Kundalini Awareness", i: "\uD83D\uDC0D", d: "The serpent energy rising.", kind: "guided", sound: "tanpura", log: "hc_logs", defMin: 12,
        phases: [["Sit with a straight spine. Breathe slow and full.", 30, "Sit tall and breathe slowly, fully. We are going to invite a sleeping warmth to wake — gently, never by force.", "Long, full breaths. No strain."], ["Imagine a coiled light resting at the base of the spine.", 50, "Picture a coil of soft light asleep at the very base of the spine, patient and waiting. Just see it there.", "Rest your attention at the base."], ["With each inhale, invite it to stir.", 70, "With each slow inhale, gently invite that light to stir — not pulling, only welcoming. Warmth begins to wake.", "Invite, don't force."], ["Feel warmth begin to rise, vertebra by vertebra.", 70, "Feel a gentle heat climbing, one vertebra at a time, like dawn moving up a wall. Let it take its time.", "Follow the warmth as it climbs."], ["Let it rise toward the crown, unhurried.", 60, "Let the rising warmth move toward the crown, opening each centre it passes. Stay soft, stay curious.", "Keep the body relaxed as it rises."], ["Rest in the current. Let it settle on its own.", 40, "Now stop guiding it. Rest in the living current you've woken, and let it settle wherever it wishes.", "Let it find its own level."], ["Seal the practice. Breathe normally, and ground.", 16, "Take a few normal breaths. Feel the feet, the seat. Let the energy settle quietly within you.", "Feel grounded, calm, awake."]] },
      { id: "astral", t: "The Boundless Visualization", i: "\u2728", d: "A journey beyond the edges of the body.", kind: "guided", sound: "cosmos", log: "hc_logs", defMin: 15,
        phases: [["Lie or sit. Let the body grow heavy and still.", 30, "Let the body settle completely, heavy and still. For these minutes, you may set it down like a coat at the door.", "Let the body become quiet."], ["Feel the edges of the body soften and blur.", 60, "Notice the outline of the body — then let it blur. Where exactly does 'you' end and the air begin? Let the border soften.", "Let your edges grow vague."], ["Imagine awareness lifting, weightless, just above you.", 80, "Imagine your awareness floating up, light as warm smoke, hovering gently just above the resting body.", "Float. Nothing holds you down."], ["Expand outward — the room, the sky, the dark between stars.", 80, "Now widen — beyond the room, beyond the rooftops, up past the clouds, into the vast quiet dark between the stars.", "Keep expanding. There is no edge."], ["You are vast, boundless, and held by everything.", 60, "Feel how large you've become — spacious, boundless, and yet completely held by the whole of it. You belong to all of it.", "You are vast. You are held."], ["Begin to gather, slowly returning toward the body.", 50, "Slowly begin to draw the vastness back in, gathering yourself, drifting gently down toward the waiting body.", "Drift home, unhurried."], ["Return fully. Feel the weight, the breath, the ground.", 24, "Settle back fully into the body. Feel its comforting weight, the breath, the ground. You carry the vastness inside now.", "Welcome back. You are larger now."]] },
    ],
    heart: [
      { id: "open_heart", t: "Opening the Heart", i: "\uD83D\uDC9E", d: "Soften what's guarded.", kind: "guided", sound: "choir", log: "hc_logs", defMin: 8,
        phases: [["Place one hand over the centre of your chest.", 22, "Bring a hand to rest over the heart. Feel its warmth, and the faint, faithful beating beneath your palm.", "Feel your own heartbeat under your hand."], ["Breathe into the warmth beneath your hand.", 34, "Let each breath flow into that warmth, as if the chest could breathe directly. Let it widen, just a little.", "Breathe into your hand."], ["Recall a moment you felt truly, simply loved.", 50, "Call back one moment when you felt completely loved — a face, a place, a touch. Let it grow vivid and near.", "Who comes to mind? Let them be here."], ["Let that feeling fill the chest and brim over.", 46, "Let the warmth of that memory swell in the chest until it brims, soft and golden, filling more than your body.", "Let the warmth overflow."], ["Now turn it gently toward yourself.", 44, "Now let some of that love turn back toward you — the one breathing here. You, too, deserve this tenderness.", "Offer yourself the same love."], ["Let the guard you didn't know you held soften.", 40, "Notice any armour around the heart, and let it loosen — not torn away, just quietly set down. You are safe.", "Let something guarded soften."], ["Carry this open warmth with you.", 14, "Let the hand rest a moment more. Then carry this open, unguarded warmth gently into the rest of your day.", "Keep the heart this open."]] },
      { id: "forgive_self", t: "Self-Forgiveness", i: "\uD83C\uDF15", d: "Lay down a weight.", kind: "guided", sound: "choir", log: "hc_logs", defMin: 7,
        phases: [["Settle, and let one weight you carry come to mind.", 30, "Breathe, and let one thing you've been carrying rise gently — a regret, a harshness toward yourself. Just name it softly.", "Name, gently, what you carry."], ["Meet it without flinching, the way you'd meet a child.", 40, "Look at it the way you'd look at a frightened child — not with judgement, but with patience and a wish to understand.", "Soften your gaze toward yourself."], ["Say, inwardly: I did what I knew, with what I had.", 40, "Say it inwardly, and mean it kindly: I did what I knew how to do then, with what I had then. That is human.", "Inhale: 'I did what I knew.'"], ["Say: I am allowed to learn, and to grow.", 40, "And now: I am allowed to have learned. I am allowed to grow. The person who erred is not the whole of me.", "Exhale: 'I am allowed to grow.'"], ["Feel the weight grow lighter in your hands.", 40, "Feel the thing you've carried grow lighter, as if you could finally open your hands and let some of it go.", "Let your hands, and shoulders, drop."], ["Offer yourself the forgiveness you'd give a friend.", 36, "Give yourself the same forgiveness you would offer a dear friend without a second thought. You have earned it too.", "Forgive yourself, as you would a friend."], ["Rest, lighter. Carry the mercy forward.", 14, "Rest a moment in this lightness. Then carry this mercy with you — it is yours to keep.", "Walk on, a little lighter."]] },
    ],
    couple: [
      { id: "sync_breath", t: "Synced Breathing", i: "\uD83E\uDEC1", d: "Breathe as one.", kind: "guided", sound: "flute", log: "cp_logs", defMin: 8, breath: [5, 1, 6, 1],
        phases: [["Sit facing each other, close enough to feel near.", 24, "Sit facing one another, close enough that you can sense their presence. Let your eyes soften, or gently close.", "Settle. Feel them near you."], ["Rest a hand on your own chest, and feel your breath.", 30, "Place a hand on your own chest and find your breath, just as it is. Let it slow, without any effort.", "Find your own rhythm first."], ["Now listen for their breath, and let yours drift toward it.", 50, "Now sense the other's breathing — the rise and fall of them — and let your own breath drift, slowly, toward theirs.", "Listen for their rhythm."], ["Inhale together … and exhale together.", 70, "Breathe in together … and out together. Two separate lives, for this moment, moving as one quiet tide.", "In together … out together."], ["Feel the single rhythm that forms between you.", 60, "Notice the single shared rhythm that has appeared between you — something neither of you is making alone.", "One breath, shared between two."], ["Let the breath carry a silent wish to them.", 44, "On each exhale, let your breath carry a silent, wordless wish of care toward them. Let them feel held by it.", "Send them warmth on the breath."], ["Rest in the closeness you've made. Then open the eyes.", 18, "Rest in this closeness a little longer. When you're ready, open your eyes and meet theirs, softly.", "Open your eyes. See them anew."]] },
      { id: "gratitude_x", t: "Gratitude Exchange", i: "\uD83C\uDF1F", d: "Speak what you treasure.", kind: "guided", sound: "choir", log: "cp_logs", defMin: 6,
        phases: [["Sit close. Decide who will speak first, who will receive.", 24, "Sit close, and gently decide: one of you will speak first, the other will simply receive. You'll switch soon.", "One speaks. One receives. No rush."], ["Speaker: name one thing you're grateful for in them.", 54, "Speaker, look at them and name one thing you treasure about them — not grand, but true. Let your voice be soft.", "Be specific. Small is sacred."], ["Receiver: take it in. Do not deflect or downplay.", 50, "Receiver, your only task is to let it land. No joking it away, no deflecting. Just breathe, and let yourself be appreciated.", "Let it in. Just say 'thank you.'"], ["Now switch. The other speaks; the first receives.", 54, "Now gently switch. The other speaks their gratitude, and the first one simply receives it, fully.", "Switch. Speak from the heart."], ["Let what you each said settle between you.", 40, "Let the words you've exchanged settle in the space between you, like warmth in a held cup.", "Feel what's grown between you."], ["Thank each other for being heard, and end softly.", 18, "Thank one another — for speaking, and for listening. Let a small smile close the practice.", "Hold their gaze. Smile."]] },
      { id: "gazing", t: "Eye Gazing", i: "\uD83D\uDC41", d: "Be seen, and see.", kind: "guided", sound: "tanpura", log: "cp_logs", defMin: 6,
        phases: [["Sit close. Let your gaze rest softly in theirs.", 30, "Sit facing them, and let your gaze settle gently into one of their eyes — not staring, just resting there.", "Soften your eyes. Don't perform."], ["Let it feel awkward first. Breathe through it.", 50, "It may feel strange, even funny, at first. That's alright. Keep breathing slowly, and let the awkwardness pass through.", "Breathe. Let the awkwardness pass."], ["Let the gaze settle. There is nothing to do.", 70, "As you stay, something settles. There is nothing to perform here, nothing to say. Just two people, truly seeing.", "Nothing to do but be seen."], ["See them — not the role, the person.", 60, "Look past the everyday face into the person behind it — the same soul you first met. Let yourself really see them.", "Who is really there, behind their eyes?"], ["Let yourself be seen in return.", 50, "Now let yourself be seen, fully, without hiding. To be looked at this kindly is its own quiet gift.", "Let them see you, too."], ["Offer a small, true smile, and close.", 20, "When it feels complete, offer a small, genuine smile. Let it close the space gently between you.", "Smile. You found each other."]] },
      { id: "appreciations", t: "Three Appreciations", i: "\uD83D\uDC91", d: "End the day in praise.", kind: "guided", sound: "choir", log: "cp_logs", defMin: 5,
        phases: [["Sit together. Bring the day gently to mind.", 24, "Sit close and let the day replay softly — the small moments you shared, the ones that almost slipped by.", "Recall the small moments of today."], ["Each will name three things about the other, today.", 30, "In turn, you'll each name three things you appreciated about the other today. Three small, true things.", "Three things. Specific ones."], ["First speaker: offer your three. Be specific.", 54, "First one, speak your three appreciations slowly, letting each one fully land before the next. Small is sacred.", "Say what you noticed. Mean it."], ["Switch. The other offers their three.", 54, "Now switch. The other names their three, just as slowly, just as truly. Let them be received.", "Switch. Speak gently."], ["Receive each one fully, without deflecting.", 36, "As you're praised, resist brushing it off. Let each appreciation settle in, like a small light placed in your hands.", "Let each one in."], ["Thank each other, and let the day close in warmth.", 18, "Thank one another for seeing, and being seen. Let the day close wrapped in this small, shared warmth.", "End the day in praise."]] },
    ],
        awakening: [
      { id: "presence", t: "Pure Presence", i: "\u2728", d: "Drop into now.", kind: "guided", sound: "om", log: "hc_logs", defMin: 8,
        phases: [["What is here, right now, before thought?", 40], ["Sounds. Sensation. The fact of being.", 50], ["You are the awareness, not the content.", 60], ["Rest as that.", 30]] },
      { id: "witness", t: "The Witness", i: "\uD83D\uDC41", d: "Watch the watcher.", kind: "guided", sound: "voidd", log: "hc_logs", defMin: 8,
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
      { id: "maranasati", t: "Death Awareness", i: "\uD83C\uDF11", d: "Maranasati \u2014 the clarifying truth.", kind: "guided", sound: "bowls", log: "hc_logs", defMin: 10,
        phases: [["Sit. Breathe. Remember, gently: this life will end.", 50], ["Not morbid \u2014 clarifying. In this light, what truly matters?", 80], ["Let the small worries fall away.", 70], ["Return to this breath, more alive for having remembered.", 60]] },
      { id: "hesychasm", t: "Prayer of the Heart", i: "\u271D\uFE0F", d: "A sacred word, breathed into the heart.", kind: "guided", sound: "choir", log: "hc_logs", defMin: 12,
        phases: [["Rest attention in the heart. Breathe slowly.", 50], ["On the inhale, a sacred word or name. On the exhale, let it settle deeper.", 90], ["Let the words grow quiet, their meaning remaining.", 70], ["Abide in the stillness of the heart.", 60]] },
      { id: "koan", t: "The Koan", i: "\u2753", d: "A question with no answer, to open you.", kind: "guided", sound: "bowls", log: "hc_logs", defMin: 10,
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
      { id: "box", t: "Box Breathing", i: "\uD83D\uDFE6", d: "Equal four-count breath \u2014 calm under pressure.", kind: "guided", sound: "flute", log: "hc_logs", defMin: 4, breath: [4, 4, 4, 4],
        phases: [["Sit tall. We breathe in equal counts of four.", 25], ["Inhale\u2026 two, three, four.", 30], ["Hold\u2026 two, three, four.", 30], ["Exhale\u2026 two, three, four.", 30], ["Hold empty\u2026 two, three, four. And again.", 60], ["Let the square breathe you. Calm and steady.", 45]] },
      { id: "b478", t: "4-7-8 Breath", i: "\uD83C\uDF19", d: "The natural tranquiliser for the nerves.", kind: "guided", sound: "flute", log: "hc_logs", defMin: 5, breath: [4, 7, 8, 1],
        phases: [["Rest the tip of the tongue behind the upper teeth.", 20], ["Inhale through the nose for four.", 25], ["Hold for seven.", 35], ["Exhale through the mouth for eight, softly.", 40], ["Again \u2014 four in, seven hold, eight out.", 70], ["Feel the nervous system settle.", 30]] },
      { id: "nadi", t: "Nadi Shodhana", i: "\u262F\uFE0F", d: "Alternate nostril \u2014 balancing the channels.", kind: "guided", sound: "flute", log: "hc_logs", defMin: 6, breath: [4, 1, 4, 1],
        phases: [["Rest the right thumb and ring finger near the nostrils.", 25], ["Close the right; inhale through the left.", 35], ["Close the left; exhale right. Then inhale right.", 45], ["Close the right; exhale left. That is one round.", 45], ["Continue, smooth and slow, balancing the two channels.", 70], ["Release the hand. Breathe freely. Feel the balance.", 30]] },
      { id: "ujjayi", t: "Ujjayi Ocean Breath", i: "\uD83C\uDF0A", d: "The victorious breath, sound of the inner sea.", kind: "guided", sound: "samudra", log: "hc_logs", defMin: 5, breath: [5, 0, 7, 0],
        phases: [["Breathe through the nose, mouth gently closed.", 25], ["Narrow the throat softly, as if fogging a mirror from within.", 45], ["Hear the soft ocean sound on the inhale.", 50], ["And on the exhale \u2014 the tide drawing back.", 50], ["Let the sound carry you, wave after wave.", 60]] },
      { id: "kapal", t: "Kapalabhati", i: "\uD83D\uDD25", d: "Skull-shining breath \u2014 the inner fire.", kind: "guided", sound: "tanpura", log: "hc_logs", defMin: 3,
        phases: [["Sit tall. A passive inhale, then a sharp exhale from the belly.", 30], ["Short, rhythmic exhales \u2014 the belly pulses.", 60], ["Let each inhale happen on its own between pulses.", 60], ["Find a steady, light rhythm. Never strain.", 50], ["Stop. Breathe normally. Feel the bright, clear space.", 40]] },
    ],
  };
  // purpose-specific continuation murmurs — woven through long sessions so the guide never leaves you in silence
  const MURMURS = {
    stillness:["Let it pass.","Return, gently.","Rest as the space.","Nothing to hold.","Just this breath.","Be the stillness."],
    bodyscan:["Let that part grow heavy.","Soften wherever you hold.","Nothing to do but feel.","Let the breath reach there.","Warm, and loose.","Melt, a little more."],
    soham:["So\u2026 on the in-breath.","Ham\u2026 on the out-breath.","Let it breathe you.","No effort now.","I am.","Just being."],
    nidra:["Heavier still.","Sinking, softly.","Awake, and at rest.","Let the body sleep.","Float here.","Nothing to carry."],
    vipassana:["Watch it rise.","Watch it pass.","Bare attention.","Nothing to fix.","It is changing.","Only knowing."],
    chakra:["Breathe into the light.","Let the centre open.","Glowing, softly.","Rising, gently.","Feel the warmth.","Steady and bright."],
    kundalini:["Invite, don't force.","Warmth, rising.","Vertebra by vertebra.","Stay soft.","Let it climb.","Settle on its own."],
    astral:["Wider still.","Weightless.","No edges now.","Held by everything.","Vast, and at peace.","Drifting, free."],
    open_heart:["Breathe into the warmth.","Let it overflow.","You deserve this too.","Soften the guard.","Let the heart open.","Tender, and safe."],
    forgive_self:["You did what you knew.","You're allowed to grow.","Lay it down.","Be gentle with you.","Lighter now.","Mercy, for yourself."],
    sync_breath:["Find their rhythm.","In together.","Out together.","One tide.","Feel them near.","Send them warmth."],
    gratitude_x:["Let it land.","Small is sacred.","Receive it fully.","No deflecting.","Just say thank you.","Feel it between you."],
    gazing:["Soften the eyes.","Nothing to perform.","Let it settle.","See them truly.","Let yourself be seen.","Stay, gently."],
    appreciations:["Three small things.","Be specific.","Let each one in.","Receive it.","Seen, and seeing.","End in warmth."],
    presence:["What is here, now?","Before thought.","You are the awareness.","Rest as that.","Just being.","This, exactly this."],
    witness:["Who notices?","Watch the watcher.","No edge to find.","Abide there.","Aware of awareness.","Rest as knowing."],
    atma_vichara:["Who am I?","To whom does this arise?","Trace the 'I' back.","Not the body, not the mind.","Rest at the source.","Abide as 'I am'."],
    shadow:["Where does this live in me?","Do not judge it.","Meet it gently.","It was protecting you.","Let it be seen.","Welcome it home."],
    parts:["Turn toward the part.","Curiosity, not war.","What does it want for you?","Thank it for trying.","You are here now.","Let it relax."],
    muraqaba:["Rest in the heart.","Under the divine gaze.","Be watched, and watch.","A wordless communion.","Dissolve into presence.","Only presence remains."],
    sedona:["Could I let this go?","Would I?","When? Why not now?","Let it go.","Feel the space open.","Whatever returns, release."],
    breathwork:["Keep it circular.","No pause between.","Let it move through you.","Whatever rises, breathe.","On the breath, release.","Now slow, and rest."],
    maranasati:["This life will end.","What truly matters?","Let the small fall away.","Death, the wise companion.","More alive, for remembering.","Return to this breath."],
    hesychasm:["Lord, have mercy.","The Name, on the breath.","Mind into the heart.","Let the words grow still.","Be still, and know.","Abide in the heart."],
    koan:["Don't think it through.","Sit with the question.","Release the answer.","Return to the koan.","Rest in not-knowing.","What is this?"],
    zazen:["Just sitting.","Count the exhale.","Begin again.","No failure here.","Thoughts pass like clouds.","Nothing to attain."],
    taiji:["Up the spine.","Down the front.","Let it circle.","Soft and slow.","The orbit turns.","Rest in the flow."],
    tonglen:["Breathe in the pain.","Breathe out relief.","Take in; send out.","For all who suffer so.","Dark in, light out.","Heart, softened."],
    box:["In, two, three, four.","Hold, two, three, four.","Out, two, three, four.","Hold empty, four.","The square breathes you.","Calm and steady."],
    b478:["In, for four.","Hold, for seven.","Out, for eight.","Soft and slow.","The nerves settle.","Again, gently."],
    nadi:["Close the right.","Inhale, left.","Close the left.","Exhale, right.","Balance the channels.","Smooth and slow."],
    ujjayi:["Hear the ocean.","Narrow the throat.","The tide comes in.","The tide draws back.","Wave after wave.","Carried by the sound."],
    kapal:["A sharp exhale.","Let the inhale fall in.","The belly pulses.","Light and steady.","Never strain.","Bright, clear space."],
    presence:["What is here, now?","Before thought.","You are the awareness.","Rest as that.","Just being.","This, exactly this."],
  };
  var ATR_MUR = ["Deeper in.","Trust the descent.","You are safe here.","Let it speak.","Stay, and witness.","Carry only what is yours.","Breathe, and cross."];

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
      murmurs: MURMURS[p.id],
      breath: p.breath,
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
      phases: ANTARYATRA, stages: ATR_STAGES, murmurs: ATR_MUR, log: "hc_logs",
    });
  });

  window.PRACTICE_LIB = LIB;
})();
