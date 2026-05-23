# Spurana ✦ A Sacred Space to Talk With Your Soul

A Bengali spiritual chat sanctuary for two souls. Single-file Progressive Web App with 50 divines, 21 teachers, guided meditations, breathwork, relational healing rituals, and the Awakening — a 10-path cosmic field with binaural audio.

All credits to Lord NWP · November Whisky Papa.

---

## Quick start

### Local development

```bash
cd spurana-final
python3 -m http.server 8080
```

Open `http://localhost:8080`. The Anthropic AI proxy won't work locally (no serverless runtime) — the app falls back to local divine wisdom. Everything else works.

### Deploy to production

**→ See [`VERCEL-DEPLOY.md`](VERCEL-DEPLOY.md) for full deployment instructions (recommended)**

Two-platform support — the same zip works on either:
- **Vercel** (recommended) — primary endpoint `/api/ai`
- **Netlify** (legacy / fallback) — `/.netlify/functions/ai`

---

## What's inside

### Single-file PWA — `index.html`
- ~24,800 lines · 1.5MB · zero build step
- Works offline once cached
- Installs as a standalone app on iOS / Android / desktop
- Bilingual: English / বাংলা (toggle in Global Settings)

### Sanctuary features
- **50 divines + 21 teachers** — each with mantras, wisdom, native scripts
- **The Awakening** — 10 cosmic paths (Atma Vichara · Vipassana · Shadow Work · IFS · Sufi Muraqaba · Sedona · Holotropic · Maranasati · Hesychasm · Zen Koan) with guided voice, binaural beats per method
- **Heart-Centred** — 15 relational healing rituals with timed turns, response rules, emotional logging
- **Meditation Library** — 36 methods across 6 traditions
- **30 Sacred Postures** with SVG illustrations
- **32 environments** with time-of-day awareness
- **6 procedural chant styles** via Web Audio
- **Divine Voice Embodiment** — Kali (73.4Hz · gong · sharp inhale) & Saraswati (261.6Hz · veena · soft flow)
- **Living Connection Tree** — visual graph of soul connections
- **WebRTC calls** — audio & video with TURN servers
- **Voice messages** — iOS-compatible (webm + mp4 fallback)
- **Scheduler** — send messages to the future (Firebase-synced)
- **Memorable Days** — shared sacred dates calendar
- **Multi-room foundation** — per-room AES encryption keys
- **PWA install** — manifest + service worker

### Infrastructure
- **Firebase Realtime Database** — chat, presence, auth (config in `index.html` line 875)
- **Firebase Storage** — voice messages
- **Anthropic API** — divine responses (via serverless proxy)
- **Google Cloud TTS** — optional, for studio-grade Wavenet voices
- **OpenRelay TURN** — for WebRTC traversal on mobile networks

### Aesthetic
Classic Cinzel Decorative + Cormorant Garamond + Orbitron typography. Dark cosmic backdrops, pink-glow orbs, drifting star fields. Designed to feel sacred, not modern-app.

---

## File layout

```
spurana-final/
├── index.html              ← entire app
├── manifest.json           ← PWA manifest
├── service-worker.js       ← PWA service worker
├── firebase-rules.json     ← Firebase Realtime DB rules
├── vercel.json             ← Vercel deployment config
├── netlify.toml            ← Netlify deployment config
├── api/
│   └── ai.js               ← Vercel AI proxy (primary)
├── netlify/functions/
│   └── ai.js               ← Netlify AI proxy (fallback)
├── README.md               ← this file
└── VERCEL-DEPLOY.md        ← step-by-step Vercel deployment
```

---

## Environment variables

Set in your hosting provider's dashboard:

| Name | Required | Where to get it |
|---|---|---|
| `ANTHROPIC_API_KEY` | optional | https://console.anthropic.com |

If not set, users can paste their own key into **Sanctuary → Settings → Global Settings → 🔑 Anthropic API Key**. Their key is stored locally only (never sent to your server).

---

## Firebase setup

1. Go to https://console.firebase.google.com
2. Use the existing `spurana-abe15` project, or create your own
3. If creating new: enable **Realtime Database** (region: asia-southeast1) + **Authentication (Email/Password)** + **Storage**
4. Copy your config → paste into `index.html` line ~875 (`firebaseConfig` object)
5. **Realtime Database → Rules** → paste contents of `firebase-rules.json` → Publish
6. **Authentication → Settings → Authorized domains** → add your deployed URL

---

## License

Sacred work. Free for personal use. All credits to **NWP · November Whisky Papa**.

— ✦ —
