// Spurana ✦ AI proxy — Google Gemini (free tier)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { systemPrompt, userText, maxTokens, clientKey } = req.body || {};
    const apiKey = (clientKey && clientKey.trim()) || process.env.GEMINI_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

    const prompt = systemPrompt ? `${systemPrompt}\n\n${userText}` : userText;

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt || '' }] }],
          generationConfig: { maxOutputTokens: maxTokens || 200 }
        })
      }
    );

    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Unknown error' });
  }
}
