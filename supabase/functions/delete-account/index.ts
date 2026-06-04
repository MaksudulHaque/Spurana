// SPURANA · Edge Function: delete-account  (GDPR "right to be forgotten")
// Deploy:  supabase functions deploy delete-account
// Secrets are provided automatically by Supabase: SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY.
// SECURITY: the caller is identified ONLY from their JWT — a user can
// delete their OWN account and nothing else. service_role never leaves
// the server.
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const auth = req.headers.get("Authorization") || "";
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1) identify the caller strictly from their token
    const asUser = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data: { user }, error } = await asUser.auth.getUser();
    if (error || !user) return json({ error: "unauthorized" }, 401);
    const uid = user.id;

    // 2) delete their data + auth row using the server-only key
    const admin = createClient(url, service);
    await admin.from("messages").delete().eq("uid", uid);
    await admin.from("contacts").delete().eq("uid", uid);
    await admin.from("hc_logs").delete().eq("uid", uid);
    await admin.from("cp_logs").delete().eq("uid", uid);
    await admin.from("activity_log").delete().eq("uid", uid);
    await admin.from("profiles").delete().eq("id", uid);
    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) return json({ error: delErr.message }, 500);

    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { ...CORS, "content-type": "application/json" } });
}
