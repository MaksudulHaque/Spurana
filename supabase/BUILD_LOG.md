# SPURANA — Build Log · PRODUCTION v1.0

**Status: feature-complete, verified, production-ready.** Remaining work is
yours: run `supabase/schema.sql` (RLS), deploy the two edge functions, deploy
`www/`, and connect the live URL in Supabase Auth. See **LAUNCH.md**.

## What this build is
A single-file PWA couple/soul messenger on an existing Supabase backend, rebuilt
from a clean modular `src/` and bundled to one `www/index.html`. Matches V1 design.

## Final composition
- **51 JS modules + 4 CSS**, bundled → `www/index.html` (~286 KB).
- **The Sanctuary** hub with 6 sections, every tile functional: Connect (sacred/
  vision calls, watch/listen together, souls, echoes, vanish, track), Journey
  Inward (meditation, heart-centred, inner journey, couple practices, learning,
  oracle, past lives), Remember (vault, letters, sacred days, gratitude, daily
  ritual), Reflect (stats, connection tree, soul qi), Worlds, Settings, Divine Guide.
- **52 mood worlds**: 22 bespoke nature scenes (restored + enriched from V1
  `ENV_FX`) + **30 states of the heart** (love, longing, union, heartbeat, missing
  you, devotion, hope, reunion, peace, passion, healing, forever, two hearts…).
- **Authentic V1 audio** (`AMB`) restored: generative per-world sound — rain with
  thunder, fire crackle, ocean swell, forest birdsong, temple bells, baul vibrato,
  cosmos pads, aurora shimmer. Off by default, gesture-started, volume-persisted.
- **Performance**: scene engine runs at low internal resolution, fps-throttled,
  visibility-paused, reduced-motion aware, try/catch per frame. 3 perf tiers.


## Guided practices — timed, voice-guided, self-paced (v1.1)
Every awareness practice now runs through one shared engine (`core/guide.js`):
- **Timeline first**: you pick the length (a default is pre-lit per practice);
  guidance scales to fit. Soft 432 Hz bells at start, midpoint, and end.
- **Voice-guided**: a warm narrator you can set to **Her** or **Him** (soft, slow,
  affectionate), or mute. Choice persists.
- **Aesthetic**: a glowing seated figure breathes with you over the living world.
- **No chat needed** — this is for self-understanding and self-awakening.
- **Full V1 coverage restored**: **Sit in Silence** (open timer + bells) and the
  seven-stage **Antaryatra** inner pilgrimage (Prarambha → Punaragama, each with its
  own narrated voice + reflection question), alongside the existing Stillness, Body
  Scan, So-Ham, Yoga Nidra, Opening the Heart, Self-Forgiveness, Pure Presence, The
  Witness, and the couple practices. 15 practices, no id conflicts.


## Sacred soundscapes + royal layer (v1.2)
- **Per-practice soundscapes**: every meditation now opens its own surrounding bed,
  matched to its type — Om drone (Chakra, So-Ham, Stillness, Presence), celestial
  choir (Nidra, Boundless, Heart, Hesychasm), singing bowls (Vipassana, Zazen,
  Tonglen, Silence), tanpura (Kundalini, Self-Inquiry, Kapalabhati, Eye-Gazing),
  bansuri flute (Qi Flow, Box/4-7-8/Nadi, Bridge), ney (Sufi Heart-Watching), deep
  void drone (Shadow, Death-Awareness), ocean (Ujjayi, Breathwork).
- **Antaryatra shifts sound per stage**: Om → flute → choir → bowls → ocean →
  tanpura → choir as the seven stages turn.
- **Heavenly reverb**: the whole ambient bus runs through a generated cathedral
  convolver — bells, chants and bowls bloom with a long sacred tail.
- **Voice**: warm, slow Her/Him narration over the bed, sitting inside the reverb.
- **Royal / mystic visuals**: a slowly turning gold mandala behind every session, a
  gilt halo ring around the lotus figure, jewel-tone depth, gilded chips and buttons,
  flourished dividers. Icons made coherent (single source for lists + sessions).


## Layout foundation cleanup (v1.3) — alignment root-causes fixed
Not patches — fixes at the source, in one token-driven system:
- **Safe-area was applied twice** (`#app` + every header) → removed the duplicate so
  headers own the notch inset once. Top of every screen now aligns correctly.
