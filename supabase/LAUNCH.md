# SPURANA — Soft-Launch Readiness, Security Proof & Deployment Plan

## 0. Honest scope of this review
This is a **static security audit + threat model of the actual code**, plus the
backend hardening (RLS, security headers, secure edge functions) needed for a safe
soft launch. It is **not** a live penetration test against a running server — that
requires the deployed URL, the Supabase project, and your written authorization. The
code-level results below are real and reproducible from the source.

---

## 1. Security audit — findings & PROOF
Run against the committed source (`grep`/inspection, reproducible):

| Vector | Result | Evidence |
|---|---|---|
| **Stored/Reflected XSS** (chat text, names, letters, captions) | **SAFE** | `H.el` appends every string child via `document.createTextNode()`. No user text is ever set as HTML. |
| **HTML-injection sink** (`html:`→`innerHTML`) | **SAFE (dead sink)** | The `html:` attribute is **never used** anywhere in `src/`. The only `innerHTML` writes are a static error string, the static sigil SVG, and the Connection-Tree SVG built from a **numeric** score. |
| **Code injection** (`eval`, `new Function`, string `setTimeout`) | **NONE** in shipped code | grep clean across `src/`. |
| **Secret leakage** (service_role, API keys, passwords) | **NONE** | Client carries only the `sb_publishable_` (anon) key, which is public by design. The Anthropic key lives **only** server-side in the `ai-teacher` function. |
| **Account deletion abuse** | **FIXED** | `delete-account` now identifies the caller from their JWT and can only delete *their own* data; `service_role` never leaves the server. |
| **Clickjacking / framing / MIME-sniff** | **MITIGATED** | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, HSTS, scoped `Permissions-Policy` (camera/mic/geo = self only). |
| **WebRTC signaling tampering** | **SCOPED** | `rtc_signals` RLS: only conversation members read/write, and `caller_uid` must equal `auth.uid()`. |
| **Mass data exfiltration via public key** | **THE risk → CLOSED by RLS** | See §2. Without RLS the anon key can read all rows; with the provided `schema.sql` it cannot. |

**Conclusion:** the client is hardened. The entire confidentiality guarantee rests on
**Supabase RLS**, which `supabase/schema.sql` now provides for all 11 tables + storage.

### How to PROVE it solid (do this after deploy)
1. Create two accounts **A** and **B**; pair them. Confirm they can chat.
2. Create a third account **C** (unpaired).
3. As **C**, hit the REST API for A↔B's messages:
   `GET {SUPABASE_URL}/rest/v1/messages?conv_id=eq.<A_B>` with C's token.
   → **must return `[]`**. That empty result is your proof RLS holds.
4. Repeat for `watch_session`, `soul_card`, `hc_logs`, and a `media` object path.
5. Try to `DELETE` A's message as C → must be rejected.
A short script doing the above, returning all-zero/denied, is publishable proof.

---

## 2. The security model in one paragraph
A conversation id is the two user ids **sorted and joined by `_`** (`SP.convIdFor`).
So "is the caller allowed?" reduces to *"is `auth.uid()` one of the two halves of
`conv_id`?"* — implemented once as `is_member(key)` and reused by every policy
(messages, keepsakes, calls, watch/listen/soul-card, media storage). Personal logs are
scoped to `uid = auth.uid()`. Profiles expose only display name/avatar. This is simple,
auditable, and has no "forgot a policy" gaps.

---

## 3. Backend & "free modality" — and the MongoDB question
**Does MongoDB work as a free backend?** MongoDB Atlas has a free **M0** tier (512 MB).
But **switching to MongoDB is not advisable here** — and not necessary. Spurana is built
end-to-end on **Supabase**, which on its **free tier** already gives you, integrated:
- **Postgres** (500 MB) with **RLS** (your security layer) — Mongo has no equivalent built-in row security tied to auth.
- **Auth** (email/login, ~50k monthly active users free) — you'd have to build this yourself with Mongo.
- **Realtime** (the live chat/calls/sync) — Mongo change-streams aren't a drop-in for this client.
- **Storage** (1 GB, for photos/voice) with the same RLS model.
- **Edge Functions** (the AI teacher + account deletion).

Rebuilding auth + realtime + storage + row-security on Mongo would be weeks of work and
**less secure by default**. Recommendation: **stay on Supabase free tier** for soft
launch; it costs $0 and everything is already wired to it.

