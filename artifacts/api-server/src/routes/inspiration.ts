import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] ?? "dummy",
});

type InspirationCategory =
  | "fact" | "quote" | "tip" | "recording" | "masterclass"
  | "theory" | "inspiration" | "history" | "practice" | "misc";

type InspirationItem = {
  type: InspirationCategory;
  content: string;
  author: string | null;
  workTitle: string | null;
  musicSearchQuery: string | null;
};

// ─── Shuffle ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Topic definitions ────────────────────────────────────────────────────────
// Each topic is a SINGLE SPECIFIC SUBJECT — the AI can only produce one
// meaningful answer per topic. Topics are consumed in shuffled order, so
// no subject ever repeats until the entire list is exhausted.
//
// Distribution: ~75 piano, ~20 orchestral, ~5 other = 100 total

type TopicDef = {
  category: InspirationCategory;
  subject: string;   // unique identifier (used for dedup)
  prompt: string;    // instruction sent to the AI
};

const ALL_TOPICS: TopicDef[] = [
  // ════════════════════════════════════════════════════════
  //  PIANO — FACTS (18)
  // ════════════════════════════════════════════════════════
  {
    category: "fact", subject: "piano-strings-tension",
    prompt: "Write a specific, surprising fact about the internal mechanics of a modern concert grand piano: the exact number of strings, the total string tension (in tons), why the frame must be cast iron, and how bass strings differ from treble strings in construction.",
  },
  {
    category: "fact", subject: "cristofori-invention",
    prompt: "Write a specific fact about Bartolomeo Cristofori's invention of the piano around 1700 in Florence: what he called it, how his hammer mechanism differed from the harpsichord's plucking mechanism, and why this made expressive playing possible for the first time.",
  },
  {
    category: "fact", subject: "steinway-double-escapement",
    prompt: "Write a specific fact about Steinway's double-escapement action, when it was perfected, what problem it solved (repetition speed), and why it became the standard for modern concert grands. Include the approximate year Steinway patented this innovation.",
  },
  {
    category: "fact", subject: "bosendorfer-extra-keys",
    prompt: "Write a specific fact about the Bösendorfer Imperial 97-key piano: why it has nine extra bass keys below the standard 88, which composers wrote music requiring them, and what acoustic effect the resonating extra strings create even when not struck.",
  },
  {
    category: "fact", subject: "gould-stop-performing",
    prompt: "Write a specific fact about Glenn Gould's decision to stop giving live concerts in 1964 at age 31: what he said about audiences, the recording studio, and his belief that the live concert was an 'outmoded ritual'. Name his last public concert date and location.",
  },
  {
    category: "fact", subject: "horowitz-return-1965",
    prompt: "Write a specific fact about Vladimir Horowitz's Carnegie Hall comeback recital on May 9, 1965, after a 12-year absence from the stage: the atmosphere in the hall, the sold-out crowd, the program he played, and the emotional impact of the performance.",
  },
  {
    category: "fact", subject: "richter-no-scores",
    prompt: "Write a specific fact about Sviatoslav Richter's legendary memory — specifically his decision in later life to perform only with a score and a page-turner on stage, and the philosophical reasons he gave for this unusual choice.",
  },
  {
    category: "fact", subject: "argerich-1965-chopin-competition",
    prompt: "Write a specific fact about Martha Argerich winning the 1965 Chopin International Piano Competition in Warsaw at age 24: the jury's reaction (including Arturo Benedetti Michelangeli who threatened to leave), what she played in the final, and her preparation.",
  },
  {
    category: "fact", subject: "rachmaninoff-concerto2-depression",
    prompt: "Write a specific fact about how Rachmaninoff composed his Piano Concerto No. 2 in C minor after a period of severe depression following the failed premiere of his First Symphony: his treatment with hypnotherapy by Dr. Nikolai Dahl, the dedication, and the premiere in 1901.",
  },
  {
    category: "fact", subject: "chopin-piano-preference",
    prompt: "Write a specific fact about Frédéric Chopin's strong preference for Pleyel pianos over Érard and Steinway: why he preferred Pleyel's lighter action and singing tone, what he said about Érard pianos, and how this affected the character of his compositions.",
  },
  {
    category: "fact", subject: "liszt-invented-recital",
    prompt: "Write a specific fact about Franz Liszt inventing the solo piano recital format in the 1830s–40s: the first time he performed alone on stage without other artists, the audience's astonishment, and how he arranged his chairs differently on stage.",
  },
  {
    category: "fact", subject: "scriabin-color-music",
    prompt: "Write a specific fact about Alexander Scriabin's synesthesia and his invention of a 'color organ' (tastiera per luce) for his Prometheus: The Poem of Fire (1910): the color-pitch correspondences he used, how the premiere was staged, and whether the device actually worked.",
  },
  {
    category: "fact", subject: "michelangeli-perfectionism",
    prompt: "Write a specific fact about Arturo Benedetti Michelangeli's extreme perfectionism: his habit of cancelling concerts at the last minute, the number of recordings he authorized during his lifetime, and what made his sound on the piano uniquely recognizable.",
  },
  {
    category: "fact", subject: "sokolov-no-recordings",
    prompt: "Write a specific fact about Grigory Sokolov's refusal to release studio recordings and his insistence that only live recordings represent real music: the few authorized recordings that exist, his unmatched technique, and why musicians consider him the greatest living pianist.",
  },
  {
    category: "fact", subject: "lipatti-farewell-concert",
    prompt: "Write a specific fact about Dinu Lipatti's farewell concert at Besançon on September 7, 1950, given while he was dying of leukemia at age 33: the program he played, the moment he could not finish the final piece, and the historical significance of the recording.",
  },
  {
    category: "fact", subject: "pollini-chopin-competition",
    prompt: "Write a specific fact about Maurizio Pollini winning the 1960 Chopin Competition in Warsaw at age 18: what Arthur Rubinstein said about him after the competition, the pieces he played, and how the jury unanimously awarded him first prize.",
  },
  {
    category: "fact", subject: "sostenuto-pedal",
    prompt: "Write a specific fact about the sostenuto pedal (the middle pedal on a grand piano): exactly how it works mechanically, which composers specifically exploited it, and a famous musical passage where its effect is essential.",
  },
  {
    category: "fact", subject: "piano-hammer-mechanism",
    prompt: "Write a specific fact about the escapement mechanism in a grand piano action: why the hammer must fall away from the string immediately after striking it (rather than staying pressed against it), what would happen without this mechanism, and how many moving parts are in a single key action.",
  },

  // ════════════════════════════════════════════════════════
  //  PIANO — QUOTES (10)
  // ════════════════════════════════════════════════════════
  {
    category: "quote", subject: "chopin-quote-singing",
    prompt: "Share a specific, vivid quote from Frédéric Chopin about making the piano sing — about the quality of touch, the legato, or his belief that the piano should imitate the human voice. Give the context in which he said it.",
  },
  {
    category: "quote", subject: "liszt-quote-technique",
    prompt: "Share a specific quote from Franz Liszt about piano technique — about the relationship between virtuosity and expression, or his view that technique should be invisible. Give the source or context.",
  },
  {
    category: "quote", subject: "gould-quote-recording",
    prompt: "Share a specific, memorable quote from Glenn Gould about the recording studio: why he believed it was superior to live performance, how the microphone changed his relationship with music, or his views on editing and perfection.",
  },
  {
    category: "quote", subject: "horowitz-quote-piano",
    prompt: "Share a specific quote from Vladimir Horowitz about the piano — its sound, its possibilities, or his personal relationship with the instrument. Avoid the most commonly repeated quotes. Give context.",
  },
  {
    category: "quote", subject: "richter-quote-interpretation",
    prompt: "Share a specific quote from Sviatoslav Richter about interpretation: his view that a performer must be completely faithful to the score, serve the composer, and suppress their own personality. Give context.",
  },
  {
    category: "quote", subject: "rachmaninoff-quote-memory",
    prompt: "Share a specific quote from Sergei Rachmaninoff about his own memory, his relationship to his music, or the famous story about hearing a wrong note in a Beethoven symphony and laughing. Give context.",
  },
  {
    category: "quote", subject: "argerich-quote-performance",
    prompt: "Share a specific quote from Martha Argerich about performing, about fear on stage, about preparation, or about her instinctive approach to music. Give the context in which she said it.",
  },
  {
    category: "quote", subject: "neuhaus-quote-teaching",
    prompt: "Share a specific quote from Heinrich Neuhaus (the great Russian piano pedagogue) about how to teach piano or how to approach a musical phrase. He was the teacher of Richter and Gilels. Give the source.",
  },
  {
    category: "quote", subject: "ravel-quote-piano",
    prompt: "Share a specific quote from Maurice Ravel about the piano, about orchestral colour on the keyboard, or about his composition process for a specific piano work like Gaspard de la nuit or the Valses nobles. Give context.",
  },
  {
    category: "quote", subject: "prokofiev-quote-piano",
    prompt: "Share a specific quote from Sergei Prokofiev about his own piano style — the 'toccata' element, the percussive approach to the instrument, or his view of Romanticism. Give context.",
  },

  // ════════════════════════════════════════════════════════
  //  PIANO — TIPS (10)
  // ════════════════════════════════════════════════════════
  {
    category: "tip", subject: "tip-arm-weight",
    prompt: "Explain the technique of using arm weight rather than finger pressure on the piano: why tension in the forearm kills tone quality, how to transfer arm weight into the key naturally, and a simple exercise to develop this skill.",
  },
  {
    category: "tip", subject: "tip-voicing-chords",
    prompt: "Explain the technique of voicing a piano chord — how to bring out the top note of a chord while subordinating the inner voices, the physical adjustment needed (different weight on different fingers), and an example from Chopin or Debussy where this matters.",
  },
  {
    category: "tip", subject: "tip-syncopated-pedal",
    prompt: "Explain syncopated (legato) pedalling on the piano: exactly when to depress and release the pedal relative to the melody, why changing the pedal on the beat creates muddiness, and which repertoire makes this technique essential.",
  },
  {
    category: "tip", subject: "tip-slow-practice",
    prompt: "Explain the specific method of extremely slow practice: why it works neurologically (motor programming), how slow you should actually go, what to focus attention on at slow tempo, and the danger of mindless slow repetition without focused attention.",
  },
  {
    category: "tip", subject: "tip-trill-technique",
    prompt: "Explain how to develop a fast, even trill on the piano: the correct hand position, which finger combinations work best, why the wrist must be relaxed, and a graduated exercise to build trill speed over several weeks.",
  },
  {
    category: "tip", subject: "tip-octave-playing",
    prompt: "Explain the technique for playing fast octaves on the piano: the role of forearm rotation (supination/pronation), why the wrist must stay flexible rather than rigid, and what Liszt and Brahms demand in terms of octave technique. Include a warm-up approach.",
  },
  {
    category: "tip", subject: "tip-memorization",
    prompt: "Explain three different types of piano memory (motor/muscle memory, aural memory, harmonic/structural memory) and why relying on muscle memory alone leads to memory slips in performance. Describe how to strengthen each type.",
  },
  {
    category: "tip", subject: "tip-rubato",
    prompt: "Explain Chopin's concept of rubato: why 'robbing time' means the left hand stays steady while the right hand floats freely, how this differs from rushing and dragging the whole texture, and an example passage in a Chopin nocturne where this applies.",
  },
  {
    category: "tip", subject: "tip-sight-reading",
    prompt: "Explain a systematic approach to improving piano sight-reading: how far ahead to look (intervals vs. patterns), why you must never stop for a wrong note, how to identify hand position shapes before playing, and a daily practice routine.",
  },
  {
    category: "tip", subject: "tip-legato",
    prompt: "Explain how to achieve a true legato on the piano — why it is physically difficult (the piano is a percussive instrument), how to overlap key releases, the role of the pedal vs. finger legato, and a Schubert slow movement as a test case.",
  },

  // ════════════════════════════════════════════════════════
  //  PIANO — RECORDING STORIES (8)
  // ════════════════════════════════════════════════════════
  {
    category: "recording", subject: "gould-goldberg-1955",
    prompt: "Describe the story of Glenn Gould's 1955 recording of the Goldberg Variations: his age (22), the Columbia Records session in New York, the humming audible in the background, the unconventional fast tempos, and how it made him famous overnight.",
  },
  {
    category: "recording", subject: "gould-goldberg-1981",
    prompt: "Describe Glenn Gould's 1981 recording of the Goldberg Variations, made just weeks before his death at 50: how he described it as 'a very, very lonely' work, the radical difference in tempo from 1955, and why it is considered one of the most profound piano recordings ever made.",
  },
  {
    category: "recording", subject: "horowitz-carnegie-1965-recording",
    prompt: "Describe the recording of Vladimir Horowitz's 1965 Carnegie Hall return concert: why CBS recorded it live, what pieces he played (include specific works), the visible emotion in the hall, and how this record became one of the best-selling classical albums of its era.",
  },
  {
    category: "recording", subject: "argerich-chopin-etudes",
    prompt: "Describe Martha Argerich's legendary 1975 Deutsche Grammophon recording of Chopin Etudes and the Scherzi: why it is still considered the definitive reference, the extraordinary speed of her octave passages, and one specific etude where her interpretation is unmatchable.",
  },
  {
    category: "recording", subject: "richter-carnegie-1960",
    prompt: "Describe Sviatoslav Richter's 1960 Carnegie Hall debut recording (released by Deutsche Grammophon): why it was considered miraculous, what pieces he played, the audience's reaction, and the specific qualities of his sound that astonished American audiences.",
  },
  {
    category: "recording", subject: "lipatti-besancon-1950",
    prompt: "Describe the recording of Dinu Lipatti's final concert at Besançon in 1950 while dying of leukemia: the program he played, the moment in the Chopin waltzes when he ran out of strength, and why this recording is considered one of the most moving documents in piano history.",
  },
  {
    category: "recording", subject: "michelangeli-ravel",
    prompt: "Describe Arturo Benedetti Michelangeli's landmark 1957 recording of Ravel's Gaspard de la nuit and Sonatine: why many consider it the definitive Ravel recording, the crystalline clarity of his touch, and his approach to the extreme demands of 'Scarbo'.",
  },
  {
    category: "recording", subject: "pletnev-tchaikovsky",
    prompt: "Describe Mikhail Pletnev's groundbreaking transcriptions of Tchaikovsky's Nutcracker Suite for solo piano: when he made them, how he arranged the orchestral textures for ten fingers, and why pianists and critics were astonished by the completeness of his piano writing.",
  },

  // ════════════════════════════════════════════════════════
  //  PIANO — MASTERCLASS (7)
  // ════════════════════════════════════════════════════════
  {
    category: "masterclass", subject: "masterclass-double-thirds",
    prompt: "Write a short masterclass on playing double thirds on the piano (2 paragraphs): why they are difficult (simultaneous independent finger movement), the specific hand position and finger curve needed, and a Chopin Etude Op.25 No.6 approach.",
  },
  {
    category: "masterclass", subject: "masterclass-fast-repeated-notes",
    prompt: "Write a short masterclass on fast repeated notes on the piano (2 paragraphs): the technique of changing fingers on the same key, the role of wrist rotation, and how Liszt and Prokofiev use this effect. Include a specific exercise.",
  },
  {
    category: "masterclass", subject: "masterclass-brahms-thick-chords",
    prompt: "Write a short masterclass on playing Brahms's thick chord textures without tension (2 paragraphs): why Brahms demands arm weight from the shoulder, how to distribute weight across the fingers in a six-note chord, and a passage from the Brahms Second Concerto as example.",
  },
  {
    category: "masterclass", subject: "masterclass-chopin-nocturne-line",
    prompt: "Write a short masterclass on how to play a Chopin Nocturne melody (2 paragraphs): the singing quality, how to create the illusion of crescendo on a single sustained note, where the rubato comes from, and the specific left-hand role in keeping time.",
  },
  {
    category: "masterclass", subject: "masterclass-hand-crossings",
    prompt: "Write a short masterclass on hand crossings in piano music (2 paragraphs): the physical mechanics of crossing the right hand over the left (or vice versa), common mistakes (tangling, tension), and Scarlatti or Chopin Fantasie-Impromptu as a model.",
  },
  {
    category: "masterclass", subject: "masterclass-debussy-pedal",
    prompt: "Write a short masterclass on pedalling Debussy (2 paragraphs): why standard pedalling makes Debussy muddy, how to use half-pedal and flutter pedal, and a specific passage from Clair de lune or La cathédrale engloutie where careful pedalling is essential.",
  },
  {
    category: "masterclass", subject: "masterclass-scale-evenness",
    prompt: "Write a short masterclass on achieving even, fast scales on the piano (2 paragraphs): why the 4th finger is the weak link, how to practise hands separately with varying rhythms and accents, and the correct thumb-under technique without interrupting the line.",
  },

  // ════════════════════════════════════════════════════════
  //  PIANO — THEORY (7)
  // ════════════════════════════════════════════════════════
  {
    category: "theory", subject: "theory-tristan-chord",
    prompt: "Explain the Tristan chord from Wagner's Tristan und Isolde (1859): its exact notes (F, B, D♯, A♯), why it is ambiguous (it belongs to multiple keys), how it never resolves in the opera, and why it marks the beginning of the dissolution of classical tonality.",
  },
  {
    category: "theory", subject: "theory-neapolitan-sixth",
    prompt: "Explain the Neapolitan chord (Neapolitan sixth): what it is (a major chord on the flattened second degree), how it functions in a minor key, its distinctive emotional colour, and a famous piano example by Chopin, Schubert, or Beethoven where it is used powerfully.",
  },
  {
    category: "theory", subject: "theory-whole-tone-scale",
    prompt: "Explain the whole-tone scale: its construction (all whole steps, no half steps), the dreamlike ambiguity it creates because it has no leading tone, and two famous piano pieces by Debussy where he uses it — describing the specific passage and its effect.",
  },
  {
    category: "theory", subject: "theory-coltrane-changes",
    prompt: "Explain 'Coltrane changes' — the harmonic substitution system John Coltrane developed for Giant Steps (1960): how he replaced standard ii-V-I progressions with three tonal centres a major third apart, and why this was so revolutionary for jazz piano.",
  },
  {
    category: "theory", subject: "theory-octatonic-scale",
    prompt: "Explain the octatonic (diminished) scale: its alternating whole-step–half-step pattern, how it creates a sense of symmetry and instability, and how Stravinsky used it in The Rite of Spring and how Bartók used it in his piano music.",
  },
  {
    category: "theory", subject: "theory-lydian-mode",
    prompt: "Explain the Lydian mode (major scale with raised 4th): its bright, floating, otherworldly character, how it differs emotionally from a regular major scale, and a famous piano piece or film score that uses it memorably. Include a chord built from Lydian harmony.",
  },
  {
    category: "theory", subject: "theory-picardy-third",
    prompt: "Explain the Picardy third: the technique of ending a piece in a minor key with a major chord on the final tonic, why it was common in Baroque music, what emotional effect it creates, and a famous Bach example where it appears unexpectedly.",
  },

  // ════════════════════════════════════════════════════════
  //  PIANO — INSPIRATION (7)
  // ════════════════════════════════════════════════════════
  {
    category: "inspiration", subject: "inspiration-nocturne-idea",
    prompt: "Give a specific composition idea for a piano nocturne: the key (choose something unusual, like D♭ major or E minor), the left-hand pattern, the melodic character, a specific harmonic turn to use in the middle section, and a mood or image to aim for.",
  },
  {
    category: "inspiration", subject: "inspiration-prelude-idea",
    prompt: "Give a specific composition idea for a short piano prelude in the spirit of Chopin or Scriabin: a key, a single defining texture or gesture, a harmonic progression that drives the piece, and a suggested length and emotional arc.",
  },
  {
    category: "inspiration", subject: "inspiration-bwv-style",
    prompt: "Give a specific composition idea for a two-voice invention in the style of Bach: a subject (describe it melodically), how to invert it for the answer, a key for the episode, and a specific harmonic destination for the climax.",
  },
  {
    category: "inspiration", subject: "inspiration-pentatonic",
    prompt: "Give a specific composition idea based on a pentatonic scale: choose one (e.g. F♯ major pentatonic), describe a texture for the piano, suggest an unusual rhythm or phrase length to avoid symmetry, and a mood the piece should express.",
  },
  {
    category: "inspiration", subject: "inspiration-chromatic-harmony",
    prompt: "Give a specific composition idea using chromatic mediant relationships (chords whose roots are a third apart but share no common function): choose a starting key and describe two chromatic mediant moves, and the emotional effect they create.",
  },
  {
    category: "inspiration", subject: "inspiration-jazz-voicings",
    prompt: "Give a specific composition or improvisation idea using jazz piano voicings: suggest a specific chord (e.g. Cmaj9♯11), how to voice it on the piano with left and right hands, and a four-bar harmonic idea to improvise over.",
  },
  {
    category: "inspiration", subject: "inspiration-modal-piece",
    prompt: "Give a specific composition idea in a non-major/minor mode: choose a mode (Phrygian, Dorian, or Mixolydian), a root note, a piano texture, a characteristic cadence in that mode, and a suggested emotional character and length.",
  },

  // ════════════════════════════════════════════════════════
  //  PIANO — HISTORY (4)
  // ════════════════════════════════════════════════════════
  {
    category: "history", subject: "history-chopin-paris-debut",
    prompt: "Describe Frédéric Chopin's Paris debut concert on February 26, 1832: the venue (Salle Pleyel), who attended (Liszt, Mendelssohn, Kalkbrenner), Chopin's extreme nerves, what he played, and the response of the Parisian musical world.",
  },
  {
    category: "history", subject: "history-beethoven-1808-concert",
    prompt: "Describe Ludwig van Beethoven's 'Academy' concert on December 22, 1808 in Vienna: the four-hour program (Symphonies 5 and 6, Piano Concerto No. 4, Choral Fantasy), the freezing hall, the unprepared orchestra, and the chaos of the final Choral Fantasy performance.",
  },
  {
    category: "history", subject: "history-liszt-recital-format",
    prompt: "Describe Franz Liszt's invention of the solo piano recital in the 1840s: the specific moment he first performed alone on stage (without a program of mixed artists), the audience reaction to a single performer filling an entire concert, and his theatrical stage manner.",
  },
  {
    category: "history", subject: "history-brahms-meets-schumann",
    prompt: "Describe the meeting between 20-year-old Johannes Brahms and Robert Schumann in Düsseldorf in 1853: what Brahms played for Schumann, Schumann's extraordinary review in the Neue Zeitschrift für Musik, and how this moment launched Brahms's career.",
  },

  // ════════════════════════════════════════════════════════
  //  PIANO — PRACTICE (4)
  // ════════════════════════════════════════════════════════
  {
    category: "practice", subject: "practice-dotted-rhythms",
    prompt: "Describe the dotted-rhythm practice technique for piano: play a passage in long-short dotted rhythm, then short-long, then even. Explain exactly why this works (it forces each individual finger to move decisively), and a suitable passage to try it on.",
  },
  {
    category: "practice", subject: "practice-hands-separately",
    prompt: "Describe a systematic hands-separately practice method for a difficult piano passage: how long to spend on each hand, at what tempo, what to listen for, when it is safe to put hands together, and the specific danger of putting hands together too soon.",
  },
  {
    category: "practice", subject: "practice-mental-practice",
    prompt: "Describe the method of mental practice (practising without the piano): how to 'play' a piece mentally note by note, why it exposes gaps in knowledge faster than physical practice, which famous pianists used it (e.g. Glenn Gould, Sviatoslav Richter), and how to do it effectively.",
  },
  {
    category: "practice", subject: "practice-metronome-method",
    prompt: "Describe an effective way to use a metronome to build tempo: starting below target speed, practising at each tempo level until completely comfortable, the increments to use, and why increasing tempo too quickly creates bad habits.",
  },

  // ════════════════════════════════════════════════════════
  //  ORCHESTRAL — FACTS (5)
  // ════════════════════════════════════════════════════════
  {
    category: "fact", subject: "kleiber-beethoven5",
    prompt: "Write a specific fact about Carlos Kleiber's legendary 1975 recording of Beethoven's Fifth Symphony with the Vienna Philharmonic: why it is considered the definitive recording, Kleiber's unusual rehearsal method, and what critics said when it was released.",
  },
  {
    category: "fact", subject: "shostakovich-leningrad-symphony",
    prompt: "Write a specific fact about the premiere of Shostakovich's Seventh Symphony ('Leningrad') on August 9, 1942, performed inside besieged Leningrad: how the orchestra was assembled from starving musicians, how the score was smuggled out, and the role of the premiere in wartime propaganda.",
  },
  {
    category: "fact", subject: "mahler-eighth-premiere",
    prompt: "Write a specific fact about the premiere of Mahler's Eighth Symphony in Munich on September 12, 1910: the thousand performers on stage (hence 'Symphony of a Thousand'), the audience reaction, who attended, and Mahler's emotional state.",
  },
  {
    category: "fact", subject: "furtwangler-tristan",
    prompt: "Write a specific fact about Wilhelm Furtwängler's 1952 recording of Wagner's Tristan und Isolde in Bayreuth: why it is still considered the greatest-ever recording of the opera, his unique way of shaping the long Wagnerian phrases, and the specific cast.",
  },
  {
    category: "fact", subject: "celibidache-no-recordings",
    prompt: "Write a specific fact about Sergiu Celibidache's famous refusal to make commercial recordings during his lifetime: his philosophical reasons (recordings 'freeze' music that must be live), the few surviving broadcasts, and the speed of his rehearsals compared to other conductors.",
  },

  // ════════════════════════════════════════════════════════
  //  ORCHESTRAL — QUOTES (4)
  // ════════════════════════════════════════════════════════
  {
    category: "quote", subject: "kleiber-quote",
    prompt: "Share a specific, memorable quote from Carlos Kleiber about conducting, music, or the orchestra — something that reveals his unusual personality and perfectionism. Give context about when or to whom he said it.",
  },
  {
    category: "quote", subject: "celibidache-quote",
    prompt: "Share a specific quote from Sergiu Celibidache about music, silence, recordings, or the act of conducting — something that captures his philosophical, almost mystical approach to music. Give context.",
  },
  {
    category: "quote", subject: "bernstein-quote",
    prompt: "Share a specific, vivid quote from Leonard Bernstein about music's power, about what a conductor does, or about his dual life as composer and conductor. Avoid the most commonly cited Bernstein quotes. Give context.",
  },
  {
    category: "quote", subject: "abbado-quote",
    prompt: "Share a specific quote from Claudio Abbado about the relationship between a conductor and an orchestra, about listening, or about his belief in collaborative music-making rather than authoritarian control. Give context.",
  },

  // ════════════════════════════════════════════════════════
  //  ORCHESTRAL — RECORDING STORIES (4)
  // ════════════════════════════════════════════════════════
  {
    category: "recording", subject: "rite-of-spring-riot",
    prompt: "Describe the premiere of Stravinsky's The Rite of Spring on May 29, 1913, in Paris: the riot in the audience (shouting, fighting), who was present (Debussy, Saint-Saëns), what triggered the chaos, and how Stravinsky responded. Describe how the same audience received it a year later.",
  },
  {
    category: "recording", subject: "karajan-berlin-beethoven",
    prompt: "Describe Herbert von Karajan's 1963 complete Beethoven symphony cycle recording with the Berlin Philharmonic: the technical innovations Deutsche Grammophon used, the recording conditions, and why this set was the gold standard for 30 years.",
  },
  {
    category: "recording", subject: "furtwangler-wartime-beethoven9",
    prompt: "Describe Wilhelm Furtwängler's 1942 Berlin wartime recording of Beethoven's Ninth Symphony: the political context (Hitler's birthday celebrations), the extraordinary emotional intensity of the performance, and the controversy surrounding its use by the Nazi regime.",
  },
  {
    category: "recording", subject: "abbado-mahler9",
    prompt: "Describe Claudio Abbado's 2010 live recording of Mahler's Ninth Symphony with the Lucerne Festival Orchestra: the context (Abbado's cancer, which he had survived), the extraordinary silence at the end of the last movement, and why audiences and critics called it a spiritual experience.",
  },

  // ════════════════════════════════════════════════════════
  //  ORCHESTRAL — THEORY & TECHNIQUE (4)
  // ════════════════════════════════════════════════════════
  {
    category: "theory", subject: "theory-ravel-orchestration",
    prompt: "Describe a specific orchestration technique from Ravel — his use of muted strings, sul ponticello, col legno, or his orchestration of Pictures at an Exhibition: how he assigned different instruments to different characters and what makes his orchestral palette uniquely transparent.",
  },
  {
    category: "theory", subject: "theory-bartok-night-music",
    prompt: "Describe Bartók's 'night music' texture: the specific combination of sounds he uses (chromatic string tremolos, isolated wind calls, piano clusters), where it first appeared, and how it influenced later composers. Give an example from his piano or orchestral works.",
  },
  {
    category: "theory", subject: "theory-mahler-orchestration",
    prompt: "Describe a specific orchestration technique from Mahler: his use of chamber-music transparency within the orchestra, his marking 'wie aus der Ferne' (as if from a distance), and a specific moment in his symphonies where this technique creates an extraordinary effect.",
  },
  {
    category: "theory", subject: "theory-shostakovich-strings",
    prompt: "Describe Shostakovich's characteristic string writing: his use of unison passages for emotional intensity, the grinding chromatic lines in his string quartets, and a specific moment from his Fifth Symphony or Eighth String Quartet that shows his distinctive voice.",
  },

  // ════════════════════════════════════════════════════════
  //  ORCHESTRAL — HISTORY (3)
  // ════════════════════════════════════════════════════════
  {
    category: "history", subject: "history-rite-of-spring",
    prompt: "Describe the historical significance of The Rite of Spring (1913) as a turning point in music history: why its premiere caused a riot, what was so shocking about the rhythm and harmony, and how it changed what composers felt was possible in music.",
  },
  {
    category: "history", subject: "history-vienna-philharmonic-founding",
    prompt: "Describe the founding of the Vienna Philharmonic in 1842: who created it and why, the democratic self-governing structure of the orchestra, and a decisive moment in their history that defined their sound and identity as the world's most prestigious orchestra.",
  },
  {
    category: "history", subject: "history-shostakovich-fifth",
    prompt: "Describe the premiere of Shostakovich's Fifth Symphony in Leningrad in 1937: the political context (Stalin's terror, Shostakovich under threat after his Fourth was withdrawn), the audience weeping during the slow movement, and how the finale was interpreted differently by different listeners.",
  },

  // ════════════════════════════════════════════════════════
  //  OTHER (5)
  // ════════════════════════════════════════════════════════
  {
    category: "fact", subject: "billevans-portrait-in-jazz",
    prompt: "Write a specific fact about Bill Evans's recording of Portrait in Jazz (1959) with the first great piano trio: the revolutionary equal-voice interplay between Evans, Scott LaFaro, and Paul Motian, and how this recording changed how jazz piano trios play together.",
  },
  {
    category: "quote", subject: "billevans-quote-practice",
    prompt: "Share a specific quote from Bill Evans about his approach to practice, about what he called 'the universal mind', or about patience in learning. Give context about when and where he said it.",
  },
  {
    category: "history", subject: "history-first-piano-recording",
    prompt: "Describe the earliest known piano recordings in history: approximately when they were made (1890s), who made them, what the recording technology was like (cylinder phonograph), and what we can actually hear in these extraordinary documents.",
  },
  {
    category: "misc", subject: "misc-prepared-piano",
    prompt: "Describe John Cage's prepared piano: what it is (objects inserted between strings), when Cage invented it (late 1930s), which pieces use it most famously, and what the instrument sounds like — the combination of percussion and piano tones it creates.",
  },
  {
    category: "misc", subject: "misc-theremin",
    prompt: "Describe the theremin: how it works (played without touching it, using electromagnetic fields), who invented it and when (Léon Theremin, 1920), which classical composers wrote for it (Shostakovich, Martinu), and how it influenced the sound of 20th-century film music.",
  },
];

