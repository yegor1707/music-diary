import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] ?? "dummy",
});

type InspirationCategory =
  | "fact"
  | "quote"
  | "tip"
  | "recording"
  | "masterclass"
  | "theory"
  | "inspiration"
  | "history"
  | "practice"
  | "misc";

type InspirationItem = {
  type: InspirationCategory;
  content: string;
  author: string | null;
  workTitle: string | null;
  musicSearchQuery: string | null;
};

// ─── Seed fallbacks (English, all unique) ───────────────────────────────────

const SEED_INSPIRATIONS: InspirationItem[] = [
  { type: "fact", content: "A modern concert grand piano has approximately 230 strings with a combined tension of around 20 tons — which is why the frame is cast from a single piece of iron. The bass strings are wound with copper wire to add mass without excessive length.", author: null, workTitle: null, musicSearchQuery: null },
  { type: "quote", content: "To play a wrong note is insignificant; to play without passion is inexcusable.", author: "Ludwig van Beethoven", workTitle: null, musicSearchQuery: null },
  { type: "tip", content: "When practising octaves, relax the wrist and let the arm move as one unit from the elbow. Imagine the forearm and hand form a single rigid lever — tension in the wrist kills speed and risks injury. Keep weight in the arm, not the fingers.", author: null, workTitle: null, musicSearchQuery: null },
  { type: "recording", content: "Glenn Gould recorded Bach's Goldberg Variations twice: in 1955 as a debut that made him world-famous overnight, and in 1981, just months before his death. The second recording is far slower and deeply introspective — Gould himself described it as 'a very, very lonely experience.'", author: "Johann Sebastian Bach", workTitle: "Goldberg Variations, BWV 988", musicSearchQuery: "Bach Goldberg Variations Glenn Gould 1981" },
  { type: "masterclass", content: "Finger independence drill: hold A and D (fingers 3 and 4) depressed on the keys while trilling C and E (fingers 1 and 2). Then swap — hold 1 and 2 while trilling 3 and 4. Do this for two minutes daily; it targets the weakest link in most pianists' technique.", author: null, workTitle: null, musicSearchQuery: null },
  { type: "theory", content: "The 'Tristan chord' — F, B, D♯, A♯ — opens Wagner's Tristan und Isolde (1859) and famously never resolves to the tonic throughout the entire four-hour opera. It is considered the single chord that initiated the dissolution of classical tonality.", author: "Richard Wagner", workTitle: "Tristan und Isolde, Prelude", musicSearchQuery: "Wagner Tristan und Isolde Prelude Furtwangler" },
  { type: "inspiration", content: "Try composing a short piece using only the notes of the F♯ major pentatonic scale: F♯, G♯, A♯, C♯, D♯. The pentatonic has no half-steps and no 'wrong' notes — it creates natural space and ambiguity. Aim for asymmetric phrases of 3 and 5 bars rather than the usual 4.", author: null, workTitle: null, musicSearchQuery: null },
  { type: "history", content: "On 29 May 1913, the premiere of Stravinsky's The Rite of Spring in Paris erupted into a riot. Audience members shouted and fought while the dancers could barely hear the orchestra. One year later the same Parisian public gave it a standing ovation.", author: "Igor Stravinsky", workTitle: "The Rite of Spring", musicSearchQuery: "Stravinsky Rite of Spring Gergiev Mariinsky" },
  { type: "practice", content: "Slow practice drill: take the passage causing you trouble and play it at exactly one quarter of the target tempo, with full attention to each individual finger movement. This is not tedious slowness — it is precise motor programming. Speed comes later, automatically.", author: null, workTitle: null, musicSearchQuery: null },
  { type: "misc", content: "Claude Debussy failed several conservatoire examinations and was regularly told he ignored all the rules. His professors called him 'dangerous.' That refusal to obey academic harmony is exactly what made him the father of musical Impressionism.", author: "Claude Debussy", workTitle: null, musicSearchQuery: null },
  { type: "fact", content: "Bartolomeo Cristofori invented the piano around 1700 in Florence, calling it 'gravicembalo col piano e forte' — a harpsichord with soft and loud. Unlike the harpsichord, the piano's hammer mechanism means the volume responds to the player's touch: the first genuinely expressive keyboard instrument.", author: null, workTitle: null, musicSearchQuery: null },
  { type: "quote", content: "To play a piece correctly you must understand it to the very marrow — not only the notes but everything between them.", author: "Sviatoslav Richter", workTitle: null, musicSearchQuery: null },
  { type: "tip", content: "For a singing tone in a cantabile passage, think of pulling the sound out of the key rather than pressing down. Sink the fingertip deeply into the key surface as if you want to lift it from underneath with a bowing motion.", author: null, workTitle: null, musicSearchQuery: null },
  { type: "recording", content: "Miles Davis recorded Kind of Blue in just two sessions in 1959. Most of the musicians played from Davis's sketches with almost no rehearsal. He deliberately gave them minimal instructions to preserve the freshness of the first take. It remains the best-selling jazz album in history.", author: "Miles Davis", workTitle: "Kind of Blue", musicSearchQuery: "Miles Davis Kind of Blue full album" },
  { type: "theory", content: "The Neapolitan chord is a major chord built on the flattened second degree of a scale. In C minor, that is D♭ major. It adds a distinctive bitter, tragic colour to climaxes and was a favourite of Chopin, Schubert, and Liszt. Its voice-leading into the dominant is exceptionally smooth.", author: null, workTitle: null, musicSearchQuery: null },
  { type: "inspiration", content: "Compose something in A♭ Lydian — the raised fourth gives the mode a floating, luminous quality. Try a slow, wide-spanning left-hand accompaniment with a lyrical, ornamented melody above it, in the spirit of Ravel's slow movements.", author: null, workTitle: null, musicSearchQuery: null },
  { type: "history", content: "On 22 December 1808 in Vienna, Beethoven held a four-hour concert at which he premiered his Fifth Symphony, Sixth Symphony, Fourth Piano Concerto, and the Choral Fantasy all in one evening — all performed by an underprepared orchestra in a freezing, half-empty hall.", author: "Ludwig van Beethoven", workTitle: "Symphony No. 5, Op. 67", musicSearchQuery: "Beethoven Symphony 5 Carlos Kleiber Vienna Philharmonic" },
  { type: "practice", content: "Rhythmic dotting exercise: take any even passage and play it in dotted rhythm — long-short, long-short. Then reverse to short-long. This exposes weak fingers that hide in even rhythm and builds the precision needed for fast runs.", author: null, workTitle: null, musicSearchQuery: null },
  { type: "masterclass", content: "The 'pedal staccato' effect: depress the sustain pedal, play a staccato note, then release the key while keeping the pedal down. The tone continues but retains the attack character of the staccato. Chopin used this in his Nocturnes to achieve notes that seem to float in mid-air.", author: "Frédéric Chopin", workTitle: null, musicSearchQuery: null },
  { type: "misc", content: "The Stradivarius violin maintains acoustic properties unmatched by modern instruments after 300 years. Scientists debate the cause: some point to minerals in the wood absorbed from Alpine groundwater, others to the unique varnish formula. No modern copy has fully replicated the sound.", author: null, workTitle: null, musicSearchQuery: null },
];

