import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.post('/summarize', async (req, res) => {
  try {
    const { content, mode } = req.body;

    console.log('🧪 MODE RECEIVED:', mode);

    if (!content) {
      return res.status(400).json({ error: 'No content provided' });
    }

    // ✅ Decide bullet count
    const bulletCount = Number(mode) === 3 ? 3 : 5;

    // ✅ Call OpenRouter
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: `You are a strict summarizer.

Summarize the text below into EXACTLY ${bulletCount} bullet points.

Rules:
- Output ONLY bullet points
- Do NOT exceed ${bulletCount} bullets
- Each bullet must be short and clear
- Use "-" at the start of each bullet

Text:
${content}`,
            },
          ],
        }),
      },
    );

    const data = await response.json();

    console.log('🧠 RAW AI RESPONSE:', JSON.stringify(data, null, 2));

    const rawSummary = data.choices?.[0]?.message?.content || '';

    console.log('🧾 RAW SUMMARY TEXT:', rawSummary);

    // ✅ Step 1: Normalize lines (accept ANY format)
    let lines = rawSummary
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // ✅ Step 2: If AI returned paragraph instead of bullets
    if (lines.length === 1) {
      lines = rawSummary
        .split('. ')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    }

    // ✅ Step 3: Clean bullets (remove numbering like 1. 2. etc.)
    lines = lines.map((line) => line.replace(/^\d+[\).\s-]*/, '').trim());

    // ✅ Step 4: Enforce EXACT bullet count
    const trimmedLines = lines.slice(0, bulletCount);

    // ✅ Step 5: Re-add "-" bullet format
    const finalSummary =
      trimmedLines.length > 0
        ? trimmedLines.map((line) => `- ${line}`).join('\n')
        : 'No summary generated';

    console.log('✅ FINAL SUMMARY:', finalSummary);

    res.json({ summary: finalSummary });
  } catch (error) {
    console.error('❌ AI Error:', error);
    res.status(500).json({ error: 'AI request failed' });
  }
});

app.listen(3000, () => {
  console.log('🚀 Backend running on http://localhost:3000');
});