// ─── Topic queue (shuffled, consumed in order) ────────────────────────────────

let topicQueue: TopicDef[] = shuffle(ALL_TOPICS);
let topicIndex = 0;

function nextTopic(): TopicDef {
  if (topicIndex >= topicQueue.length) {
    topicQueue = shuffle(ALL_TOPICS);
    topicIndex = 0;
  }
  return topicQueue[topicIndex++];
}

// ─── Served-item tracking (dedup) ────────────────────────────────────────────

const servedSubjects = new Set<string>();   // never repeat a subject
const servedContentHashes = new Set<string>();

function contentHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function trackServed(item: InspirationItem & { subject: string }) {
  servedSubjects.add(item.subject);
  servedContentHashes.add(contentHash(item.content));
  recentCategories.push(item.type);
  if (recentCategories.length > RECENT_WINDOW) recentCategories.shift();
}

const recentCategories: InspirationCategory[] = [];
const RECENT_WINDOW = 4;

// ─── Pool of pre-generated items ─────────────────────────────────────────────

type PoolItem = InspirationItem & { subject: string };

const aiPool: PoolItem[] = [];
const POOL_TARGET = 30;
let isGenerating = false;

async function generateOne(topic: TopicDef): Promise<PoolItem | null> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: `You are a world-class music scholar with encyclopedic knowledge of the piano repertoire, orchestral music, and jazz. Your responses are vivid, factually precise, and surprising — always include specific dates, names, opus numbers, and concrete details. Never be vague or generic. Respond ONLY with a valid JSON object. No markdown, no code fences.`,
        },
        {
          role: "user",
          content: `${topic.prompt}

Return a JSON object with exactly these fields:
- "type": "${topic.category}"
- "content": 2–4 sentences in English, specific and factually accurate. Every sentence must add new information. No filler.
- "author": full name of the musician or composer (null only for genuinely general facts)
- "workTitle": exact title of the specific musical work mentioned (null if no specific piece)
- "musicSearchQuery": English search query for YouTube — e.g. "Chopin Nocturne Op 9 No 2 Argerich 1965" (null only if no specific work or performer is mentioned)

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
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return null;
      try { parsed = JSON.parse(match[0]); } catch { return null; }
    }

    const content = String(parsed.content ?? "").trim();
    if (!content || content.length < 40) return null;

    // Reject if we've already served this subject or content
    if (servedSubjects.has(topic.subject)) return null;
    if (servedContentHashes.has(contentHash(content))) return null;

    return {
      subject: topic.subject,
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
      const topic = nextTopic();
      // Skip subjects already in pool or already served
      if (servedSubjects.has(topic.subject) || aiPool.some(i => i.subject === topic.subject)) {
        continue;
      }
      const item = await generateOne(topic);
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
}, 8_000);

fillPool().catch(() => {});

// ─── Fallback seed (English, for when pool is empty) ─────────────────────────

const SEED_ITEMS: PoolItem[] = [
  { subject: "seed-piano-strings", type: "fact", content: "A modern concert grand piano contains approximately 230 strings under a combined tension of around 20 tons — which is why the frame must be cast from a single piece of iron. The lowest bass strings are wound with copper wire to add mass without requiring impractical length.", author: null, workTitle: null, musicSearchQuery: null },
  { subject: "seed-gould-humming", type: "fact", content: "Glenn Gould's famous humming on his recordings was not a studio affectation — it was an involuntary habit he could not control, even in the recording studio. Columbia Records engineers tried everything to suppress it; the humming remained audible on virtually every recording he made.", author: "Glenn Gould", workTitle: null, musicSearchQuery: null },
  { subject: "seed-chopin-singing", type: "quote", content: "It is not necessary to play everything with a beautiful tone. Sometimes the piano should sound like a guitar.", author: "Frédéric Chopin", workTitle: null, musicSearchQuery: null },
  { subject: "seed-arm-weight-tip", type: "tip", content: "When playing a deep, resonant piano tone, think of dropping arm weight into the key rather than pushing with the finger. The key should feel as if it sinks under the weight of a relaxed arm — not under the pressure of a tense finger. Tension kills resonance.", author: null, workTitle: null, musicSearchQuery: null },
  { subject: "seed-rite-riot", type: "recording", content: "The premiere of Stravinsky's The Rite of Spring on May 29, 1913 in Paris ended in a riot. Audience members shouted, whistled, and fought while the dancers could barely hear the orchestra. One year later, the same Parisian public gave the concert version a standing ovation.", author: "Igor Stravinsky", workTitle: "The Rite of Spring", musicSearchQuery: "Stravinsky Rite of Spring Gergiev Mariinsky" },
  { subject: "seed-tristan-chord", type: "theory", content: "The 'Tristan chord' — F, B, D♯, A♯ — opens Wagner's Tristan und Isolde and famously never resolves to a clear tonic throughout the entire four-hour opera. This single chord is often cited as the starting point for the breakdown of classical tonality that defined 20th-century music.", author: "Richard Wagner", workTitle: "Tristan und Isolde", musicSearchQuery: "Wagner Tristan Prelude Furtwangler" },
  { subject: "seed-nocturne-idea", type: "inspiration", content: "Try writing a nocturne in D♭ major — Chopin's favourite key for intimate, nocturnal music. Use a wide-spanning left-hand accompaniment in 6/8, let the right-hand melody begin on the 5th degree, and introduce a chromatic inner voice in the second phrase to deepen the harmony.", author: null, workTitle: null, musicSearchQuery: null },
  { subject: "seed-slow-practice", type: "practice", content: "Practise the passage at one quarter of the target speed, focusing on the physical sensation of each individual key going down. This is motor programming, not musical practice. Speed comes automatically once the movements are precisely encoded — rushing to full tempo before the movements are clean only reinforces mistakes.", author: null, workTitle: null, musicSearchQuery: null },
];

let seedIndex = 0;
let seedDeck = shuffle(SEED_ITEMS);

function nextSeedItem(excludeCats: InspirationCategory[]): PoolItem {
  const available = seedDeck.filter(i => !excludeCats.includes(i.type) && !servedSubjects.has(i.subject));
  if (available.length > 0) return available[Math.floor(Math.random() * available.length)];
  if (seedIndex >= seedDeck.length) { seedDeck = shuffle(SEED_ITEMS); seedIndex = 0; }
  return seedDeck[seedIndex++];
}

// ─── Route ────────────────────────────────────────────────────────────────────

router.get("/inspiration", (req, res) => {
  const excludeCats = recentCategories.slice(-RECENT_WINDOW);

  let item: PoolItem | undefined;

  if (aiPool.length > 0) {
    // 1. prefer fresh subject + different category
    const best = aiPool.filter(i => !excludeCats.includes(i.type) && !servedSubjects.has(i.subject));
    // 2. any fresh subject
    const freshAny = aiPool.filter(i => !servedSubjects.has(i.subject));
    // 3. different category
    const diffCat = aiPool.filter(i => !excludeCats.includes(i.type));

    const candidates = best.length > 0 ? best
      : freshAny.length > 0 ? freshAny
      : diffCat.length > 0 ? diffCat
      : aiPool;

    const idx = Math.floor(Math.random() * candidates.length);
    item = candidates[idx];
    aiPool.splice(aiPool.indexOf(item), 1);

    if (aiPool.length < POOL_TARGET * 0.5 && !isGenerating) {
      fillPool().catch(() => {});
    }
  }

  if (!item) {
    item = nextSeedItem(excludeCats);
  }

  trackServed(item);
  res.json({
    type: item.type,
    content: item.content,
    author: item.author,
    workTitle: item.workTitle,
    musicSearchQuery: item.musicSearchQuery,
  });
});

export default router;
