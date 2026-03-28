import { Router, type IRouter } from "express";
import OpenAI from "openai";

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

const SEED_INSPIRATIONS: InspirationItem[] = [
  { type: "quote", content: "Without music, life would be a mistake.", author: "Friedrich Nietzsche", workTitle: null, youtubeId: null },
  { type: "fact", content: "The violin has not changed significantly in design since the 16th century, yet its complexity requires over 70 individual pieces of wood to construct.", author: null, workTitle: null, youtubeId: null },
  { type: "quote", content: "Jazz is not just music, it's a way of life, it's a way of looking at the world.", author: "Ray Charles", workTitle: null, youtubeId: null },
  { type: "fact", content: "Paganini's 24 Caprices for solo violin were considered unplayable when written — many believed only the devil could have given him such technique.", author: "Niccolò Paganini", workTitle: "24 Caprices, Op. 1", youtubeId: "dDFPTDOOB4k" },
  { type: "quote", content: "I know that the twelve notes in each octave and the variety of rhythm offer me opportunities that all of human genius will never exhaust.", author: "Igor Stravinsky", workTitle: null, youtubeId: null },
  { type: "fact", content: "Miles Davis's 'Kind of Blue' was recorded in just two sessions with almost no rehearsal — the musicians sight-read most of the material — and became the best-selling jazz album of all time.", author: "Miles Davis", workTitle: "Kind of Blue", youtubeId: "ylXk1LBvIqU" },
  { type: "quote", content: "The cello is like a beautiful woman who has not grown older, but younger with time, more slender, more supple, more graceful.", author: "Pablo Casals", workTitle: null, youtubeId: null },
  { type: "fact", content: "Bach's Goldberg Variations were reportedly written for an insomniac count who needed something to ease his sleepless nights — the result became one of the most intellectually rich works in the keyboard repertoire.", author: "Johann Sebastian Bach", workTitle: "Goldberg Variations, BWV 988", youtubeId: "Ah392lnFHxM" },
  { type: "recommendation", content: "Shostakovich's String Quartet No. 8 was written in just three days and functions as a secret autobiography — encoded with the composer's musical initials, it is one of the most intensely personal works in the chamber music canon.", author: "Dmitri Shostakovich", workTitle: "String Quartet No. 8, Op. 110", youtubeId: "mHDg2oMCPiU" },
  { type: "fact", content: "Flamenco guitar's 'rasgueado' technique — a lightning-fast rolling finger strum — took centuries to develop through the oral tradition of Romani musicians in Andalusia and remains one of the most demanding techniques in all of guitar playing.", author: null, workTitle: null, youtubeId: null },
  { type: "quote", content: "In music, silence is more important than sound.", author: "Miles Davis", workTitle: null, youtubeId: null },
  { type: "fact", content: "Beethoven continued composing masterworks after losing nearly all his hearing — his 9th Symphony, including the 'Ode to Joy', was written when he could no longer hear a single note being played.", author: "Ludwig van Beethoven", workTitle: "Symphony No. 9, Op. 125", youtubeId: "t3217H8JppI" },
  { type: "recommendation", content: "Ravel's Boléro is a single melody repeated 18 times over 15 minutes with only the orchestration growing — Ravel himself called it 'a piece for orchestra without music', yet it became one of the most-performed orchestral works ever written.", author: "Maurice Ravel", workTitle: "Boléro", youtubeId: "3yYEYpYABOM" },
  { type: "fact", content: "John Coltrane's 'Giant Steps' introduced harmonic progressions so rapid and complex that fellow musicians had never seen anything like them — the system he invented is still taught today as 'Coltrane changes'.", author: "John Coltrane", workTitle: "Giant Steps", youtubeId: "2kotK9FNEYU" },
  { type: "quote", content: "The guitar is a small orchestra. It is polyphonic. Every string is a different colour, a different voice.", author: "Andrés Segovia", workTitle: null, youtubeId: null },
  { type: "fact", content: "Yo-Yo Ma has recorded Bach's Cello Suites three times across different decades of his life — each recording reveals how his understanding of the music has deepened as he has aged.", author: "Yo-Yo Ma", workTitle: "Bach Cello Suites", youtubeId: "1prweT95Mo0" },
  { type: "quote", content: "Music is the shorthand of emotion.", author: "Leo Tolstoy", workTitle: null, youtubeId: null },
  { type: "fact", content: "Debussy's Prélude à l'après-midi d'un faune, premiered in 1894, is considered the birth of musical Impressionism — its opening flute solo was so radical that audiences initially did not know how to react.", author: "Claude Debussy", workTitle: "Prélude à l'après-midi d'un faune", youtubeId: "vOJY4cJHV9M" },
  { type: "recommendation", content: "Explore Arvo Pärt's 'Spiegel im Spiegel' for piano and violin — written in just one evening in 1978, its hypnotic simplicity conceals a profound mathematical architecture that has made it one of the most-streamed classical pieces of the modern era.", author: "Arvo Pärt", workTitle: "Spiegel im Spiegel", youtubeId: "TJ6Mzvh3XCc" },
  { type: "fact", content: "Gene Krupa's drum solo on Benny Goodman's 'Sing, Sing, Sing' at Carnegie Hall in 1938 is often credited as the moment that elevated the drum kit from a background rhythm section instrument to a solo voice in its own right.", author: "Gene Krupa", workTitle: "Sing, Sing, Sing", youtubeId: "Y9HHmbOmqd4" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let fallbackDeck: InspirationItem[] = shuffle(SEED_INSPIRATIONS);
let fallbackIndex = 0;

function nextFallback(): InspirationItem {
  if (fallbackIndex >= fallbackDeck.length) {
    fallbackDeck = shuffle(SEED_INSPIRATIONS);
    fallbackIndex = 0;
  }
  return fallbackDeck[fallbackIndex++];
}

const aiPool: InspirationItem[] = [];
const POOL_TARGET = 30;
let isGenerating = false;

const PROMPT_TOPICS = [
  { type: "quote" as const, prompt: "a striking quote from a legendary jazz musician (Miles Davis, John Coltrane, Bill Evans, Thelonious Monk, Duke Ellington, Charlie Parker, or Ella Fitzgerald) about improvisation, freedom, or creativity" },
  { type: "fact" as const, prompt: "a fascinating fact about violin technique, history, or a famous violinist (Paganini, Heifetz, David Oistrakh, Hilary Hahn, or Itzhak Perlman) — include a specific famous work they recorded" },
  { type: "recommendation" as const, prompt: "a compelling recommendation to listen to a specific orchestral work — choose from romantic, impressionist, or 20th-century repertoire (not Beethoven 9 or Bolero) — with a vivid description of what makes this recording unmissable" },
  { type: "fact" as const, prompt: "a surprising fact about how a famous piece of music — from jazz, contemporary classical, or world music — was composed, received, or discovered" },
  { type: "quote" as const, prompt: "a profound quote from a classical composer (Brahms, Debussy, Ravel, Shostakovich, Prokofiev, Bartók, Sibelius, or Messiaen) about their compositional process or musical philosophy" },
  { type: "fact" as const, prompt: "an astonishing fact about cello repertoire, technique, or a legendary cellist — Rostropovich, Yo-Yo Ma, Jacqueline du Pré, or Pablo Casals — with a specific landmark work" },
  { type: "recommendation" as const, prompt: "a recommendation to explore a famous guitar work — classical guitar (Villa-Lobos, Rodrigo), flamenco (Paco de Lucía), or jazz guitar (Django Reinhardt, Pat Metheny) — describing what makes the performance unforgettable" },
  { type: "fact" as const, prompt: "a fascinating fact about percussion and rhythm — could be a famous drummer (Elvin Jones, Gene Krupa, Buddy Rich, Tony Williams) or a rhythmic innovation in Afro-Cuban, Brazilian, or Indian classical music" },
  { type: "quote" as const, prompt: "a memorable quote from a 20th or 21st-century composer (Stravinsky, Bartók, Messiaen, Britten, Arvo Pärt, Philip Glass, or John Adams) about the nature of musical innovation" },
  { type: "fact" as const, prompt: "an interesting fact about opera — involving Verdi, Puccini, Wagner, Richard Strauss, or a legendary singer (Callas, Pavarotti, Domingo) — centered on a specific famous aria or scene" },
  { type: "recommendation" as const, prompt: "a recommendation to listen to a specific jazz album or recording — by Coltrane, Monk, Bill Evans, Oscar Peterson, or Keith Jarrett — explaining what makes this session a turning point in jazz history" },
  { type: "fact" as const, prompt: "a surprising fact about the piano — its invention, mechanics, or a legendary pianist (Glenn Gould, Martha Argerich, Vladimir Horowitz, Maurizio Pollini, or Sviatoslav Richter) and a defining recording" },
  { type: "quote" as const, prompt: "an inspiring quote from a wind or brass musician — a renowned oboist, clarinettist, French horn player, or jazz trumpeter — about their instrument's expressive possibilities" },
  { type: "fact" as const, prompt: "a fascinating fact about chamber music — a famous string quartet (Kronos Quartet, Emerson Quartet, Borodin Quartet) or landmark work (Schubert, Bartók, or Shostakovich quartets)" },
  { type: "recommendation" as const, prompt: "a recommendation to explore a baroque masterwork by Bach, Handel, Vivaldi, Rameau, or Purcell — describing its architecture, emotional world, and why a particular recording is definitive" },
  { type: "fact" as const, prompt: "a little-known fact about how orchestral instruments work — the physics of the French horn's bell, the oboe's double reed, the contrabass's construction, or the harp's pedal mechanism" },
  { type: "quote" as const, prompt: "a powerful quote from a world-music or folk tradition master — a flamenco cantaor, a qawwali singer, an Indian classical musician like Ravi Shankar or Zakir Hussain — about the spiritual dimension of music" },
  { type: "recommendation" as const, prompt: "a recommendation to discover a less-known classical gem — a work by Chausson, Franck, Fauré, Enescu, or Szymanowski — with a vivid description of why it deserves far more attention than it receives" },
  { type: "fact" as const, prompt: "a remarkable fact about electronic music pioneers — Stockhausen, Xenakis, Steve Reich, or Laurie Anderson — and how they permanently changed how we think about musical sound" },
  { type: "quote" as const, prompt: "a thoughtful quote from a conductor (Leonard Bernstein, Carlos Kleiber, Claudio Abbado, or Herbert von Karajan) about the relationship between a conductor and an orchestra" },
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
          content: `You are a music scholar with encyclopedic knowledge across classical, jazz, folk, world music, and contemporary genres. Your responses are vivid, specific, and surprising — you avoid clichés and always include concrete details. Respond ONLY with a valid JSON object. No markdown, no code fences.`,
        },
        {
          role: "user",
          content: `Generate ${topic.prompt}.

Return a JSON object with exactly these fields:
- "type": "${topic.type}"
- "content": 2-4 sentences, specific and compelling — name exact works, dates, details
- "author": full name of the musician or composer (null only for truly general facts)
- "workTitle": the exact title of the specific musical work mentioned (null if no specific piece)
- "youtubeId": a real 11-character YouTube video ID for a well-known recording of the specific piece — include one whenever a specific work is named; null only when no piece is mentioned

JSON only.`,
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
    while (aiPool.length < POOL_TARGET) {
      const item = await generateOne();
      if (item) aiPool.push(item);
    }
  } finally {
    isGenerating = false;
  }
}

setInterval(() => {
  if (aiPool.length < POOL_TARGET && !isGenerating) {
    fillPool().catch(() => {});
  }
}, 15_000);

fillPool().catch(() => {});

router.get("/inspiration", (req, res) => {
  let item: InspirationItem;

  if (aiPool.length > 0) {
    const idx = Math.floor(Math.random() * aiPool.length);
    item = aiPool.splice(idx, 1)[0];
    if (aiPool.length < POOL_TARGET * 0.4 && !isGenerating) {
      fillPool().catch(() => {});
    }
  } else {
    item = nextFallback();
  }

  res.json(item);
});

export default router;