// ─── Shuffle utility ─────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Fallback deck (cycled through without repeating until exhausted) ─────────

let fallbackDeck: InspirationItem[] = shuffle(SEED_INSPIRATIONS);
let fallbackIndex = 0;

function nextFallback(excludeCategories: InspirationCategory[]): InspirationItem {
  const remaining = fallbackDeck.slice(fallbackIndex);
  const preferred = remaining.filter(i => !excludeCategories.includes(i.type));
  if (preferred.length > 0) {
    return preferred[Math.floor(Math.random() * preferred.length)];
  }
  if (fallbackIndex >= fallbackDeck.length) {
    fallbackDeck = shuffle(SEED_INSPIRATIONS);
    fallbackIndex = 0;
  }
  return fallbackDeck[fallbackIndex++];
}

// ─── Deduplication state ──────────────────────────────────────────────────────

// Track served content hashes — never repeat the same content
const servedContentHashes = new Set<string>();
// Track served workTitles — never repeat the same piece
const servedWorkTitles = new Set<string>();
// Track served authors — limit same author appearances
const authorAppearanceCount = new Map<string, number>();
const MAX_AUTHOR_APPEARANCES = 2;

// Category rotation — avoid repeating same category in last N requests
const recentCategories: InspirationCategory[] = [];
const RECENT_CAT_WINDOW = 5;

function contentHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

function normalizeTitle(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
}

