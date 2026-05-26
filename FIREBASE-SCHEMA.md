# Spurana ✦ Firebase Schema

Complete documentation of every node in your Firebase Realtime Database (`spurana-abe15` · `asia-southeast1`).

This is the **structural reference** — what data lives where, who can read it, who can write it, what shape it takes. Apply the matching `firebase-rules.json` to enforce these contracts on the server side.

---

## Database tree (top-level overview)

```
spurana-abe15/
├── users/                       ← per-user profiles + memories
│   └── {uid}/
│       ├── name                 string · display name
│       ├── email                string
│       ├── avatar               string · URL to Firebase Storage
│       ├── online               boolean · presence state
│       ├── lastSeen             number · epoch ms
│       ├── deity                string · selected deity key
│       ├── memories             array<{text, ts, uid}> · last 100 text messages
│       └── hc_logs/             ← Heart-Centred session logs (auto-keyed pushes)
│           └── {pushKey}/
│               ├── practice         string · practice key
│               ├── practiceName     string
│               ├── mode             "solo" | "couple"
│               ├── ts               number · epoch ms
│               ├── durationMs       number
│               ├── rating           number · 0-5
│               └── note             string · max 500 chars
│
├── messages/                    ← chat messages (auto-keyed pushes)
│   └── {pushKey}/
│       ├── uid                  string · sender uid
│       ├── name                 string · sender display name
│       ├── text                 string · message body (optional if type≠'text')
│       ├── type                 "text" | "image" | "video" | "voice" | "file"
│       ├── url                  string · Storage URL (for media types)
│       ├── ts                   number · epoch ms
│       ├── deleted              boolean · soft-delete flag
│       ├── editedAt             number · epoch ms (optional)
│       ├── room                 string · optional room ID
│       └── reactions/
│           └── {senderUid}      string · emoji (e.g. "❤", "🙏")
│
├── presence/                    ← online status (one entry per uid)
│   └── {uid}/
│       ├── online               boolean
│       └── lastSeen             number · epoch ms
│
├── typing/                      ← typing indicators (transient)
│   └── {uid}/
│       └── isTyping             boolean
│
├── soulCard/                    ← shared daily soul card (overwritten daily)
│   ├── ts                       number · when drawn
│   ├── deity                    string
│   ├── meaning                  string · current day's wisdom
│   └── drawnBy                  string · uid who drew it
│
├── whispers/                    ← Vanish Mode / Whisper Mode (ephemeral)
│   └── {pushKey}/
│       ├── uid                  string
│       ├── text                 string
│       └── expiresAt            number · auto-cleanup target
│
├── shared/                      ← shared 2-soul session state
│   ├── memorableDays/
│   │   └── {pushKey}/
│   │       ├── title            string
│   │       ├── date             string · "YYYY-MM-DD"
│   │       ├── note             string
│   │       └── createdBy        string · uid
│   │
│   ├── schedule/
│   │   └── {pushKey}/
│   │       ├── ts               number · epoch ms (when to fire)
│   │       ├── text             string · message to send
│   │       ├── createdBy        string · uid
│   │       └── delivered        boolean
│   │
│   ├── watch_session/           ← Watch Together sync state
│   │   ├── videoUrl             string
│   │   ├── videoId              string
│   │   ├── type                 "yt" | "video" | "iframe"
│   │   ├── isPlaying            boolean
│   │   ├── currentTime          number · seconds
│   │   ├── lastUpdated          number · epoch ms
│   │   ├── lastBy               string · uid
│   │   └── lastByName           string
│   │
│   └── listen_session/          ← Listen Together sync state
│       ├── url                  string
│       ├── type                 "spotify" | "yt" | "audio" | "iframe"
│       ├── isPlaying            boolean
│       ├── currentTime          number · seconds
│       ├── lastUpdated          number · epoch ms
│       ├── lastBy               string · uid
│       └── lastByName           string
│
└── rtc/                         ← WebRTC signaling
    ├── activeCall/              ← Sacred Call / Vision Call
    │   ├── type                 "audio" | "video"
    │   ├── callerUID            string
    │   ├── callerName           string
    │   ├── startedAt            number
    │   ├── offer/               { type, sdp }
    │   ├── answer/              { type, sdp }
    │   ├── iceFromCaller/       (push children)
    │   └── iceFromCallee/       (push children)
    │
    └── audioBroadcast/          ← Audio Broadcast (one-way)
        ├── senderUID            string
        ├── senderName           string
        ├── startedAt            number
        ├── offer/               { type, sdp }
        ├── answer/              { type, sdp }
        ├── iceFromSender/       (push children)
        └── iceFromReceiver/     (push children)
```

