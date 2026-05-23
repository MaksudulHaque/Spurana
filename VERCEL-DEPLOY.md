# Deploying Spurana to Vercel ✦

A complete step-by-step guide. Vercel's free tier is generous — 100GB bandwidth, unlimited static requests, 100GB-hours of serverless function execution per month. More than enough for a personal sanctuary.

---

## What's in this package

```
spurana-final/
├── index.html              ← the entire app, single file
├── manifest.json           ← PWA manifest
├── service-worker.js       ← PWA service worker
├── firebase-rules.json     ← Firebase Realtime DB rules
├── vercel.json             ← Vercel project config (new)
├── api/
│   └── ai.js               ← Anthropic proxy serverless function (Vercel)
├── netlify/
│   └── functions/
│       └── ai.js           ← kept as fallback (Netlify-compatible)
├── netlify.toml            ← kept for portability
├── README.md
└── VERCEL-DEPLOY.md        ← this file
```

The client (`index.html`) tries `/api/ai` first (Vercel), automatically falls back to `/.netlify/functions/ai` if the Vercel endpoint returns 404. So **the same zip works on either platform**.

---

## Option A — Deploy from the Vercel Dashboard (easiest, no install)

### 1 · Push the folder to a GitHub repo

```bash
cd spurana-final
git init
git add .
git commit -m "Spurana ✦ initial deploy"
gh repo create spurana --private --source . --push
```