function isItemFresh(item: InspirationItem): boolean {
  if (servedContentHashes.has(contentHash(item.content))) return false;
  if (item.workTitle && servedWorkTitles.has(normalizeTitle(item.workTitle))) return false;
  if (item.author && (authorAppearanceCount.get(item.author) ?? 0) >= MAX_AUTHOR_APPEARANCES) return false;
  return true;
}

function trackServed(item: InspirationItem) {
  servedContentHashes.add(contentHash(item.content));
  if (item.workTitle) servedWorkTitles.add(normalizeTitle(item.workTitle));
  if (item.author) {
    authorAppearanceCount.set(item.author, (authorAppearanceCount.get(item.author) ?? 0) + 1);
  }
  recentCategories.push(item.type);
  if (recentCategories.length > RECENT_CAT_WINDOW) recentCategories.shift();
}

// ─── Topic definitions ────────────────────────────────────────────────────────
// Theme: PIANO = 75%, ORCHESTRAL = 20%, OTHER = 5%
// Total weight budget: 100 units

type TopicDef = {
  category: InspirationCategory;
  weight: number;
  theme: "piano" | "orchestral" | "other";
  prompt: string;
};

// Piano topics target: 75 total weight
// Orchestral topics target: 20 total weight
// Other topics target: 5 total weight

