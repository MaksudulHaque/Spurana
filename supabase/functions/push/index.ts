// ============================================================
// SPURANA · supabase/functions/push/index.ts
// Called by a database trigger on every new message. Looks up the
// recipient's device tokens and delivers an FCM push (HTTP v1).
//
// Required secret (Dashboard → Edge Functions → push → Secrets):
//   FCM_SERVICE_ACCOUNT = the full service-account JSON from
//   Firebase Console → Project settings → Service accounts →
//   "Generate new private key".
//
// The trigger authenticates with a shared header, x-push-secret.
// ============================================================
import { createClient } from "npm:@supabase/supabase-js@2";

const PUSH_SECRET = "777bd36c7b84a0e900c42c11d81da596cc6453b56c436178";

const SA_RAW = Deno.env.get("FCM_SERVICE_ACCOUNT") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const db = createClient(SUPABASE_URL, SERVICE_KEY);

// ── Google OAuth (service account → access token), cached ──
let cached: { token: string; exp: number } | null = null;

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function pemToDer(pem: string): Uint8Array {
  const body = pem.replace(/-----[A-Z ]+-----/g, "").replace(/\s+/g, "");
  const bin = atob(body);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function accessToken(): Promise<{ token: string; project: string }> {
  const sa = JSON.parse(SA_RAW);
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.exp > now + 60) return { token: cached.token, project: sa.project_id };

  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claims = b64url(new TextEncoder().encode(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3500,
  })));
  const unsigned = header + "." + claims;
  const key = await crypto.subtle.importKey(
    "pkcs8", pemToDer(sa.private_key.replace(/\\n/g, "\n")),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned)));
  const jwt = unsigned + "." + b64url(sig);

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=" + encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer") + "&assertion=" + jwt,
  });
  const d = await r.json();
  if (!r.ok || !d.access_token) throw new Error("oauth failed: " + JSON.stringify(d));
  cached = { token: d.access_token, exp: now + (d.expires_in || 3500) };
  return { token: d.access_token, project: sa.project_id };
}

async function sendTo(token: string, title: string, body: string, conv: string, auth: { token: string; project: string }) {
  const r = await fetch("https://fcm.googleapis.com/v1/projects/" + auth.project + "/messages:send", {
    method: "POST",
    headers: { Authorization: "Bearer " + auth.token, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        data: { conv: String(conv || "") },
        android: { priority: "HIGH", notification: { channel_id: "messages", default_vibrate_timings: true } },
      },
    }),
  });
  if (!r.ok) {
    const e = await r.text();
    if (/UNREGISTERED|INVALID_ARGUMENT|NOT_FOUND/i.test(e)) {
      await db.from("push_tokens").delete().eq("token", token); // stale device — clean up
    }
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  try {
    if (req.headers.get("x-push-secret") !== PUSH_SECRET) {
      return new Response("forbidden", { status: 403 });
    }
    if (!SA_RAW) return new Response(JSON.stringify({ error: "FCM_SERVICE_ACCOUNT not set" }), { status: 500 });

    const { record } = await req.json().catch(() => ({ record: null }));
    if (!record || !record.conv_id || !record.uid) return new Response("no record", { status: 400 });

    // recipient = the other uid(s) in "uidA_uidB"
    const recipients = String(record.conv_id).split("_").filter((u: string) => u && u !== record.uid);
    if (!recipients.length) return new Response("no recipient", { status: 200 });

    const { data: rows } = await db.from("push_tokens").select("token").in("uid", recipients);
    if (!rows || !rows.length) return new Response("no tokens", { status: 200 });

    const title = record.name || "Spurana";
    const body = record.type && record.type !== "text" ? "\u2726 sent you something" : String(record.text || "").slice(0, 120);
    const auth = await accessToken();
    let ok = 0;
    for (const r of rows) if (await sendTo(r.token, title, body, record.conv_id, auth)) ok++;
    return new Response(JSON.stringify({ sent: ok, of: rows.length }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
