// SPURANA · Edge Function: ai-teacher
// Deploy:  supabase functions deploy ai-teacher
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// Gives the Divine Guide live conversation. Without it, the app
// falls back to in-spirit wisdom automatically.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { system, messages } = await req.json();
    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) return json({ error: "ANTHROPIC_API_KEY not set" }, 500);

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-3-5-haiku-latest",
        max_tokens: 300,
        system: (system || "You are a gentle contemplative guide.") +
          " You are an AI interpretation offered for reflection, not the historical or divine figure. Be warm, brief, and never claim real authority.",
        messages: (messages || []).map((m: any) => ({ role: m.role, content: String(m.content) })),
      }),
    });
    const data = await resp.json();
    const reply = data?.content?.map((b: any) => (b.type === "text" ? b.text : "")).join("").trim();
    if (!reply) return json({ error: "no reply", detail: data }, 502);
    return json({ reply });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...CORS, "content-type": "application/json" } });
}
