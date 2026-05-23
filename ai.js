// Spurana ✦ Anthropic API proxy — Vercel serverless function
//
// Accepts either:
//   · a server-side ANTHROPIC_API_KEY env var (set in Vercel dashboard), OR
//   · a clientKey in the request body (so a user can pay for their own usage)
//
// Client-supplied keys always win when present.
//
// Deploy: this file lives at /api/ai.js so it's automatically exposed
// at https://<your-app>.vercel.app/api/ai
//
// Uses Node.js 18+ runtime (default on Vercel) — has fetch built-in.

export default async function handler(req, res) {
  // CORS preflight (in case the app is embedded somewhere)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Vercel parses JSON automatically when Content-Type is application/json
    const body = req.body || {};
    const { systemPrompt, userText, maxTokens, clientKey } = body;

    const apiKey = (clientKey && clientKey.trim()) || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'API key not configured. Set ANTHROPIC_API_KEY in Vercel project settings, or pass clientKey in request body.'
      });
    }

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens || 200,
        system: systemPrompt || '',
        messages: [{ role: 'user', content: userText || '' }]
      })
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      return res.status(resp.status).json({
        error: `Anthropic API returned ${resp.status}`,
        detail: errText.slice(0, 500)
      });
    }

    const data = await resp.json();
    const text = (data && data.content && data.content[0] && data.content[0].text) || '';

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({
      error: e.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (e.stack || '') : undefined
    });
  }
}

// Vercel function config — runs in Node.js runtime
export const config = {
  maxDuration: 30 // seconds — Anthropic responses can take up to ~25s
};
