import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] ?? "dummy",
});

type InspirationItem = {
  type: "quote" | "fact" | "recommendation";
  content: string;
  author: string | null;
  workTitle: string | null;
  youtubeId: string | null;
};

const FALLBACK_INSPIRATIONS: InspirationItem[] = [
  { type: "quote", content: "Without music, life would be a mistake.", author: "Friedrich Nietzsche", workTitle: null, youtubeId: null },
  { type: "fact", content: "The violin has not changed significantly in design since the 16th century, yet its complexity requires over 70 individual pieces of wood to construct.", author: null, workTitle: null, youtubeId: null },
  { type: "quote", content: "Jazz is not just music, it's a way of life, it's a way of looking at the world.", author: "Ray Charles", workTitle: null, youtubeId: null },
  { type: "fact", content: "Paganini's 24 Caprices for solo violin were considered impossible to perform when written — they pushed technical limits so far that many believed the devil himself had written them.", author: null, workTitle: "24 Caprices, Op. 1", youtubeId: "dDFPTDOOB4k" },
  { type: "quote", content: "I know that the twelve notes in each octave and the variety of rhythm offer me opportunities that all of human genius will never exhaust.", author: "Igor Stravinsky", workTitle: null, youtubeId: null },
  { type: "fact", content: "Miles Davis's 'Kind of Blue' is the best-selling jazz album of all time, recorded in just two sessions with almost no rehearsal — the musicians sight-read most of it.", author: null, workTitle: "Kind of Blue", youtubeId: "ylXk1LBvIqU" },
  { type: "quote", content: "The cello is like a beautiful woman who has not grown older, but younger with time, more slender, more supple, more graceful.", author: "Pablo Casals", workTitle: null, youtubeId: null },
  { type: "fact", content: "Bach's Goldberg Variations were reportedly commissioned to help an insomniac count sleep — the result became one of the most intellectually rich works in the keyboard repertoire.", author: null, workTitle: "Goldberg Variations, BWV 988", youtubeId: "Ah392lnFHxM" },
  { type: "recommendation", content: "Explore Shostakovich's String Quartet No. 8 — written in three days, it is a haunting self-portrait filled with musical ciphers of the composer's own name.", author: "Dmitri Shostakovich", workTitle: "String Quartet No. 8 in C minor, Op. 110", youtubeId: "mHDg2oMCPiU" },
  { type: "fact", content: "Flamenco guitar technique includes 'rasgueado' — a rolling finger strum executed at incredible speed — which took centuries to develop through the oral tradition of the Romani people in Andalusia.", author: null, workTitle: null, youtubeId: null },
  { type: "quote", content: "In music, silence is more important than sound.", author: "Miles Davis", workTitle: null, youtubeId: null },
  { type: "fact", content: "Beethoven continued composing after becoming almost completely deaf, writing his 9th Symphony — including the iconic 'Ode to Joy' — while unable to hear a single note.", author: null, workTitle: "Symphony No. 9, Op. 125", youtubeId: "t3217H8JppI" },
  { type: "recommendation", content: "Listen to Ravel's Bolero — a single melody repeated 18 times over 15 minutes with only growing orchestration. Ravel himself called it 'a piece for orchestra without music.'", author: "Maurice Ravel", workTitle: "Boléro", youtubeId: "3yYEYpYABOM" },
  { type: "fact", content: "John Coltrane's 'Giant Steps' introduced chord progressions so complex and fast-moving that most jazz musicians had never seen anything like them — the harmonic system is still called 'Coltrane changes.'", author: null, workTitle: "Giant Steps", youtubeId: "2kotK9FNEYU" },
  { type: "quote", content: "The guitar is a small orchestra. It is polyphonic. Every string is a different colour, a different voice.", author: "Andrés Segovia", workTitle: null, youtubeId: null },
];

const pool: InspirationItem[] = [];
const POOL_TARGET = 25;
let isGenerating = false;