**Total free stack:** Supabase (DB/Auth/Realtime/Storage/Functions) + Netlify **or**
Vercel (static hosting, free) + Cloudflare optional. The **one** thing not free at scale
is a **TURN server** for calls behind strict NATs — STUN (free) covers most cases; for
the rest use a free/cheap managed TURN (e.g. metered.ca free 50 GB, or Cloudflare TURN)
set in `CFG.TURN`.

**Free-tier ceilings to watch (soft launch is fine):** DB 500 MB, storage 1 GB, egress
5 GB/mo, Realtime concurrent connections, and Supabase pausing a project after ~1 week
of inactivity (a cron ping avoids it).

---

## 4. Deployment — step by step

### A. Database (do this FIRST — it's the security gate)
1. Supabase → your project → **SQL Editor** → paste **`supabase/schema.sql`** → Run.
2. Confirm: Table editor shows RLS = **enabled** (green) on every table.
3. Storage → confirm a private **`media`** bucket exists.

### B. Edge functions (CLI: `npm i -g supabase`; `supabase login`; `supabase link`)
```
supabase functions deploy ai-teacher
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...        # for Divine Guide live AI
supabase functions deploy delete-account                  # uses built-in service key
```
(Without `ai-teacher`, Divine Guide gracefully uses in-spirit wisdom.)

### C. Frontend (pick ONE)
**Netlify (drag-drop, easiest):** drag the **`www/`** folder onto app.netlify.com/drop.
`www/_headers` ships the security headers automatically.
**Netlify (CLI):** `npx netlify-cli deploy --dir=www --prod`
**Vercel:** from repo root `vercel deploy --prod` (uses `vercel.json` → headers + SPA).

### D. Connect the dots
1. Supabase → **Auth → URL Configuration** → add your live URL to **Site URL** and
   **Redirect URLs** (the invite `?code=` links and email confirmations need this).
2. Open the site over **https** (required for service worker, install, mic/cam, geo).
3. (Optional) set `CFG.TURN` to your TURN creds for reliable calls.
4. (Optional) add a Supabase scheduled function / external cron to ping the DB daily so
   the free project doesn't pause.

### E. Smoke the live build (the two-phone test)
Sign in on two devices → pair via invite code → send text/photo/voice → 1 call →
Watch/Listen together → write a Love Letter → switch a Mood World. Then run the §1 RLS
proof from a third account.

---

## 5. Pre-launch checklist
- [ ] `schema.sql` run; RLS green on all tables; `media` bucket private
- [ ] §1 cross-account RLS proof returns empty/denied for a non-member
- [ ] `ai-teacher` + `delete-account` deployed; `ANTHROPIC_API_KEY` set
- [ ] Live URL added to Supabase Auth URL config
- [ ] Served over https; PWA installs; SW caches
- [ ] Two-phone end-to-end passes (chat, media, call, sync, keepsakes, worlds)
- [ ] TURN configured if testers are on mobile networks
- [ ] Daily DB ping scheduled (free-tier anti-pause)
- [ ] Privacy: account export + delete both work

---

## 6. Why it can feel beyond a "pro messenger"
Facebook/Messenger optimize for *engagement*. Spurana optimizes for *intimacy between two
people* — that's the edge, if we keep leaning in:
- **One sacred space, two souls** — no feed, no ads, no crowd. The Sanctuary hub frames
  everything as "where shall *you* go," not "what's everyone doing."
- **Presence as atmosphere** — 52 living mood worlds (incl. 30 heart-states) with matching
  reverberant soundscapes make the app *feel* like the relationship's weather.
- **Keepsakes** — Love Letters, Sacred Days with countdowns, shared Memory Vault, Gratitude
  — messengers don't hold a couple's history like this.
- **Together-rituals** — synced Watch/Listen, couple practices, breathing, the Connection
  Tree and Soul Qi that *grow from real shared activity*.
- **Calm by design** — serene gradients, soft motion, no notifications-for-notifications.

### Smoothness / aesthetic polish still worth doing
- Tune individual mood scenes for serenity (color shades + motion), per your feedback.
- Extract V1's real `AMB` audio so sound matches the visuals exactly.
- Add gentle haptics on send/receive (mobile), and a first-run "choose your world" moment.
- Optional: per-section icon set as exact SVGs if you provide V1's icon assets.

---
*Generated for the Spurana build. The code-level audit results are reproducible from
`src/`; the live proofs in §1/§5 require the deployed environment.*
