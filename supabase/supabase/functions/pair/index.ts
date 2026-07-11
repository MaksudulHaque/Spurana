// SPURANA · Edge Function: pair  (secure bonding of two souls)
// Deploy:  supabase functions deploy pair
// Secrets provided automatically by Supabase: SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY.
//
// Why an edge function: bonding writes a contact row for the OTHER
// person too, which RLS forbids a normal client from doing. The
// caller is identified ONLY from their JWT; the service_role key
// never leaves the server.
//
//   action "create"  → caller mints a short code (24h life)
//   action "redeem"  → caller enters a code; both contact rows +
//                      the shared conversation are created.
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// unambiguous alphabet (no 0/O/1/I) — 5 chars
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function makeCode(n = 5) {
  let s = "";
  const r = new Uint32Array(n);
  crypto.getRandomValues(r);
  for (let i = 0; i < n; i++) s += ALPHABET[r[i] % ALPHABET.length];
  return s;
}
function convIdFor(a: string, b: string) { return a < b ? `${a}_${b}` : `${b}_${a}`; }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const auth = req.headers.get("Authorization") || "";
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // identify the caller strictly from their token
    const asUser = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data: { user }, error: uErr } = await asUser.auth.getUser();
    if (uErr || !user) return json({ error: "unauthorized" }, 401);
    const uid = user.id;

    const admin = createClient(url, service);
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    // ---- CREATE: mint a fresh bond code ----
    if (action === "create") {
      const expires_at = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      let code = "";
      for (let attempt = 0; attempt < 5; attempt++) {
        code = makeCode();
        const { error } = await admin.from("pair_codes").insert({ code, creator_uid: uid, expires_at });
        if (!error) return json({ code, expires_at });
        if (!String(error.message || "").toLowerCase().includes("duplicate")) return json({ error: error.message }, 500);
      }
      return json({ error: "could not allocate a code, try again" }, 500);
    }

    // ---- REDEEM: bond the two souls ----
    if (action === "redeem") {
      const code = String(body.code || "").trim().toUpperCase();
      if (!code) return json({ error: "Enter a code" }, 400);

      const { data: row } = await admin.from("pair_codes").select("*").eq("code", code).maybeSingle();
      if (!row) return json({ error: "That code isn't valid." }, 404);
      if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
        await admin.from("pair_codes").delete().eq("code", code);
        return json({ error: "That code has expired." }, 410);
      }
      const creator = row.creator_uid as string;
      if (creator === uid) return json({ error: "You can't bond with yourself." }, 400);

      // names from profiles (best-effort)
      const { data: profs } = await admin.from("profiles").select("id,name").in("id", [creator, uid]);
      const nameOf = (id: string) => (profs?.find((p: { id: string; name: string }) => p.id === id)?.name) || "A soul";
      const creatorName = nameOf(creator);
      const redeemerName = nameOf(uid);

      const convId = convIdFor(creator, uid);
      await admin.from("conversations").upsert({ conv_id: convId, updated_at: new Date().toISOString() }, { onConflict: "conv_id" });
      await admin.from("contacts").upsert([
        { owner_uid: creator, contact_uid: uid, contact_name: redeemerName },
        { owner_uid: uid, contact_uid: creator, contact_name: creatorName },
      ], { onConflict: "owner_uid,contact_uid" });
      await admin.from("pair_codes").delete().eq("code", code); // one-time use

      return json({ ok: true, conv_id: convId, partner: { uid: creator, name: creatorName } });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { ...CORS, "content-type": "application/json" } });
}
