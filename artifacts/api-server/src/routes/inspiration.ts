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

const ALL_CATEGORIES: InspirationCategory[] = [
  "fact", "quote", "tip", "recording", "masterclass",
  "theory", "inspiration", "history", "practice", "misc",
];

const SEED_INSPIRATIONS: InspirationItem[] = [
  { type: "fact", content: "Рояль имеет около 230 струн с суммарным натяжением около 20 тонн. Именно поэтому рамы современных роялей делают из чугуна — только он способен выдержать такую нагрузку.", author: null, workTitle: null, musicSearchQuery: null },
  { type: "quote", content: "Музыка — это откровение более высокое, чем любая мудрость и философия.", author: "Людвиг ван Бетховен", workTitle: null, musicSearchQuery: null },
  { type: "tip", content: "При работе над техникой октав на фортепиано расслабьте запястье и позвольте руке двигаться единым блоком. Представьте, что рука — это одна кость от локтя до кончиков пальцев. Это снимает излишнее напряжение и даёт звуку свободу.", author: null, workTitle: null, musicSearchQuery: null },
  { type: "recording", content: "«Гольдберг-вариации» Баха были записаны Гленном Гулдом дважды — в 1955 и 1981 годах. Первая запись прославила его в одночасье, вторая стала его лебединой песней: медленная, медитативная, она вышла за несколько месяцев до его смерти в 1982 году.", author: "Иоганн Себастьян Бах", workTitle: "Гольдберг-вариации, BWV 988", musicSearchQuery: "Bach Goldberg Variations Glenn Gould 1981" },
  { type: "masterclass", content: "Упражнение на независимость пальцев: держите ноты ля и ре (3 и 4 пальцы) нажатыми и играйте трель до-ми (1 и 2 пальцы). Затем поменяйте — держите 1 и 2, трельте 3 и 4. Это одно из ключевых упражнений для выравнивания техники.", author: null, workTitle: null, musicSearchQuery: null },
  { type: "theory", content: "Аккорд «Тристан» — фа, си, ре-диез, ля-диез — открывает оперу Вагнера «Тристан и Изольда» (1859). Он так и не разрешается в тонику на протяжении всей четырёхчасовой оперы, создавая ощущение непрекращающегося томления. Этот аккорд считается отправной точкой позднеромантической гармонии.", author: "Рихард Вагнер", workTitle: "Тристан и Изольда", musicSearchQuery: "Wagner Tristan und Isolde Prelude Tristan chord" },
  { type: "inspiration", content: "Попробуйте написать короткую пьесу, используя только ноты одной пентатоники — например, фа-диез мажорной: фа-диез, соль-диез, ля-диез, до-диез, ре-диез. Пентатоника создаёт ощущение пространства и не знает ни диссонансов, ни «неправильных» нот.", author: null, workTitle: null, musicSearchQuery: null },
  { type: "history", content: "27 декабря 1831 года в Вене состоялась мировая премьера «Фантастической симфонии» Гектора Берлиоза — первого крупного симфонического произведения с программой. Берлиоз написал её в состоянии безумной влюблённости в ирландскую актрису Гарриет Смитсон, которую видел лишь на сцене.", author: "Гектор Берлиоз", workTitle: "Фантастическая симфония, соч. 14", musicSearchQuery: "Berlioz Symphonie Fantastique" },
  { type: "practice", content: "Упражнение дня: «медленное зеркало». Выберите пассаж, с которым у вас трудности. Сыграйте его в 4 раза медленнее нужного темпа, с полным вниманием к каждому пальцу. Это не скучная медлительность — это точное программирование мышечной памяти.", author: null, workTitle: null, musicSearchQuery: null },
  { type: "misc", content: "Клод Дебюсси так и не закончил консерваторию в традиционном смысле — он провалил несколько экзаменов и считался «опасным новатором». Его профессора говорили, что он игнорирует все правила. Именно это сделало его отцом музыкального импрессионизма.", author: "Клод Дебюсси", workTitle: null, musicSearchQuery: null },
  { type: "fact", content: "Фортепиано изобрёл Бартоломео Кристофори около 1700 года во Флоренции. Он назвал его «gravicembalo col piano e forte» — клавесин с тихим и громким. Инструмент позволил играть с нюансами, недоступными клавесину, где сила удара не влияла на громкость.", author: null, workTitle: null, musicSearchQuery: null },
  { type: "quote", content: "Чтобы правильно сыграть произведение, нужно понять его до мозга костей. Не только ноты, но и то, что между ними.", author: "Святослав Рихтер", workTitle: null, musicSearchQuery: null },
  { type: "tip", content: "Работая над кантиленой на фортепиано, представьте, что нажимаете не на клавишу, а тянете звук из инструмента — как смычком. Погружайте подушечки пальцев глубоко в клавишу, словно хотите поднять её обратно снизу.", author: null, workTitle: null, musicSearchQuery: null },
  { type: "recording", content: "Майлс Дэвис записал «Kind of Blue» в 1959 году всего за две сессии. Большинство музыкантов играли с листа — без репетиций. Дэвис намеренно дал им минимальные инструкции, чтобы сохранить свежесть первого взгляда. Альбом стал самым продаваемым джазовым альбомом в истории.", author: "Майлс Дэвис", workTitle: "Kind of Blue", musicSearchQuery: "Miles Davis Kind of Blue full album" },
  { type: "theory", content: "Неаполитанский аккорд (или Неаполитанская секста) — это мажорный аккорд на пониженной второй ступени лада. В до миноре это ре-бемоль мажор. Он придаёт кульминациям особую трагическую горечь и любим романтиками — Шопеном, Шубертом, Листом.", author: null, workTitle: null, musicSearchQuery: null },
  { type: "inspiration", content: "Случайная тональность для следующего упражнения: ля-бемоль мажор. Напишите что-то в характере ноктюрна — медленно, певуче, с широкими интервалами в левой руке и орнаментированной мелодией в правой.", author: null, workTitle: null, musicSearchQuery: null },
  { type: "history", content: "В 1913 году премьера «Весны священной» Стравинского вызвала в Париже настоящий скандал: публика свистела, кричала и дралась прямо в зале. Уже через год та же публика аплодировала стоя. Этот вечер принято считать рождением музыки XX века.", author: "Игорь Стравинский", workTitle: "Весна священная", musicSearchQuery: "Stravinsky Rite of Spring 1913 premiere" },
  { type: "practice", content: "Ритмическое упражнение: возьмите любой пассаж и сыграйте его в ритме «длинная-короткая» (пунктирный), затем «короткая-длинная». Это выравнивает беглость и обнаруживает «слабые» пальцы, которые прячутся в ровном ритме.", author: null, workTitle: null, musicSearchQuery: null },
  { type: "masterclass", content: "Разбор педального приёма: «стаккато с педалью». Нажмите педаль, ударьте стаккато и отпустите — звук продолжится, но сохранит характер удара. Шопен активно использовал этот эффект в своих ноктюрнах для создания иллюзии «парящего» стаккато.", author: "Фредерик Шопен", workTitle: null, musicSearchQuery: null },
  { type: "misc", content: "Скрипка Страдивари сохраняет свои уникальные акустические свойства спустя 300 лет. Учёные до сих пор спорят о причине: одни указывают на особую обработку дерева солями металлов, другие — на уникальный лак. Ни одна современная копия не достигла полного совпадения звучания.", author: null, workTitle: null, musicSearchQuery: null },
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

function nextFallback(excludeCategories: InspirationCategory[]): InspirationItem {
  const remaining = fallbackDeck.slice(fallbackIndex);
  const preferred = remaining.filter(i => !excludeCategories.includes(i.type));
  if (preferred.length > 0) {
    const pick = preferred[Math.floor(Math.random() * preferred.length)];
    return pick;
  }
  if (fallbackIndex >= fallbackDeck.length) {
    fallbackDeck = shuffle(SEED_INSPIRATIONS);
    fallbackIndex = 0;
  }
  return fallbackDeck[fallbackIndex++];
}

const aiPool: InspirationItem[] = [];
const POOL_TARGET = 40;
let isGenerating = false;

const recentCategories: InspirationCategory[] = [];
const RECENT_CAT_WINDOW = 4;
const recentContentHashes = new Set<string>();
const MAX_CONTENT_HASHES = 120;

function hashContent(s: string): string {
  let h = 0;
  for (let i = 0; i < Math.min(s.length, 80); i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

function trackServed(item: InspirationItem) {
  recentCategories.push(item.type);
  if (recentCategories.length > RECENT_CAT_WINDOW) recentCategories.shift();
  const h = hashContent(item.content);
  recentContentHashes.add(h);
  if (recentContentHashes.size > MAX_CONTENT_HASHES) {
    const first = recentContentHashes.values().next().value;
    if (first) recentContentHashes.delete(first);
  }
}

function isContentFresh(item: InspirationItem): boolean {
  return !recentContentHashes.has(hashContent(item.content));
}

type TopicDef = {
  category: InspirationCategory;
  weight: number;
  prompt: string;
};

const TOPICS: TopicDef[] = [
  { category: "fact", weight: 3, prompt: "an astonishing fact specifically about the piano — its mechanics (hammers, strings, pedals), history, or construction — e.g. the number of strings, total string tension, how the sostenuto pedal works, or why the bass strings are wound. Write in Russian." },
  { category: "fact", weight: 3, prompt: "a fascinating fact about a legendary pianist — Glenn Gould, Martha Argerich, Vladimir Horowitz, Sviatoslav Richter, Maurizio Pollini, Evgeny Kissin, or Yuja Wang — and a defining recording or performance moment. Write in Russian." },
  { category: "fact", weight: 2, prompt: "a surprising fact about how a famous piano concerto or solo piano masterpiece was composed — who wrote it, when, under what circumstances, and how it was first received. Write in Russian." },
  { category: "fact", weight: 2, prompt: "a fascinating fact about a famous orchestra or conductor — Karajan, Bernstein, Abbado, Celibidache, or Rattle — including a legendary recording or legendary concert moment. Write in Russian." },
  { category: "fact", weight: 1, prompt: "a little-known fact about how a non-keyboard orchestral instrument works — the physics of the French horn, the mechanics of the harp's pedals, the oboe's double reed, or the contrabass's tuning. Write in Russian." },
  { category: "fact", weight: 1, prompt: "a fascinating fact about a famous violinist or cellist — Paganini, Heifetz, Oistrakh, Hilary Hahn, Rostropovich, or Jacqueline du Pré — and a landmark recording. Write in Russian." },

  { category: "quote", weight: 3, prompt: "a profound, memorable quote from a great pianist or piano composer — Chopin, Liszt, Rachmaninoff, Scriabin, Ravel, Prokofiev, Gould, Horowitz, or Argerich — about piano playing, practice, or musical expression. Write in Russian." },
  { category: "quote", weight: 2, prompt: "an inspiring quote from a classical composer (Beethoven, Schubert, Brahms, Debussy, Shostakovich, or Stravinsky) about the creative process, silence, or what music means. Write in Russian." },
  { category: "quote", weight: 1, prompt: "a powerful quote from a jazz musician — Miles Davis, Bill Evans, Oscar Peterson, Keith Jarrett, or Chick Corea — about improvisation, listening, or the relationship between music and life. Write in Russian." },
  { category: "quote", weight: 1, prompt: "a thoughtful quote from a conductor — Bernstein, Kleiber, Abbado, Karajan, or Celibidache — about the relationship between a conductor and an orchestra or about interpreting a score. Write in Russian." },

  { category: "tip", weight: 3, prompt: "a concrete, specific piano practice tip or technique — about touch, voicing, fingering, pedaling, chord playing, scales, or sight-reading — that a serious student can apply immediately. Write 2-3 sentences in Russian." },
  { category: "tip", weight: 2, prompt: "a specific composition tip for beginner or intermediate composers — about harmonic rhythm, melodic development, phrase structure, or orchestration — with a concrete example or exercise. Write in Russian." },
  { category: "tip", weight: 1, prompt: "a practice tip from a famous musician or pedagogue about how to learn a difficult passage more efficiently — used by Horowitz, Neuhaus, Cortot, or another master. Write in Russian." },

  { category: "recording", weight: 3, prompt: "a fascinating story about how a famous piano work was recorded — a Glenn Gould session, a Richter concert, an Argerich recital, a Horowitz comeback — including the specific details of what made that session legendary. Write in Russian." },
  { category: "recording", weight: 2, prompt: "an interesting story about recording a famous orchestral or chamber work — an unusual accident, improvisation, argument, or miracle that happened in the studio and shaped the final recording. Write in Russian." },
  { category: "recording", weight: 1, prompt: "a story about a famous jazz recording session — a Miles Davis, Coltrane, Bill Evans, or Keith Jarrett session — where something unexpected happened and the result became a classic. Write in Russian." },

  { category: "masterclass", weight: 3, prompt: "a short piano masterclass (2 paragraphs): a specific technical challenge (octaves, trills, fast passages, chord voicing, pedaling), how to diagnose the problem, and a concrete exercise to fix it. Write in Russian." },
  { category: "masterclass", weight: 1, prompt: "a mini masterclass on a specific music theory or compositional technique — how to use a particular harmonic device, how to develop a motif, or how to write effective counterpoint — with a short practical example. Write in Russian." },

  { category: "theory", weight: 3, prompt: "explain an interesting piano chord or harmonic technique — a specific voicing, a jazz chord extension, a Romantic-era harmonic colour, or an unusual scale — with its name, how it sounds, and a famous example where it appears. Write in Russian." },
  { category: "theory", weight: 2, prompt: "explain an interesting harmonic progression or modulation technique used in classical or jazz piano repertoire — give the name, describe how it works, and give 1-2 famous examples. Write in Russian." },
  { category: "theory", weight: 1, prompt: "describe an interesting rhythmic or polyrhythmic technique — cross-rhythm, hemiola, polyrhythm — used in piano or orchestral music, with a famous example. Write in Russian." },

  { category: "inspiration", weight: 3, prompt: "give a creative composition idea specifically for piano — a character or mood, a harmonic starting point (chord, progression, or scale), and a structural suggestion. Something that feels fresh and inspiring. Write in Russian." },
  { category: "inspiration", weight: 2, prompt: "suggest a random but musically interesting key and mode combination (e.g. 'E-flat Dorian', 'F-sharp Lydian') with a brief description of its emotional character and a suggestion for what kind of piece to write in it. Write in Russian." },
  { category: "inspiration", weight: 1, prompt: "suggest a short harmonic progression (4-8 chords) that would make an interesting basis for a piano improvisation or composition, with a suggestion for the mood and style. Write in Russian." },

  { category: "history", weight: 3, prompt: "describe a significant event in piano or keyboard music history — a world premiere, a legendary concert, a composer's first public performance, or the invention of a new piano model — with the date, place, and what made it a turning point. Write in Russian." },
  { category: "history", weight: 2, prompt: "describe an important premiere or performance of a famous orchestral or chamber work — who performed it, where, when, and what happened in the hall. Write in Russian." },
  { category: "history", weight: 1, prompt: "tell the history of a musical instrument — how it evolved over centuries, what key innovations shaped it, and who were the masters who defined its repertoire. Write in Russian." },

  { category: "practice", weight: 3, prompt: "describe a specific piano practice exercise for today — a finger independence drill, a scale pattern, a chord-transition exercise, or a sight-reading technique — with clear instructions on how to do it and what it develops. Write in Russian." },
  { category: "practice", weight: 2, prompt: "describe a rhythmic exercise that can improve timing, groove, or subdivision accuracy for a pianist — with clear step-by-step instructions. Write in Russian." },
  { category: "practice", weight: 1, prompt: "describe a mental or musical practice technique — score study without the instrument, singing through a passage, slow practice, or mirror practice — with concrete instructions. Write in Russian." },

  { category: "misc", weight: 2, prompt: "introduce an interesting but lesser-known composer who wrote primarily for piano — give their name, nationality, era, their most important work, and why they deserve more attention. Write in Russian." },
  { category: "misc", weight: 1, prompt: "describe an unusual or rare musical instrument — what it looks like, how it produces sound, which composers wrote for it, and give a famous example. Write in Russian." },
  { category: "misc", weight: 1, prompt: "describe an interesting musical style or genre that many pianists don't know well — its history, key characteristics, notable composers, and how a pianist might explore it. Write in Russian." },
];

function buildWeightedTopicPool(): TopicDef[] {
  const pool: TopicDef[] = [];
  for (const t of TOPICS) {
    for (let i = 0; i < t.weight; i++) pool.push(t);
  }
  return pool;
}

const WEIGHTED_TOPICS = buildWeightedTopicPool();

function pickTopic(excludeCategories: InspirationCategory[]): TopicDef {
  const preferred = WEIGHTED_TOPICS.filter(t => !excludeCategories.includes(t.category));
  const pool = preferred.length > 0 ? preferred : WEIGHTED_TOPICS;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function generateOne(): Promise<InspirationItem | null> {
  const exclude = recentCategories.slice(-RECENT_CAT_WINDOW);
  const topic = pickTopic(exclude);
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content: `Ты музыкальный эрудит — знаток классической музыки, фортепиано, джаза и всех музыкальных жанров. Твои ответы конкретны, живые и неожиданные — ты избегаешь клише и всегда называешь точные произведения, даты, детали. Отвечай ТОЛЬКО валидным JSON-объектом. Никакого markdown, никаких code fence.`,
        },
        {
          role: "user",
          content: `Сгенерируй: ${topic.prompt}

Верни JSON-объект с точно такими полями:
- "type": "${topic.category}"
- "content": 2-4 конкретных предложения на русском языке — живо, точно, с деталями. Никаких общих фраз.
- "author": полное имя музыканта или композитора (null если действительно общая информация)
- "workTitle": точное название произведения (null если не упоминается конкретное произведение)
- "musicSearchQuery": поисковый запрос на английском для YouTube — например "Chopin Nocturne Op 9 No 2 Argerich" (null если нет конкретного произведения или исполнителя)

Только JSON.`,
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
    while (aiPool.length < POOL_TARGET) {
      const item = await generateOne();
      if (item) {
        if (isContentFresh(item) || aiPool.filter(i => i.type === item.type).length < 3) {
          aiPool.push(item);
        }
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
}, 12_000);

fillPool().catch(() => {});

router.get("/inspiration", (req, res) => {
  const excludeCats = recentCategories.slice(-RECENT_CAT_WINDOW);

  let item: InspirationItem | undefined;

  if (aiPool.length > 0) {
    const freshPreferred = aiPool.filter(i => !excludeCats.includes(i.type) && isContentFresh(i));
    const freshAny = aiPool.filter(i => isContentFresh(i));
    const anyPreferred = aiPool.filter(i => !excludeCats.includes(i.type));

    const candidates = freshPreferred.length > 0 ? freshPreferred
      : freshAny.length > 0 ? freshAny
      : anyPreferred.length > 0 ? anyPreferred
      : aiPool;

    const idx = Math.floor(Math.random() * candidates.length);
    item = candidates[idx];
    const poolIdx = aiPool.indexOf(item);
    if (poolIdx !== -1) aiPool.splice(poolIdx, 1);

    if (aiPool.length < POOL_TARGET * 0.4 && !isGenerating) {
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
