# Spurana ✦ Beta Green L 1

A polished, Vercel-ready build of Spurana — Bengali spiritual chat sanctuary for two souls.

All credits to **Lord NWP · November Whisky Papa**.

---

## What's in this build

| File | Purpose |
|---|---|
| `index.html` | The entire app — single-file PWA (~28k lines, 1.6 MB) |
| `service-worker.js` | PWA offline support + cache busting |
| `manifest.json` | PWA install metadata (icons, theme, display mode) |
| `vercel.json` | Vercel deployment config (security headers, caching) |
| `api/ai.js` | Anthropic API proxy serverless function |
| `firebase-rules.json` | Realtime Database security rules |
| `firebase-storage-rules.txt` | Storage rules for avatars/voice/media |
| `FIREBASE-SCHEMA.md` | Complete database schema documentation |
| `.env.example` | Documents required env vars |
| `.gitignore` | Excludes secrets, node_modules, OS junk |
| `.gitattributes` | Forces LF line endings (Windows → Linux) |

---

## What's new in Beta Green L 1

Everything in the previous v6.7 build, plus:
- ✦ Listen Together LIVE — always-on Firebase listener, auto-open on partner activity
- ✦ Audio Broadcast — WebRTC tab-audio streaming (share Spotify Premium to your free partner)
- ✦ Auto Mode — silent audio priming + auto-accept broadcasts (no prompts)
- ✦ YouTube Music URL normalization + 7-second watchdog with clean fallback
- ✦ Modal Layer Hardening — all modals fully opaque, body scroll lock
- ✦ Divine Voice Embodiment — Kali + Saraswati with breath, drone, signature sounds
- ✦ Heart-Centred Rebuild — 15 relational healing rituals with phase engine
- ✦ The Awakening — 10 cosmic paths with binaural beats per method
- ✦ Complete Firebase schema with server-side validation

---

## Deploy in 3 minutes

### 1 · Upload to GitHub

```bash
cd "Beta Green L 1"
git init
git branch -M main
git add .
git commit -m "Spurana ✦ Beta Green L 1"

# Either via gh CLI:
gh repo create spurana --private --source=. --remote=origin --push

# Or create the repo manually at github.com/new, then:
git remote add origin git@github.com:YOUR-USERNAME/spurana.git
git push -u origin main
```

### 2 · Connect to Vercel

1. Go to https://vercel.com/new
2. Sign in with GitHub → Import the `spurana` repo
3. Framework Preset: **Other** · Build Command + Output Directory: blank
4. **Environment Variables** → add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your `sk-ant-...` key from console.anthropic.com
   - Check all three environments (Production · Preview · Development)
5. Click **Deploy**

Live at `https://your-project.vercel.app` in ~30 seconds.

### 3 · Configure Firebase

1. **https://console.firebase.google.com** → select `spurana-abe15`
2. **Authentication → Settings → Authorized domains** → Add your Vercel URL
3. **Realtime Database → Rules** → paste `firebase-rules.json` → Publish
4. **Storage → Rules** → paste `firebase-storage-rules.txt` → Publish

---

## Environment variables

| Name | Required | Where to get it |
|---|---|---|
| `ANTHROPIC_API_KEY` | optional* | https://console.anthropic.com/settings/keys |

*Optional because users can paste their own key in **Sanctuary → Settings → Global Settings → 🔑 Anthropic API Key** (stored only on their device, never sent to your server).

---

## Test the deployment

After deploy, open your Vercel URL → DevTools → Console:

```js
// Test AI proxy
fetch('/api/ai', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ systemPrompt: 'Reply briefly', userText: 'Hi', maxTokens: 30 })
}).then(r => r.json()).then(console.log)
// Expected: { text: "Hello..." }

// Test Listen Together state
_listenTogether.state()

// Test Audio Broadcast role
_audioBroadcast.role()

// Test YT Music URL normalizer
_ytFix.normalize('https://music.youtube.com/watch?v=Mqc37ItMefM&si=xyz')
```

---

## Updates

```bash
git add .
git commit -m "fix: whatever"
git push
```

Vercel auto-deploys in ~30s. Hard-refresh once to pick up the new service worker.

---

— ✦ —

**NWP · Keeper of this Realm**
