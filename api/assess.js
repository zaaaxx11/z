export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, max_tokens } = req.body;
  const kimiKey = process.env.KIMI_API_KEY;

  if (!kimiKey) {
    return res.status(500).json({ error: 'No API key configured. Set KIMI_API_KEY.' });
  }

  try {
    const kimiRes = await fetch('https://api.moonshot.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${kimiKey}`,
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k', // model paling murah
        messages,
        max_tokens: max_tokens || 1000,
        temperature: 0.3,
      }),
    });

    const kimiData = await kimiRes.json();

    if (!kimiRes.ok) {
      return res.status(kimiRes.status).json({
        error: kimiData.error?.message || 'Kimi API error',
      });
    }

    const text = kimiData.choices?.[0]?.message?.content || '';
    return res.status(200).json({ content: [{ type: 'text', text }], provider: 'kimi' });

  } catch (e) {
    return res.status(500).json({ error: e.message || 'Kimi API error' });
  }
}
