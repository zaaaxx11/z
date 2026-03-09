export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  
  // Debug: log what env vars are available
  const envDebug = Object.keys(process.env).filter(k => k.toLowerCase().includes('groq'));
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API key not configured',
      debug_groq_keys: envDebug,
      debug_all_custom: Object.keys(process.env).filter(k => !['PATH','HOME','USER','SHELL','PWD','LANG','NODE_ENV','VERCEL','VERCEL_ENV','VERCEL_URL','VERCEL_REGION'].includes(k))
    });
  }

  try {
    const { messages, max_tokens } = req.body;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        max_tokens: max_tokens || 1000,
        temperature: 0.3,
      }),
    });

    const groqData = await groqResponse.json();

    if (!groqResponse.ok) {
      return res.status(groqResponse.status).json({ error: groqData.error?.message || 'Groq API error' });
    }

    const text = groqData.choices?.[0]?.message?.content || '';
    return res.status(200).json({
      content: [{ type: 'text', text }]
    });

  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to contact Groq API' });
  }
}