- **`body::after` collision** (grain overlay was silently overwritten by the vignette)
  → grain moved to `body::before`; both layers now coexist; lite-mode hides the
  right one.
- **Inconsistent gutters** (16/18/14/20px) → one `--gutter` token (18px) drives the
  bar, headers, section labels, grids and padded screens, so left edges line up.
- **Guided-session CSS** was duplicated across two build passes (`.guide-wrap`,
  `.guide-ring`, `.guide-chip` defined twice) → consolidated into a single, ordered,
  editable block with no duplicate base rules.


## Soul Weather, Mood Chart & Reminders (v1.4) — built clean
- **Soul Weather**: daily inner check-in from a fixed serene set; shared with your beloved.
- **Mood Chart**: a gentle 14-day chart of both souls inside Soul Weather.
- **Reminders**: pick a practice + time; nudges in-app (and a local notification if the
  page is open and permission is granted). Honest limit: true background push needs a
  server; not faked.
- All three reuse the secure typed-row pattern — structured payload packed as JSON in
  the existing `text` column of `messages`, conv-scoped, protected by the same RLS, and
  excluded from the chat thread. **No new tables, no new columns, no new attack surface.**
- Earlier draft of Soul Weather wrote non-existent columns; fixed to write only real
  columns (would have failed against the live schema otherwise).


## Sacred Games (v1.5) — final V1 gap closed
- **Sacred Questions** (couple): a 30-card deck of deepening questions to draw
  together; any card can be sent to your beloved as a Love Letter (reuses the secure
  keepsake insert — fixed-format text, no free-text sink).
- **Symbol Memory** (solo): a calm 4×4 pairs game of sacred glyphs, entirely
  client-side (no network), best score kept in localStorage; flip timers cleaned up
  on teardown.
- Removed two dead stub files (`games/inbox.js`, `games/events.js`) rather than leave
  empty patched modules.
- **Every V1 activity is now covered** (see V1_COVERAGE.md).


## Performance + de-patch (v1.6) — native-fast feel
- **JS now minified** in the build via terser (mangle off for safety): the shipped
  bundle dropped ~25% (352→264 KB; ~70 KB gzipped). Source stays fully modular and
  editable — only `www/index.html` is minified. Smoke executes the *minified* bundle,
  so correctness is proven, not assumed.
- **Backdrop blur** (the main mobile GPU cost / heat source) reduced from 30/24px to a
  single editable `--blur:16px` token across the bar, cards and chat input.
- **Snappier transitions** — `--t` 0.25s → 0.18s for a more instant, native response.
- **Paint/layout containment** added to repeated boxes (cards, tiles, list rows, memory
  cells) and scroll containers, so long lists repaint far less while scrolling.
- CSS was already minified in the build; stylesheets carry no duplicate selectors.

## Security (see LAUNCH.md for the full audit + proof steps)
- Client XSS-safe (text nodes only; the one HTML sink is dead/unused).
- No secrets in client (publishable key only; Anthropic key server-side).
- `supabase/schema.sql`: 11 tables, RLS enabled on all, 17 policies + storage +
  realtime. Membership derived from `conv_id` (`is_member`).
- `delete-account` edge function: caller verified by JWT, deletes only own data.
- Security headers shipped (`_headers`, `vercel.json`, `netlify.toml`).

## Verification (all green this build)
- `node --check` on every `src/*.js` + build/verify/smoke scripts.
- `node build.mjs` → bundle; `node verify-bundle.cjs` → load-order concat parses,
  braces balanced; HTML inline script complete + no raw `</script>`.
- `node smoke.cjs` → boots real bundle in a fake DOM + fake Supabase, renders
  EVERY screen with zero throws.
- `fxtest` → all **52** scenes run against a mock 2D context, **0 failures**.

## Files
- `www/index.html` — the app (deploy this folder).
- `spurana.zip` — full source + build + supabase/ + docs.
- `supabase/schema.sql` — RLS (the security gate — run first).
- `supabase/functions/ai-teacher`, `supabase/functions/delete-account`.
- `LAUNCH.md` — security proof + deployment plan + checklist.
- `mood-preview.html` — standalone, experience all 52 worlds + authentic sound.

## The launch gate
Do NOT go live until `schema.sql` is run in your Supabase. Until then the public
key leaves data readable. After it, run the cross-account proof in LAUNCH.md §1.
