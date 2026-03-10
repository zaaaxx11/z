export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, max_tokens } = req.body;

  // Try Groq first, fallback to Gemini
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  // ── Try Groq ──────────────────────────────────────────
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

      // If rate limited, fall through to Gemini
      if (groqRes.status === 429) {
        console.log('Groq rate limited, falling back to Gemini...');
      } else if (groqRes.ok) {
        const text = groqData.choices?.[0]?.message?.content || '';
        return res.status(200).json({ content: [{ type: 'text', text }], provider: 'groq' });
      }
    } catch (e) {
      console.log('Groq error, falling back to Gemini:', e.message);
    }
  }

  // ── Fallback: Gemini ──────────────────────────────────
  if (geminiKey) {
    try {
      // Convert messages to Gemini format
      const geminiMessages = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: geminiMessages,
            generationConfig: {
              maxOutputTokens: max_tokens || 1000,
              temperature: 0.3,
            }
          }),
        }
      );

      const geminiData = await geminiRes.json();

      if (!geminiRes.ok) {
        return res.status(geminiRes.status).json({ error: geminiData.error?.message || 'Gemini API error' });
      }

      const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return res.status(200).json({ content: [{ type: 'text', text }], provider: 'gemini' });

    } catch (e) {
      return res.status(500).json({ error: e.message || 'Gemini API error' });
    }
  }

  return res.status(500).json({ error: 'No API key configured. Set GROQ_API_KEY or GEMINI_API_KEY.' });
}
