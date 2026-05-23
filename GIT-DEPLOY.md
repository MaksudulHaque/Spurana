# Git → GitHub → Vercel ✦ Complete Workflow

Step-by-step commands from a fresh terminal to a live `spurana.vercel.app`.

---

## ✦ Prerequisites (one-time)

You need:
- **Git** installed → check with `git --version` (if missing: https://git-scm.com/downloads)
- **A GitHub account** → https://github.com/signup
- **A Vercel account** → https://vercel.com/signup (sign in with GitHub for easiest flow)

That's it. No Node, no build tools, nothing else.

---

## ✦ Part 1 — Initialize the local repository

Open a terminal in the `spurana-final` folder:

```bash
cd spurana-final
```

Configure git (one-time per machine — skip if already done):

```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

Initialize the repo:

```bash
git init
git branch -M main
```

Stage everything and commit:

```bash
git add .
git status               # should show all the files, no .env / .vercel / node_modules
git commit -m "Spurana ✦ initial commit"
```

If `git status` shows anything that shouldn't be there (`.env`, `.DS_Store`, etc.), make sure `.gitignore` is being respected — it should already exclude them.

---

## ✦ Part 2 — Create the GitHub repository

### Option A — Via the website (easiest)

1. Go to **https://github.com/new**
2. **Repository name**: `spurana`
3. **Privacy**: choose **Private** (recommended — your Firebase URL is in there, not secret but no need to publish)
4. **Do NOT check** "Add a README" / ".gitignore" / "License" — we already have all of those
5. Click **Create repository**
6. Copy the SSH or HTTPS URL it shows you (e.g. `git@github.com:yourname/spurana.git`)

Then connect your local repo:

```bash
git remote add origin git@github.com:YOUR-USERNAME/spurana.git
git push -u origin main
```

(Use the HTTPS URL instead if you don't have SSH set up — GitHub prompts for username + a personal access token as the password.)

### Option B — Via the GitHub CLI

If you have `gh` installed (https://cli.github.com):

```bash
gh auth login           # one-time
gh repo create spurana --private --source=. --remote=origin --push
```

Done. Your code is now on GitHub.

---

## ✦ Part 3 — Connect to Vercel

1. Go to **https://vercel.com/new**
2. Click **Continue with GitHub** (if not already signed in)
3. Find the `spurana` repo in the list → click **Import**
4. **Project Name**: `spurana` (this becomes your subdomain — `spurana.vercel.app`)
5. **Framework Preset**: `Other`
6. **Root Directory**: `./`
7. Leave Build Command, Output Directory, Install Command — all blank
8. Expand **Environment Variables** → add:
   - **Key**: `ANTHROPIC_API_KEY`
   - **Value**: your `sk-ant-...` key
   - Make sure **Production**, **Preview**, **Development** are all checked
9. Click **Deploy**

After ~30 seconds you'll have a live URL.

---

## ✦ Part 4 — Add Vercel URL to Firebase authorized domains

Critical step — without this, **login will fail** on the Vercel URL.

1. Go to **https://console.firebase.google.com**
2. Select your project (`spurana-abe15` if using the default)
3. Sidebar → **Authentication** → **Settings** tab → scroll to **Authorized domains**
4. Click **Add domain** → enter `your-project.vercel.app` (whatever Vercel gave you)
5. Click **Add**

(If you add a custom domain later, repeat this step for the custom domain too.)

---

## ✦ Part 5 — Apply Firebase rules

Sidebar → **Realtime Database** → **Rules** tab → paste the contents of `firebase-rules.json` → **Publish**.

---

## ✦ Part 6 — Verify

Open your Vercel URL. Then:

### A · Static site loads
The login screen appears, orb pulses, no console errors (DevTools → Console).

### B · AI proxy works
DevTools → Console:

```js
fetch('/api/ai', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({systemPrompt: 'Reply gently', userText: 'Hi', maxTokens: 40})
}).then(r => r.json()).then(console.log)
```

Expected: `{text: "Hi there..."}` — if you get `{error: 'API key not configured'}`, the env var didn't load. Go to Vercel dashboard → project → Settings → Environment Variables → verify, then **Deployments** tab → ⋯ → **Redeploy**.

### C · Firebase auth works
Create an account on your live URL. Should succeed. If `auth/unauthorized-domain` — go back to Part 4.

### D · PWA installs
Open on phone (Chrome/Safari) → browser offers "Add to Home Screen" → install.

---

## ✦ Ongoing — Pushing updates

Every code change:

```bash
git add .
git commit -m "fix: improved divine voice timing"
git push
```

**Vercel auto-deploys** within ~30 seconds. You can watch the build at https://vercel.com/dashboard.

Every push to `main` becomes the production deployment. Every push to other branches becomes a **preview deployment** with its own URL (so you can test changes without affecting production).

### Hotfix workflow

```bash
git checkout -b fix/divine-voice-pitch
# edit files...
git add . && git commit -m "fix: kali pitch slightly higher"
git push -u origin fix/divine-voice-pitch
# → Vercel auto-creates a preview URL for testing
# → if good, merge to main on GitHub → auto-deploys to production
```

---

## ✦ Custom domain (optional)

Once you own a domain like `spurana.app`:

1. Vercel → project → **Settings** → **Domains** → **Add**
2. Enter your domain
3. Vercel shows DNS records → set them with your registrar
4. Wait ~5 min for propagation
5. SSL is auto-provisioned

Then add the custom domain to Firebase authorized domains (Part 4 again).

---

## ✦ Common Git problems

### "Permission denied (publickey)"
You're using SSH but haven't added your key to GitHub. Either:
- Use HTTPS instead: `git remote set-url origin https://github.com/YOUR-USERNAME/spurana.git`
- Or set up SSH: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