---

## Firebase Storage tree

```
spurana-abe15.appspot.com/
├── avatars/
│   └── {uid}                    ← profile pictures (any image format)
├── voice/
│   └── {uid}/
│       └── {timestamp}.{ext}    ← voice messages (.webm / .mp4 / .m4a)
└── media/
    └── {uid}/
        └── {timestamp}_{filename} ← images, files attached to chat
```

---

## Per-node access policy (enforced by rules)

| Path | Read | Write | Notes |
|---|---|---|---|
| `users/{uid}` | authenticated users | only owner (uid match) | Profile + memories |
| `users/{uid}/hc_logs` | only owner | only owner | Private practice journal |
| `messages` | authenticated users | authenticated; must include own uid as sender | Soft-delete only — no destructive deletes |
| `messages/{key}/reactions/{uid}` | authenticated | only owner of that reaction | One reaction per user per message |
| `presence/{uid}` | authenticated | only owner | Online status |
| `typing/{uid}` | authenticated | only owner | Typing indicator |
| `soulCard` | authenticated | authenticated (no restriction — two-soul app) | Shared daily draw |
| `whispers` | authenticated | authenticated | Auto-expire client-side |
| `shared/*` | authenticated | authenticated | Joint state — both can write |
| `rtc/activeCall` | authenticated | authenticated | Signaling — short-lived |
| `rtc/audioBroadcast` | authenticated | authenticated | Same as above |

The model: **two souls share most things, except their own profile and journal.**

---

## Indexes (for fast queries)

Add these to your rules file so Firebase doesn't warn about un-indexed queries:

| Path | Index by |
|---|---|
| `messages` | `ts` (sort messages by time) |
| `whispers` | `expiresAt` (for client-side cleanup queries) |
| `shared/schedule` | `ts` (when message is supposed to fire) |
| `shared/memorableDays` | `date` (sort by date) |

---

## How to apply this in Firebase Console

1. Open https://console.firebase.google.com
2. Pick the `spurana-abe15` project
3. Sidebar → **Realtime Database** → **Rules** tab
4. Paste the contents of `firebase-rules.json`
5. Click **Publish**

That's it. The database tree itself grows naturally as the app writes — you don't need to create the nodes manually. The rules enforce the schema at write time.

---

## Field validation summary

The rules file enforces these field constraints:

- `messages.uid` must equal `auth.uid` (no impersonation)
- `messages.text` ≤ 4000 chars
- `messages.type` ∈ {text, image, video, voice, file}
- `messages.ts` must be a number (server-trusted ideally — use `firebase.database.ServerValue.TIMESTAMP`)
- `users/{uid}` writes only by `auth.uid === uid`
- `users.email` must match a sensible email pattern (optional — relax for demo accounts)
- `hc_logs.rating` ∈ {0, 1, 2, 3, 4, 5}
- `hc_logs.note` ≤ 500 chars
- `whispers` entries should include `expiresAt` (Date.now() + N hours)

---

## What I can NOT do for you

- **I can't connect to your Firebase project** — no creds, no admin SDK in my tools
- **I can't run write/seed/migration scripts** for you — but I can write the script
- **I can't view your actual data** — the URLs in the rules are just my read of the codebase
- **I can't deploy the rules** — you publish via the Firebase Console (it's 2 clicks)

What I CAN do, and have done here:
- Mapped every path the app touches
- Designed the security/access model
- Generated the rules file
- Documented every field shape

Apply once, then never touch it again unless you add a new feature with a new top-level node.

— ✦ —

**NWP · Keeper of this Realm**