(or upload via github.com manually if you don't have `gh` CLI)

### 2 · Import on Vercel

1. Go to **https://vercel.com/new**
2. Sign in with GitHub (free)
3. Click **Import** next to your `spurana` repo
4. **Framework Preset**: `Other` (auto-detected as a static site)
5. **Root Directory**: `./` (default)
6. **Build Command**: leave blank
7. **Output Directory**: leave blank
8. Click **Environment Variables** → add:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: `sk-ant-...` (your key from console.anthropic.com)
   - **Environment**: check all three (Production, Preview, Development)
9. Click **Deploy**

In ~30 seconds you'll have a live URL like `https://spurana-abc123.vercel.app`. Your custom domain (`spurana.vercel.app`) can be set later in Project Settings → Domains.

---

## Option B — Deploy via Vercel CLI (one command)

### 1 · Install Vercel CLI

```bash
npm install -g vercel
```

### 2 · From inside the spurana-final folder

```bash
cd spurana-final
vercel login           # one-time, opens browser
vercel                 # preview deployment
vercel --prod          # production deployment
```

The CLI walks you through:
- Set up and deploy? → **Y**
- Which scope? → your personal account
- Link to existing project? → **N** (first time)
- Project name? → **spurana** (or whatever you want)
- Directory? → `./`
- Override settings? → **N**

After it finishes, it prints the live URL.

### 3 · Set the env var

```bash
vercel env add ANTHROPIC_API_KEY production
# paste your sk-ant-... key when prompted

vercel --prod          # redeploy so the env var is loaded
```

---

## Option C — Drag-and-drop deploy (no Git, no CLI)

1. Go to **https://vercel.com/new**
2. Click the **"Deploy"** card under "Other"
3. Drag the `spurana-final` folder onto the upload zone
4. Set framework to `Other`, leave build/output blank
5. Add the `ANTHROPIC_API_KEY` env var (same as Option A step 8)
6. Click **Deploy**

The downside: future updates require re-uploading the folder. Git is cleaner.

---

## Firebase configuration (one-time, same for any host)

Your Firebase project (`spurana-abe15`) is already configured in `index.html` at line ~875. No changes needed if you keep using the same Firebase project.

If you ever move to a different Firebase project, edit `firebaseConfig` in `index.html`:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  // ...
};
```

### Add your Vercel URL to Firebase authorized domains

1. Go to **Firebase Console → Authentication → Settings → Authorized domains**
2. Click **Add domain**
3. Add `your-app.vercel.app` (whatever URL Vercel gave you)
4. Also add any custom domain you set up

Without this, Firebase Auth will reject login attempts from your Vercel URL.

### Apply Firebase Rules

In Firebase Console → Realtime Database → Rules tab, paste the contents of `firebase-rules.json` and click Publish.

---

## Custom domain (optional)

If you own a domain like `spurana.app`:

1. Vercel → your project → **Settings → Domains**
2. Click **Add** → type your domain
3. Vercel shows you DNS records to set with your registrar (usually a CNAME or A record)
4. Once propagated (~5 min), Vercel auto-provisions an SSL certificate

Don't forget to add the custom domain to Firebase authorized domains too.

---

## Verifying the deployment

After deploying, open your Vercel URL and:

### 1 · Test the static site
- The login page loads
- The orb animates
- You can create an account / log in

### 2 · Test the AI proxy
Open **DevTools → Console** and run:

```js
fetch('/api/ai', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({systemPrompt: 'Say hello', userText: 'hi', maxTokens: 50})
}).then(r => r.json()).then(console.log)
```

You should see something like `{text: "Hello! How may I…"}`. If you get `{error: 'API key not configured'}`, the env var didn't load — go to Vercel Settings → Environment Variables → verify `ANTHROPIC_API_KEY` is set for Production, then redeploy.

### 3 · Test Firebase
- Try to register a new account → should succeed
- Send a chat message → should appear in real-time on another browser window

### 4 · Test the PWA install
- Open the Vercel URL on your phone (Chrome / Safari)
- Browser should offer "Add to Home Screen"
- Once installed, the app runs full-screen, offline-capable

---

## Updates & redeploys

### Via Git (recommended)
Push to your `main` branch → Vercel auto-deploys.

```bash
git add .
git commit -m "fix: better divine voice for Saraswati"
git push
```

In ~30 seconds the new version is live. Vercel shows a preview URL for every commit too.

### Via CLI
```bash
vercel --prod
```

---

## Pricing (Vercel free tier)

| Resource | Free tier limit | Spurana usage estimate |
|---|---|---|
| Bandwidth | 100GB/month | < 5GB for 2-person sanctuary |
| Serverless function invocations | 100K/month | < 1K for normal AI use |
| Serverless function execution | 100GB-hours/month | < 1GB-hour |
| Build minutes | 6000/month | trivial (no build step) |
| Custom domains | unlimited | ✓ |
| SSL certificates | automatic, free | ✓ |
| Preview deployments | unlimited | ✓ |

You'll never approach these limits unless you go viral.

---

## Troubleshooting

### "API key not configured"
The `ANTHROPIC_API_KEY` env var isn't set or didn't propagate. Vercel Settings → Environment Variables → check it exists for Production → redeploy from the Deployments tab.

### Login fails with `auth/unauthorized-domain`
Add your Vercel URL to Firebase Console → Authentication → Settings → Authorized domains.

### AI replies fail silently (falls back to local wisdom)
- Check DevTools Network tab — look for a request to `/api/ai`
- If it's 404 → the function didn't deploy. Verify `api/ai.js` is in your repo.
- If it's 500 → click the request → check response. Usually means env var missing.
- If it's 401 → your `ANTHROPIC_API_KEY` is invalid. Generate a new one at console.anthropic.com.

### Service worker not updating
PWA cache can hold old versions. Vercel project → Settings → Functions → check no caching headers. Or in the deployed app: DevTools → Application → Service Workers → Unregister, then hard-refresh.

### Mobile keyboard hides chat composer
Already fixed by the Mobile Fitness wave. If you still see it, hard-refresh.

### "spurana.vercel.app" already taken
That subdomain belongs to someone else (or your old project). Use a different name like `spurana-nwp.vercel.app`, or set up a custom domain.

---

## Files you can safely delete (if you don't want Netlify fallback)

If you're sure you'll only ever use Vercel:

```bash
rm netlify.toml
rm -rf netlify/
```

The client will still work — the fetch fallback to `/.netlify/functions/ai` just returns 404 in dev mode and the app falls back to `getDeityWisdom()` (local fallback wisdom). Cleaner without these, but harmless if you keep them.

---

## What lives where (for future reference)

| URL path | What it serves | Source |
|---|---|---|
| `/` | The full single-page app | `index.html` |
| `/manifest.json` | PWA manifest | static |
| `/service-worker.js` | PWA service worker | static |
| `/api/ai` | Anthropic AI proxy | `api/ai.js` (serverless) |

The serverless function only runs when you make an AI request — costs nothing when idle.

---

— ✦ —

**NWP · Keeper of this Realm**