### "remote: Repository not found"
The repo URL is wrong, or you don't have access. Check `git remote -v` and update with `git remote set-url origin <correct URL>`.

### "Updates were rejected because the remote contains work..."
Someone else committed (or you're using an old fork). Run:
```bash
git pull --rebase origin main
git push
```

### Accidentally committed `.env`
```bash
git rm --cached .env
git commit -m "chore: remove .env from tracking"
git push
```
Then **rotate the leaked key immediately** at https://console.anthropic.com (anything ever committed to git is public-forever, even after deletion).

### Want to start fresh
```bash
rm -rf .git
git init
git branch -M main
git add .
git commit -m "Spurana ✦ fresh start"
# then re-create the GitHub repo or force-push to existing
```

---

## ✦ What's tracked vs ignored

**Tracked (committed to repo):**
- `index.html` · `manifest.json` · `service-worker.js`
- `api/ai.js` · `netlify/functions/ai.js`
- `vercel.json` · `netlify.toml`
- `firebase-rules.json`
- `.gitignore` · `.gitattributes` · `.env.example`
- All `.md` documentation files

**Ignored (never committed):**
- `.env` and any `.env.local` (your real API keys)
- `.vercel/` (Vercel CLI metadata)
- `.netlify/`, `.firebase/`
- `node_modules/`, lockfiles
- OS junk (`.DS_Store`, `Thumbs.db`)
- Editor configs (`.vscode/`, `.idea/`)

---

## ✦ A note on what's safe to commit publicly

The Firebase `apiKey` in `index.html` line ~875 **looks like a secret but is not** — Firebase API keys are public identifiers, and security is enforced by:
- Firebase Realtime Database rules (`firebase-rules.json`)
- Firebase Authorized Domains list (only your domains can use auth)

So even if your repo is public, your Firebase project is safe **as long as the rules are properly applied**. See Part 5.

The Anthropic API key, by contrast, **is a secret** — never commit it. It only lives in Vercel's environment variables, never in the codebase.

---

— ✦ —

**NWP · Keeper of this Realm**
