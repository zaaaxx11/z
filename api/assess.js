export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, max_tokens } = req.body;
  const kimiKey = process.env.KIMI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  // ── Try Kimi first ────────────────────────────────────
  if (kimiKey) {
    try {
      const kimiRes = await fetch('https://api.moonshot.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${kimiKey}`,
        },
        body: JSON.stringify({
          model: 'moonshot-v1-8k',
          messages,
          max_tokens: max_tokens || 1000,
          temperature: 0.3,
        }),
      });

      const kimiData = await kimiRes.json();

      if (kimiRes.status === 429) {
        console.log('Kimi rate limited, falling back to Groq...');
      } else if (kimiRes.ok) {
        const text = kimiData.choices?.[0]?.message?.content || '';
        return res.status(200).json({ content: [{ type: 'text', text }], provider: 'kimi' });
      }
    } catch (e) {
      console.log('Kimi error, falling back to Groq:', e.message);
    }
  }

  // ── Fallback: Groq ────────────────────────────────────
  if (groqKey) {
    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          max_tokens: max_tokens || 1000,
          temperature: 0.3,
        }),
      });

      const groqData = await groqRes.json();

      if (!groqRes.ok) {
        return res.status(groqRes.status).json({
          error: groqData.error?.message || 'Groq API error',
        });
      }

      const text = groqData.choices?.[0]?.message?.content || '';
      return res.status(200).json({ content: [{ type: 'text', text }], provider: 'groq' });
    } catch (e) {
      return res.status(500).json({ error: e.message || 'Groq API error' });
    }
  }

  return res.status(500).json({ error: 'No API key configured. Set KIMI_API_KEY or GROQ_API_KEY.' });
}