const TOPICS: TopicDef[] = [
  // ── PIANO FACTS (12 weight) ──────────────────────────────────────────────
  { category: "fact", weight: 3, theme: "piano", prompt: "a surprising mechanical fact about the modern concert grand piano — hammers, strings, dampers, the una corda pedal, the sostenuto pedal, or the iron frame. Cite specific numbers or engineering details." },
  { category: "fact", weight: 3, theme: "piano", prompt: "a fascinating fact about a legendary pianist — choose one not previously common in trivia: Martha Argerich, Dinu Lipatti, Arturo Benedetti Michelangeli, Mikhail Pletnev, or Grigory Sokolov — and one defining recording or performance." },
  { category: "fact", weight: 3, theme: "piano", prompt: "a surprising fact about a famous piano concerto — its premiere, its composition story, or a legendary performance — by Rachmaninoff, Prokofiev, Bartók, Grieg, or Schumann. Name exact opus numbers and years." },
  { category: "fact", weight: 3, theme: "piano", prompt: "a little-known fact about the history of piano manufacturing — Steinway, Bösendorfer, Fazioli, or Bechstein — a specific innovation they introduced and when." },

  // ── PIANO QUOTES (10 weight) ─────────────────────────────────────────────
  { category: "quote", weight: 3, theme: "piano", prompt: "a vivid, specific quote from Frédéric Chopin about piano touch, tone, the singing quality of the instrument, or his own compositional process. Avoid the most commonly repeated Chopin quotes." },
  { category: "quote", weight: 3, theme: "piano", prompt: "a memorable quote from Franz Liszt, Sergei Rachmaninoff, or Alexander Scriabin about piano performance, the piano's expressive range, or their relationship to the instrument." },
  { category: "quote", weight: 2, theme: "piano", prompt: "a quote from Glenn Gould, Vladimir Horowitz, or Sviatoslav Richter about interpretation, practice, the recording studio, or what makes a great performance. Avoid the most famous ones." },
  { category: "quote", weight: 2, theme: "piano", prompt: "a quote from a modern pianist — Murray Perahia, Andras Schiff, Mitsuko Uchida, or Leif Ove Andsnes — about how they approach a specific repertoire or what they look for in a piano." },

  // ── PIANO TIPS (12 weight) ───────────────────────────────────────────────
  { category: "tip", weight: 3, theme: "piano", prompt: "a concrete, immediately actionable piano technique tip about touch and weight — arm weight, wrist flexibility, or finger independence. Describe exactly what to do physically." },
  { category: "tip", weight: 3, theme: "piano", prompt: "a specific pedalling technique for piano — direct pedalling, syncopated pedalling, half-pedal, flutter pedal — explain what it is, when to use it, and give a famous repertoire example." },
  { category: "tip", weight: 3, theme: "piano", prompt: "a focused piano practice strategy — how to learn a difficult passage, manage memory, handle a weak hand, or prepare for performance. Be specific and practical." },
  { category: "tip", weight: 3, theme: "piano", prompt: "a tip about voicing and balance on the piano — how to project a melody above the accompaniment, how to voice a chord, or how to achieve a legato line across different registers." },

  // ── PIANO RECORDING STORIES (10 weight) ─────────────────────────────────
  { category: "recording", weight: 3, theme: "piano", prompt: "a compelling story about a legendary piano recording session — Horowitz at Carnegie Hall 1965, Gould's 1955 debut, Richter's 1958 Sofia recital, or Argerich's 1965 Chopin competition. Describe what made it historic." },
  { category: "recording", weight: 3, theme: "piano", prompt: "a story about how a famous solo piano work was recorded under extraordinary circumstances — illness, time pressure, technical accidents, or emotional extremity. Be specific about the piece and the musician." },
  { category: "recording", weight: 2, theme: "piano", prompt: "a story about an unexpected mistake or improvisation in a piano recording that was left in the final take and became famous — name the work, performer, and what happened." },
  { category: "recording", weight: 2, theme: "piano", prompt: "a behind-the-scenes story about the recording of a famous piano concerto — the conductor, the soloist, the orchestra, and what made that particular interpretation a landmark. Be very specific." },

  // ── PIANO MASTERCLASS (8 weight) ─────────────────────────────────────────
  { category: "masterclass", weight: 3, theme: "piano", prompt: "a short piano masterclass (2 paragraphs): identify a specific technical challenge (trills, double thirds, fast repeated notes, hand crossing), diagnose what causes it, and give one precise exercise to fix it." },
  { category: "masterclass", weight: 3, theme: "piano", prompt: "a mini masterclass on how to practise a specific passage type on piano — an arpeggiated left hand, a Chopin rubato, a Beethoven sforzando, or a Brahms thick chord texture. Describe the approach step by step." },
  { category: "masterclass", weight: 2, theme: "piano", prompt: "a masterclass insight from a great piano pedagogue — Heinrich Neuhaus, Nadia Boulanger, Josef Hofmann, or Theodor Leschetizky — about a specific aspect of piano playing. Quote their teaching if possible." },

  // ── PIANO THEORY (8 weight) ──────────────────────────────────────────────
  { category: "theory", weight: 3, theme: "piano", prompt: "explain a specific harmonic or voice-leading technique that pianists encounter — Neapolitan sixth, augmented sixth chords, enharmonic modulation, or chromatic mediant — with a specific piano repertoire example." },
  { category: "theory", weight: 3, theme: "piano", prompt: "explain an interesting piano chord voicing or texture — a Ravel open-fifth chord, a Debussy parallel chords technique, a Chopin nocturne left-hand spread, or a Liszt Romantic texture. Describe how it is constructed and why it sounds the way it does." },
  { category: "theory", weight: 2, theme: "piano", prompt: "describe a scale or mode that features prominently in piano repertoire — Hungarian minor, whole-tone scale, octatonic scale, or Lydian dominant — name a famous piano work that uses it and describe its emotional character." },

  // ── PIANO INSPIRATION (8 weight) ─────────────────────────────────────────
  { category: "inspiration", weight: 3, theme: "piano", prompt: "give a vivid composition idea specifically for solo piano — a character, mood, texture, and a harmonic starting point (a specific chord or short progression). Make it feel fresh and genuinely inspiring." },
  { category: "inspiration", weight: 3, theme: "piano", prompt: "suggest a harmonic progression (4–8 chords) that would make a rich basis for piano improvisation or composition. Name each chord precisely and describe the emotional arc they create." },
  { category: "inspiration", weight: 2, theme: "piano", prompt: "suggest a specific key, mode, and character for a new piano piece — e.g. 'B♭ Dorian, a slow nocturne-like piece with a chaconne bass' — and explain what makes that combination emotionally interesting." },

  // ── PIANO HISTORY (4 weight) ─────────────────────────────────────────────
  { category: "history", weight: 2, theme: "piano", prompt: "describe a significant premiere or historical concert involving piano — Liszt's recitals that invented the solo recital format, Chopin's Paris debut, Brahms meeting Schumann, or Prokofiev premiering his own concerto. Name the exact date and place." },
  { category: "history", weight: 2, theme: "piano", prompt: "describe an important moment in the history of the piano as an instrument — its invention by Cristofori, the first iron-framed piano, Steinway's 1875 concert grand, or the introduction of the double escapement action." },

  // ── PIANO PRACTICE (3 weight) ────────────────────────────────────────────
  { category: "practice", weight: 3, theme: "piano", prompt: "describe today's piano practice exercise — a specific finger exercise, scale pattern, chord-transition drill, or sight-reading technique — with step-by-step instructions and what physical skill it develops." },

  // ═══════════════════════════════════════════════════════════════════════════
  // ── ORCHESTRAL FACTS (4 weight) ─────────────────────────────────────────
  { category: "fact", weight: 2, theme: "orchestral", prompt: "a fascinating fact about a legendary conductor — Carlos Kleiber, Claudio Abbado, Herbert von Karajan, or Leonard Bernstein — and a landmark recording or concert that defined their legacy." },
  { category: "fact", weight: 2, theme: "orchestral", prompt: "a surprising fact about a famous orchestral work's composition or premiere — by Shostakovich, Mahler, Sibelius, Bruckner, or Bartók. Include exact dates, opus numbers, and the original reception." },

  // ── ORCHESTRAL QUOTES (3 weight) ────────────────────────────────────────
  { category: "quote", weight: 3, theme: "orchestral", prompt: "a powerful quote from a conductor — Carlos Kleiber, Claudio Abbado, Celibidache, or Bernstein — about what it means to conduct, to listen, or to shape an orchestra's sound." },

  // ── ORCHESTRAL RECORDING STORIES (3 weight) ─────────────────────────────
  { category: "recording", weight: 3, theme: "orchestral", prompt: "a compelling story about a famous orchestral recording — Carlos Kleiber's Beethoven 5th with Vienna Philharmonic, Furtwängler's wartime Beethoven 9th, or Celibidache's refusal to record. Describe exactly what happened and why it matters." },

  // ── ORCHESTRAL HISTORY (4 weight) ────────────────────────────────────────
  { category: "history", weight: 2, theme: "orchestral", prompt: "describe a famous symphonic premiere or orchestral event — Beethoven's 1808 marathon concert, the 1913 Rite of Spring riot, Shostakovich's Leningrad Symphony premiere, or Mahler's 8th Symphony premiere. Give specific dates and facts." },
  { category: "history", weight: 2, theme: "orchestral", prompt: "describe the history of a major orchestra — the Vienna Philharmonic, the Berlin Philharmonic, or the Concertgebouw — including a decisive moment in their history and their most iconic recording." },

  // ── ORCHESTRAL THEORY (3 weight) ────────────────────────────────────────
  { category: "theory", weight: 3, theme: "orchestral", prompt: "describe an interesting orchestration technique used by a great composer — Ravel's Boléro orchestration, Mahler's use of off-stage instruments, Shostakovich's string writing, or Bartók's night music textures. Explain how it works and why it sounds the way it does." },

  // ── ORCHESTRAL MISC (3 weight) ───────────────────────────────────────────
  { category: "misc", weight: 3, theme: "orchestral", prompt: "describe an interesting orchestral instrument that most people know little about — the alto flute, the contrabassoon, the Heckelphone, the Wagner tuba, or the sarrusophone — its sound, its history, and a famous solo written for it." },

  // ═══════════════════════════════════════════════════════════════════════════
  // ── OTHER (5 total weight) ────────────────────────────────────────────────
  { category: "fact", weight: 1, theme: "other", prompt: "a fascinating fact about a jazz legend — Bill Evans, Oscar Peterson, Keith Jarrett, or Thelonious Monk — and one landmark recording that changed jazz piano." },
  { category: "quote", weight: 1, theme: "other", prompt: "a memorable quote from a jazz pianist — Bill Evans, Oscar Peterson, Keith Jarrett, or Herbie Hancock — about improvisation, listening, or the relationship between structure and freedom." },
  { category: "misc", weight: 1, theme: "other", prompt: "introduce an interesting lesser-known composer who wrote primarily for keyboard or piano — give their name, era, most important work, and why they deserve far more attention than they receive." },
  { category: "history", weight: 1, theme: "other", prompt: "describe an important event in the history of music recording technology — the first piano recording, the invention of magnetic tape, the arrival of LP records, or the first digital recording — and how it changed how we hear music." },
  { category: "practice", weight: 1, theme: "other", prompt: "describe a mental practice technique — score study without the instrument, inner hearing, or practising away from the piano — used by a great musician. Explain the method and what it achieves." },
];