const PROMPT_TOPICS = [
  { type: "quote", prompt: "a striking quote from a legendary jazz musician (Miles Davis, John Coltrane, Bill Evans, Thelonious Monk, Duke Ellington, Charlie Parker, or Ella Fitzgerald) about improvisation, music, or creativity" },
  { type: "fact", prompt: "a fascinating fact about violin technique, history, or a famous violinist (Paganini, Heifetz, Oistrakh, Hilary Hahn, or Itzhak Perlman) and a specific work they are known for" },
  { type: "recommendation", prompt: "a compelling recommendation to listen to a specific orchestral work — choose from romantic, impressionist, or 20th-century repertoire — with a vivid description of what makes it unique" },
  { type: "fact", prompt: "a surprising fact about how a famous piece of music — from any genre including jazz, classical, or folk — was composed, received, or discovered" },
  { type: "quote", prompt: "a profound quote from a classical composer (Brahms, Debussy, Ravel, Shostakovich, Prokofiev, Bartók, or Sibelius) about their compositional process or philosophy" },
  { type: "fact", prompt: "an astonishing fact about cello repertoire, technique, or a legendary cellist such as Rostropovich, Yo-Yo Ma, or Jacqueline du Pré" },
  { type: "recommendation", prompt: "a recommendation to explore a famous guitar work — classical, flamenco, or jazz — with a vivid description of the performer and what makes the recording special" },
  { type: "fact", prompt: "a fascinating fact about percussion, drums, or rhythm in music — could involve a famous drummer like Elvin Jones, Gene Krupa, or Buddy Rich, or a rhythmic innovation in world music" },
  { type: "quote", prompt: "a memorable quote from a 20th-century composer (Stravinsky, Bartók, Messiaen, Britten, or Arvo Pärt) about the nature of composition or musical innovation" },
  { type: "fact", prompt: "an interesting fact about opera — involving Verdi, Puccini, Wagner, Mozart, or a famous soprano or tenor — and a specific famous aria or scene" },
  { type: "recommendation", prompt: "a recommendation to listen to a jazz standard or album by a specific artist, explaining what makes this recording a milestone in musical history" },
  { type: "fact", prompt: "a surprising fact about the piano — its invention, its mechanics, or a famous pianist such as Glenn Gould, Martha Argerich, Horowitz, or Pollini" },
  { type: "quote", prompt: "an inspiring quote from a wind or brass musician — a famous oboist, clarinettist, horn player, or trumpet player — about their instrument or their musical experience" },
  { type: "fact", prompt: "a fascinating fact about chamber music — a string quartet, piano trio, or quintet — and a specific famous ensemble or landmark work" },
  { type: "recommendation", prompt: "a recommendation to explore a baroque masterwork — by Bach, Handel, Vivaldi, Telemann, or Purcell — describing its structure and emotional impact in vivid terms" },
];

async function generateOne(): Promise<InspirationItem | null> {
  const topic = PROMPT_TOPICS[Math.floor(Math.random() * PROMPT_TOPICS.length)];
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 1500,
      messages: [
        {
          role: "system",
          content: `You are a knowledgeable music scholar with broad expertise across classical, jazz, folk, and world music. Respond ONLY with a valid JSON object and nothing else. Do not add markdown code fences.`,
        },
        {
          role: "user",
          content: `Generate ${topic.prompt}.
Return a JSON object with these exact fields:
- "type": "${topic.type}"
- "content": the main text (2-4 sentences, vivid and compelling, specific details)
- "author": the musician or composer's name (null only if it's truly a general fact with no specific person)
- "workTitle": the name of the specific musical work being referenced (null if not applicable)
- "youtubeId": a real YouTube video ID (11 characters) for a well-known recording of the mentioned piece — provide one whenever a specific work is mentioned; null only if no specific piece is referenced

JSON only, no extra text.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!raw) return null;

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }

    const content = String(parsed.content ?? "").trim();
    if (!content) return null;

    return {
      type: (parsed.type as InspirationItem["type"]) ?? topic.type,
      content,
      author: parsed.author ? String(parsed.author) : null,
      workTitle: parsed.workTitle ? String(parsed.workTitle) : null,
      youtubeId: parsed.youtubeId ? String(parsed.youtubeId) : null,
    };
  } catch {
    return null;
  }
}

async function fillPool() {
  if (isGenerating) return;
  isGenerating = true;
  try {
    const needed = POOL_TARGET - pool.length;
    for (let i = 0; i < needed; i++) {
      const item = await generateOne();
      if (item) pool.push(item);
    }
  } finally {
    isGenerating = false;
  }
}

fillPool().catch(() => {});

router.get("/inspiration", (req, res) => {
  let item: InspirationItem;

  if (pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    item = pool.splice(idx, 1)[0];
    if (pool.length < POOL_TARGET / 2 && !isGenerating) {
      fillPool().catch(() => {});
    }
  } else {
    const idx = Math.floor(Math.random() * FALLBACK_INSPIRATIONS.length);
    item = FALLBACK_INSPIRATIONS[idx];
  }

  res.json(item);
});

export default router;
