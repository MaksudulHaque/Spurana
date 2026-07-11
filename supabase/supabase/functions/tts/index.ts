// ============================================================
// SPURANA · supabase/functions/tts/index.ts
// Secure Google Cloud Text-to-Speech proxy.
//
// The API key NEVER reaches the browser or the repo. Set it once
// as a Supabase secret:
//     supabase secrets set GOOGLE_TTS_KEY=your_key
//   (or Dashboard → Edge Functions → Secrets → add GOOGLE_TTS_KEY)
//
// The app calls this with { text, lang:'en'|'bn', gender:'her'|'him' }
// and gets back { audio } = base64 MP3. Real human voices:
//   en → Neural2,  bn → WaveNet.
// ============================================================
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const KEY = Deno.env.get("GOOGLE_TTS_KEY") || "";

const VOICES: Record<string, { name: string; lang: string }> = {
  "en-her": { name: "en-US-Neural2-F", lang: "en-US" },
  "en-him": { name: "en-US-Neural2-D", lang: "en-US" },
  "bn-her": { name: "bn-IN-Wavenet-A", lang: "bn-IN" },
  "bn-him": { name: "bn-IN-Wavenet-B", lang: "bn-IN" },
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function j(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (!KEY) return j({ error: "GOOGLE_TTS_KEY not set" }, 500);
    const { text, lang, gender, rate } = await req.json().catch(() => ({}));
    if (!text || typeof text !== "string") return j({ error: "no text" }, 400);

    const k = (lang === "bn" ? "bn" : "en") + "-" + (gender === "him" ? "him" : "her");
    const v = VOICES[k] || VOICES["en-her"];

    const body = {
      input: { text: text.slice(0, 900) },
      voice: { languageCode: v.lang, name: v.name },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: typeof rate === "number" ? rate : (lang === "bn" ? 0.9 : 0.86),
        pitch: gender === "him" ? -2.0 : 0.0,
      },
    };

    const r = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize?key=" + KEY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!r.ok || !d.audioContent) {
      return j({ error: (d && d.error && d.error.message) || "tts failed" }, 500);
    }
    return j({ audio: d.audioContent });
  } catch (e) {
    return j({ error: String(e) }, 500);
  }
});