// ─── Build weighted pool ──────────────────────────────────────────────────────

function buildWeightedPool(): TopicDef[] {
  const pool: TopicDef[] = [];
  for (const t of TOPICS) {
    for (let i = 0; i < t.weight; i++) pool.push(t);
  }
  return pool;
}

const WEIGHTED_POOL = buildWeightedPool();

function pickTopic(excludeCategories: InspirationCategory[]): TopicDef {
  const preferred = WEIGHTED_POOL.filter(t => !excludeCategories.includes(t.category));
  const pool = preferred.length > 0 ? preferred : WEIGHTED_POOL;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── AI generation ────────────────────────────────────────────────────────────

const aiPool: InspirationItem[] = [];
const POOL_TARGET = 50;
let isGenerating = false;

async function generateOne(): Promise<InspirationItem | null> {
  const exclude = recentCategories.slice(-RECENT_CAT_WINDOW);
  const topic = pickTopic(exclude);
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: `You are a world-class music scholar with encyclopedic knowledge of the piano repertoire, jazz, and orchestral music. Your responses are vivid, specific, and surprising — you always include exact dates, opus numbers, and concrete details. You avoid clichés and never repeat content already covered. Respond ONLY with a valid JSON object. No markdown, no code fences.`,
        },
        {
          role: "user",
          content: `Generate: ${topic.prompt}

Return a JSON object with exactly these fields:
- "type": "${topic.category}"
- "content": 2–4 sentences in English — specific, vivid, factually accurate. Name exact works, dates, details. No vague generalities.
- "author": full name of the musician or composer (null only for genuinely general facts)
- "workTitle": exact title of the specific musical work mentioned (null if no specific piece)
- "musicSearchQuery": English search query for YouTube — e.g. "Chopin Nocturne Op 9 No 2 Argerich" (null if no specific work or performer)

JSON only. No markdown.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!raw) return null;

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return null;
      try { parsed = JSON.parse(match[0]); } catch { return null; }
    }

    const content = String(parsed.content ?? "").trim();
    if (!content || content.length < 30) return null;

    return {
      type: (parsed.type as InspirationCategory) ?? topic.category,
      content,
      author: parsed.author ? String(parsed.author) : null,
      workTitle: parsed.workTitle ? String(parsed.workTitle) : null,
      musicSearchQuery: parsed.musicSearchQuery ? String(parsed.musicSearchQuery) : null,
    };
  } catch {
    return null;
  }
}

async function fillPool() {
  if (isGenerating) return;
  isGenerating = true;
  try {
    let attempts = 0;
    while (aiPool.length < POOL_TARGET && attempts < POOL_TARGET * 3) {
      attempts++;
      const item = await generateOne();
      if (!item) continue;
      // Only add to pool if content isn't already in pool (pre-check)
      const h = contentHash(item.content);
      const titleKey = item.workTitle ? normalizeTitle(item.workTitle) : null;
      const alreadyInPool = aiPool.some(p =>
        contentHash(p.content) === h ||
        (titleKey && p.workTitle && normalizeTitle(p.workTitle) === titleKey)
      );
      if (!alreadyInPool) {
        aiPool.push(item);
      }
    }
  } finally {
    isGenerating = false;
  }
}

setInterval(() => {
  if (aiPool.length < POOL_TARGET && !isGenerating) {
    fillPool().catch(() => {});
  }
}, 10_000);

fillPool().catch(() => {});

// ─── Route ────────────────────────────────────────────────────────────────────

router.get("/inspiration", (req, res) => {
  const excludeCats = recentCategories.slice(-RECENT_CAT_WINDOW);

  // Select from pool: prefer fresh + different category
  let item: InspirationItem | undefined;

  if (aiPool.length > 0) {
    // Priority order: fresh content + different category > fresh content > different category > anything
    const freshAndNew = aiPool.filter(i => isItemFresh(i) && !excludeCats.includes(i.type));
    const freshAny    = aiPool.filter(i => isItemFresh(i));
    const newCategory = aiPool.filter(i => !excludeCats.includes(i.type));

    const candidates = freshAndNew.length > 0 ? freshAndNew
      : freshAny.length > 0 ? freshAny
      : newCategory.length > 0 ? newCategory
      : aiPool;

    const idx = Math.floor(Math.random() * candidates.length);
    item = candidates[idx];
    const poolIdx = aiPool.indexOf(item);
    if (poolIdx !== -1) aiPool.splice(poolIdx, 1);

    if (aiPool.length < POOL_TARGET * 0.5 && !isGenerating) {
      fillPool().catch(() => {});
    }
  }

  if (!item) {
    item = nextFallback(excludeCats);
  }

  trackServed(item);
  res.json(item);
});

export default router;
