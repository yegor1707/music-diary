import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] ?? "dummy",
});

const INSPIRATIONS = [
  "a profound quote from a famous classical composer (Beethoven, Chopin, Mozart, Bach, Schubert, Brahms, Debussy, Liszt, Schumann, or Tchaikovsky) about music, composition, or the nature of art",
  "a fascinating musical fact about classical music history, theory, or a famous work",
  "an interesting anecdote about a famous classical composer and one of their well-known compositions",
  "a surprising or little-known fact about how a famous classical piece was composed or received",
  "a deep insight about music's relationship to emotion, time, or human experience from a classical master",
];

router.get("/inspiration", async (req, res) => {
  try {
    const prompt = INSPIRATIONS[Math.floor(Math.random() * INSPIRATIONS.length)];

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 300,
      messages: [
        {
          role: "system",
          content: `You are a knowledgeable music scholar with deep expertise in classical music. 
Respond ONLY with a valid JSON object and nothing else. Do not add markdown code fences.`,
        },
        {
          role: "user",
          content: `Generate ${prompt}. 
Return a JSON object with these fields:
- "type": one of "quote", "fact", or "recommendation" 
- "content": the main text (1-3 sentences max, vivid and compelling)
- "author": the composer or person's name (null if it's a general fact)
- "workTitle": the name of the musical work being referenced (null if not applicable)
- "youtubeId": if this mentions a specific famous piece with a well-known YouTube recording, include the YouTube video ID (just the ID, not the full URL); otherwise null

JSON only, no extra text.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {
        type: "fact",
        content: raw,
        author: null,
        workTitle: null,
        youtubeId: null,
      };
    }

    res.json({
      type: parsed.type ?? "fact",
      content: parsed.content ?? "",
      author: parsed.author ?? null,
      workTitle: parsed.workTitle ?? null,
      youtubeId: parsed.youtubeId ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Inspiration generation failed");
    res.status(500).json({ error: "Could not generate inspiration" });
  }
});

export default router;
