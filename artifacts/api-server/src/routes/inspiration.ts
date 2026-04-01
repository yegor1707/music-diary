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
  subject: string;          // unique identifier — never served twice
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

// ─── Curated library (50 unique subjects, served before AI is ready) ──────────
// Each item has a unique `subject` key. No subject is ever served twice.

const CURATED: InspirationItem[] = [
  // FACTS — piano mechanics & history
  { subject: "piano-strings-tension", type: "fact", author: null, workTitle: null, musicSearchQuery: null,
    content: "A modern concert grand piano contains approximately 230 strings under a combined tension of around 20 tons — which is why the frame must be cast from a single piece of iron. The lowest bass strings are wound with copper wire to add mass without requiring impractical length." },
  { subject: "cristofori-invention", type: "fact", author: null, workTitle: null, musicSearchQuery: null,
    content: "Bartolomeo Cristofori invented the piano around 1700 in Florence and called it 'gravicembalo col piano e forte' — a harpsichord with soft and loud. Unlike the harpsichord's quill-plucking mechanism, Cristofori's hammer struck the string and immediately escaped, making gradations of dynamics possible for the first time." },
  { subject: "steinway-double-escapement", type: "fact", author: null, workTitle: null, musicSearchQuery: null,
    content: "The Steinway double-escapement action, perfected in the 1840s, allows a piano hammer to repetitively strike a string without the key being fully released — essential for fast passages. A single piano key action contains approximately 70 individual moving parts, all calibrated to within fractions of a millimetre." },
  { subject: "bosendorfer-extra-keys", type: "fact", author: null, workTitle: "Bösendorfer Imperial 97", musicSearchQuery: "Bosendorfer Imperial grand piano extra bass keys",
    content: "The Bösendorfer Imperial has 97 keys instead of the standard 88 — nine extra bass keys extending down to low C. They are often covered by a wooden flap during normal use. Even when not struck, they resonate sympathetically with the strings above them, enriching the instrument's bass resonance." },
  { subject: "sostenuto-pedal", type: "fact", author: null, workTitle: null, musicSearchQuery: null,
    content: "The sostenuto pedal — the middle pedal on a grand piano — sustains only the notes that are already depressed at the moment the pedal is pressed, leaving all subsequently played notes dry. Ravel used it famously in his Concerto in G to sustain a single bass note through an entire passage of crystalline melody above." },
  // FACTS — legendary pianists
  { subject: "gould-stop-performing", type: "fact", author: "Glenn Gould", workTitle: null, musicSearchQuery: "Glenn Gould last concert 1964",
    content: "Glenn Gould gave his last public concert in Los Angeles on April 10, 1964, at the age of 31 — and never performed live again. He told interviewers that the concert hall was 'the last thing I want to do,' believing the recording studio allowed a perfection and intimacy impossible in live performance." },
  { subject: "gould-humming", type: "fact", author: "Glenn Gould", workTitle: null, musicSearchQuery: "Glenn Gould humming Goldberg Variations",
    content: "Glenn Gould's audible humming on his recordings was entirely involuntary — his mother had encouraged him to sing along while practising as a child, and the habit became permanent. Columbia Records engineers tried isolation booths, directional microphones, and post-production filtering; nothing eliminated it entirely." },
  { subject: "horowitz-return-1965", type: "fact", author: "Vladimir Horowitz", workTitle: null, musicSearchQuery: "Horowitz Carnegie Hall 1965 return concert",
    content: "Vladimir Horowitz's return to Carnegie Hall on May 9, 1965, after a 12-year absence from the stage, was one of the most emotional events in piano history. Tickets were gone within hours of going on sale; the audience wept; and Horowitz himself shook visibly before walking onstage." },
  { subject: "richter-score-on-stage", type: "fact", author: "Sviatoslav Richter", workTitle: null, musicSearchQuery: "Sviatoslav Richter score on stage",
    content: "Sviatoslav Richter famously performed in later life with a score open on the music desk and a page-turner beside him. He explained that this allowed him to serve the composer's text rather than his own ego: 'The performer must subordinate himself completely to the composer's intentions.'" },
  { subject: "argerich-chopin-competition", type: "fact", author: "Martha Argerich", workTitle: null, musicSearchQuery: "Martha Argerich 1965 Chopin competition",
    content: "Martha Argerich won the 1965 Chopin International Piano Competition in Warsaw at age 24. Arturo Benedetti Michelangeli, serving on the jury, was so overwhelmed that he threatened to leave if she did not win first prize. After her victory, Arthur Rubinstein declared she was the most brilliant talent of her generation." },
  { subject: "lipatti-farewell-concert", type: "fact", author: "Dinu Lipatti", workTitle: null, musicSearchQuery: "Dinu Lipatti farewell concert Besancon 1950",
    content: "Dinu Lipatti gave his farewell recital at Besançon on September 7, 1950, while dying of leukemia at 33. He collapsed before finishing the last Chopin waltz, unable to continue. The recording — capturing his crystalline, fragile tone — is considered one of the most moving documents in the history of the piano." },
  { subject: "pollini-chopin-1960", type: "fact", author: "Maurizio Pollini", workTitle: null, musicSearchQuery: "Maurizio Pollini 1960 Chopin competition",
    content: "Maurizio Pollini won the 1960 Chopin Competition in Warsaw at 18. Arthur Rubinstein, head of the jury, famously said: 'This boy plays better than any of us.' The jury awarded him first prize unanimously, and Pollini withdrew from public performance for several years afterwards to continue his studies." },
  { subject: "michelangeli-perfectionism", type: "fact", author: "Arturo Benedetti Michelangeli", workTitle: null, musicSearchQuery: "Michelangeli piano perfectionism recordings",
    content: "Arturo Benedetti Michelangeli cancelled concerts so frequently that concert halls eventually stopped booking him. During his entire career he authorized fewer than a dozen commercial recordings. Those that exist — particularly his Ravel and Scarlatti — are marked by a touch so precise it sounds mechanical, yet profoundly musical." },
  { subject: "sokolov-live-only", type: "fact", author: "Grigory Sokolov", workTitle: null, musicSearchQuery: "Grigory Sokolov live concert piano",
    content: "Grigory Sokolov refused to make studio recordings for most of his career, insisting that only the live concert has musical truth. Deutsche Grammophon eventually convinced him to release a series of live recordings. Many pianists and critics consider him the greatest living pianist — yet he remains virtually unknown to the general public." },
  // QUOTES — composers and pianists
  { subject: "chopin-quote-singing", type: "quote", author: "Frédéric Chopin", workTitle: null, musicSearchQuery: null,
    content: "Everything is a matter of knowing how to sing. — Chopin told his pupil Carl Mikuli that the entire art of the piano comes down to imitating the human voice: a melody must breathe, phrase, and shape itself as a great singer would, regardless of the instrument's percussive nature." },
  { subject: "gould-quote-recording", type: "quote", author: "Glenn Gould", workTitle: null, musicSearchQuery: null,
    content: "The concert is a force of evil. The future of music lies not in the concert hall but in the recording studio, where one can achieve a perfection and an intimacy with music impossible before a live audience." },
  { subject: "richter-quote-composer-servant", type: "quote", author: "Sviatoslav Richter", workTitle: null, musicSearchQuery: null,
    content: "The interpreter is really an executant, carrying out the composer's intentions to the letter. He has no business to add any personal contribution. He must not colour the music with his own feelings. His feelings simply do not matter." },
  { subject: "horowitz-quote-piano", type: "quote", author: "Vladimir Horowitz", workTitle: null, musicSearchQuery: null,
    content: "The piano is the easiest instrument to play in the beginning, and the hardest to master in the end." },
  { subject: "rachmaninoff-quote-silence", type: "quote", author: "Sergei Rachmaninoff", workTitle: null, musicSearchQuery: null,
    content: "Music is enough for a lifetime — but a lifetime is not enough for music." },
  { subject: "neuhaus-quote-teaching", type: "quote", author: "Heinrich Neuhaus", workTitle: null, musicSearchQuery: null,
    content: "Before you touch the keys, the music must already be sounding in your head — the complete sound, the complete phrase, the complete character. The hand only executes what the ear has already imagined." },
  { subject: "ravel-quote-orchestration", type: "quote", author: "Maurice Ravel", workTitle: null, musicSearchQuery: null,
    content: "I have nothing left to give to music. I have said everything I have to say — and I have said it poorly." },
  { subject: "prokofiev-quote-clarity", type: "quote", author: "Sergei Prokofiev", workTitle: null, musicSearchQuery: null,
    content: "I want nothing more than clarity, simplicity, and health. Chromatic harmony, polytonal clashes, and atonality are diseases. I am for diatonic music." },
  { subject: "argerich-quote-stage", type: "quote", author: "Martha Argerich", workTitle: null, musicSearchQuery: null,
    content: "I am always terrified before I go on stage. But when I am there, something else takes over — I am no longer afraid because I have no time to be afraid." },
  // TIPS — technique
  { subject: "tip-arm-weight", type: "tip", author: null, workTitle: null, musicSearchQuery: null,
    content: "A resonant piano tone comes from arm weight, not finger pressure. Relax the forearm completely and let gravity sink the key, as if dropping a heavy but soft object onto it. Any tension in the wrist or forearm converts potential resonance into a brittle, glassy sound." },
  { subject: "tip-voicing-chords", type: "tip", author: null, workTitle: null, musicSearchQuery: null,
    content: "To voice a piano chord so the melody sings above the accompaniment, load more arm weight into the finger playing the top note. Practise the chord slowly, listening critically: the inner voices should disappear into the background while the top note rings. It requires different weight distribution on different fingers simultaneously." },
  { subject: "tip-syncopated-pedal", type: "tip", author: null, workTitle: null, musicSearchQuery: null,
    content: "Syncopated (legato) pedalling means depressing the pedal just after — not before or on — the beat, while the new harmony is already sounding. This captures the new chord cleanly without muddy bleed from the previous harmony. Changing the pedal on the beat is the most common beginner mistake." },
  { subject: "tip-rubato-chopin", type: "tip", author: null, workTitle: null, musicSearchQuery: null,
    content: "Chopin's rubato means the left hand stays in strict time while the right hand floats freely — not that the whole texture rushes and drags together. A useful image: the left hand is the conductor keeping a steady pulse, while the right hand is a singer who breathes and lingers as the music demands." },
  { subject: "tip-slow-practice", type: "tip", author: null, workTitle: null, musicSearchQuery: null,
    content: "Slow practice works because it gives time for accurate motor programming — each finger movement is encoded precisely before speed is added. The danger is practising slowly without full mental attention; mindless repetition at any speed reinforces whatever is being done, including mistakes. Slow practice only works if every note is deliberate." },
  { subject: "tip-memorization", type: "tip", author: null, workTitle: null, musicSearchQuery: null,
    content: "Muscle memory alone is the least reliable piano memory — it breaks down under performance stress. Supplement it with harmonic memory (know what chord progression you are playing, not just which fingers move), and structural memory (know exactly where each section begins and can start from any point). Test memory by starting in the middle of a phrase." },
  { subject: "tip-octave-technique", type: "tip", author: null, workTitle: null, musicSearchQuery: null,
    content: "Fast octaves require forearm rotation (supination and pronation) rather than wrist bouncing. Practice slowly with an exaggerated rotational motion, feeling the forearm roll from thumb side to little-finger side on each octave. The wrist should act as a shock-absorber, not a bouncing spring." },
  { subject: "tip-sight-reading", type: "tip", author: null, workTitle: null, musicSearchQuery: null,
    content: "Effective sight-reading requires looking ahead of what you are playing — at least one beat, ideally one bar. Never stop when you make a mistake; keeping the pulse is more important than any individual note. Practise sight-reading from real music (not exercises) for 10–15 minutes daily, always at a tempo where you can look ahead." },
  // RECORDING STORIES
  { subject: "gould-goldberg-1955", type: "recording", author: "Glenn Gould", workTitle: "Goldberg Variations, BWV 988", musicSearchQuery: "Glenn Gould Goldberg Variations 1955 Columbia Records",
    content: "Glenn Gould's 1955 recording of the Goldberg Variations — made when he was 22 — was a sensation. His unconventional fast tempos, non-legato touch, and structural clarity were unlike anything previously heard. Columbia Records had initially been sceptical; within months, the record had sold more copies than any other classical debut in the label's history." },
  { subject: "gould-goldberg-1981", type: "recording", author: "Glenn Gould", workTitle: "Goldberg Variations, BWV 988", musicSearchQuery: "Glenn Gould Goldberg Variations 1981",
    content: "Glenn Gould's 1981 recording of the Goldberg Variations, made weeks before his death at 50, is the polar opposite of his 1955 debut — slow, introspective, almost unbearably tender. He described it as 'a very, very lonely experience.' The recording was released on October 4, 1982; Gould died on October 4, 1982." },
  { subject: "rite-of-spring-premiere", type: "recording", author: "Igor Stravinsky", workTitle: "The Rite of Spring", musicSearchQuery: "Stravinsky Rite of Spring Gergiev Mariinsky",
    content: "The premiere of The Rite of Spring on May 29, 1913 in Paris ended in a riot — audience members shouted, booed, and fought each other. Nijinsky's choreography was so radical that dancers could barely hear the orchestra over the noise. Exactly one year later, the concert version received a standing ovation from the same city." },
  { subject: "argerich-chopin-etudes", type: "recording", author: "Martha Argerich", workTitle: "Chopin Études, Op. 10 & 25", musicSearchQuery: "Martha Argerich Chopin Etudes 1975 DG",
    content: "Martha Argerich's 1975 recording of the complete Chopin Études for Deutsche Grammophon remains the benchmark after 50 years. Her octave passages in Op. 25 No. 10 are taken at a speed most pianists consider physically impossible, yet every note is clear. Pianists listen to it to understand what the instrument can theoretically do." },
  { subject: "lipatti-besancon", type: "recording", author: "Dinu Lipatti", workTitle: "Chopin Waltzes", musicSearchQuery: "Dinu Lipatti Besancon 1950 farewell concert",
    content: "At his farewell concert in Besançon in 1950, Dinu Lipatti — too weak from leukemia to complete his programme — stopped before the final Chopin waltz. He substituted Bach's Jesu, Joy of Man's Desiring instead. The recording captures a sound simultaneously weightless and profound, with a tone colour that no subsequent pianist has replicated." },
  { subject: "miles-davis-kind-of-blue", type: "recording", author: "Miles Davis", workTitle: "Kind of Blue", musicSearchQuery: "Miles Davis Kind of Blue full album 1959",
    content: "Miles Davis recorded Kind of Blue in two sessions on March 2 and April 22, 1959. Most musicians had seen almost nothing of the material before the sessions began. Davis gave them minimal modal sketches rather than written arrangements, wanting the freshness of a first encounter. It remains the best-selling jazz album in history." },
  // THEORY
  { subject: "theory-tristan-chord", type: "theory", author: "Richard Wagner", workTitle: "Tristan und Isolde", musicSearchQuery: "Wagner Tristan und Isolde Prelude Furtwangler",
    content: "The 'Tristan chord' — F, B, D♯, A♯ — opens Wagner's Tristan und Isolde (1859) and never resolves to a clear tonic throughout the entire four-hour opera. It is simultaneously analyzable as part of several different keys, creating permanent harmonic instability. This chord is widely cited as the starting point for the dissolution of classical tonality." },
  { subject: "theory-neapolitan", type: "theory", author: null, workTitle: null, musicSearchQuery: null,
    content: "The Neapolitan chord is a major triad built on the flattened second degree of a scale — in C minor, that is D♭ major. Its characteristic colour is a kind of tragic, bitter sweetness. Schubert used it constantly (the opening of his Sonata in B♭ major), as did Chopin in his Ballade No. 1 and Beethoven in his 'Moonlight' Sonata's first movement." },
  { subject: "theory-whole-tone-scale", type: "theory", author: "Claude Debussy", workTitle: "Voiles", musicSearchQuery: "Debussy Voiles piano whole tone scale",
    content: "The whole-tone scale — six notes all a whole step apart — has no leading tone and no perfect fifth, creating a dreamlike, directionless quality. Debussy built his Prélude 'Voiles' almost entirely from it. Because all rotations of the whole-tone scale are identical, any note can serve as a temporary centre, making resolution feel perpetually deferred." },
  { subject: "theory-lydian-mode", type: "theory", author: null, workTitle: null, musicSearchQuery: null,
    content: "The Lydian mode is a major scale with a raised fourth degree — giving it a floating, luminous, slightly unearthly quality compared to standard major. Ravel used it in Daphnis et Chloé and in the Piano Concerto in G. The raised fourth creates a tritone above the tonic, eliminating the subdominant and giving the harmony an expansive, unresolved openness." },
  { subject: "theory-picardy-third", type: "theory", author: null, workTitle: null, musicSearchQuery: null,
    content: "The Picardy third is the device of ending a piece in a minor key with a major chord — raising the third of the final tonic chord. Bach uses it in dozens of minor-key pieces, most strikingly at the ends of choruses in the St Matthew Passion. The effect is not triumph but transcendence — a widening into light after darkness." },
  { subject: "theory-coltrane-changes", type: "theory", author: "John Coltrane", workTitle: "Giant Steps", musicSearchQuery: "John Coltrane Giant Steps 1960 analysis",
    content: "John Coltrane's 'Giant Steps' (1960) introduced a harmonic system that replaced standard ii–V–I progressions with three key centres a major third apart: B, G, and E♭. The chord changes move so fast — two per bar — that jazz musicians had never seen anything like it. Bill Evans described first hearing the changes as 'a brick wall.'" },
  // INSPIRATION
  { subject: "inspiration-nocturne-idea", type: "inspiration", author: null, workTitle: null, musicSearchQuery: null,
    content: "Nocturne in D♭ major: use a rocking 6/8 left-hand pattern spanning a tenth, let the melody begin on F (the third degree), and introduce a chromatic inner voice in the second phrase that descends by half-steps. In the middle section, shift to C♯ minor and allow the melody to break into ornamental semiquavers before returning to the opening." },
  { subject: "inspiration-pentatonic-piece", type: "inspiration", author: null, workTitle: null, musicSearchQuery: null,
    content: "Compose a short piece using only the F♯ major pentatonic scale (F♯, G♯, A♯, C♯, D♯). Because the pentatonic has no half-steps, there are no 'wrong' notes and no natural resolution — use this to write phrases of unusual length (5 or 7 bars instead of 4) that create a floating, timeless effect." },
  { subject: "inspiration-modal-phrygian", type: "inspiration", author: null, workTitle: null, musicSearchQuery: null,
    content: "Write a piece in E Phrygian (E, F, G, A, B, C, D). The characteristic sound is the minor second between the tonic (E) and the second degree (F) — use this interval prominently in the melody. The Phrygian mode has an ancient, austere quality; try a bare, unaccompanied single line for the opening, adding harmony only gradually." },
  { subject: "inspiration-jazz-voicings", type: "inspiration", author: null, workTitle: null, musicSearchQuery: null,
    content: "Improvise over this four-bar progression: Cmaj9 | Am11 | Dm9 | G13. Voice the Cmaj9 with E, B, D in the right hand and C in the left; the G13 with B, F, A, E in the right hand and G in the bass. The 'shell voicing' approach leaves room in the middle register for the melody to breathe." },
  // HISTORY
  { subject: "history-chopin-paris-debut", type: "history", author: "Frédéric Chopin", workTitle: null, musicSearchQuery: null,
    content: "Chopin's Paris debut on February 26, 1832, at the Salle Pleyel was attended by Franz Liszt, Felix Mendelssohn, and Friedrich Kalkbrenner. The hall was not full, but the reaction of the musical élite was rapturous. Liszt described Chopin's playing as something 'new, beautiful, and unprecedented.'" },
  { subject: "history-beethoven-1808-concert", type: "history", author: "Ludwig van Beethoven", workTitle: null, musicSearchQuery: null,
    content: "On December 22, 1808, Beethoven staged a four-hour 'Academy' concert in Vienna premiering his Fifth and Sixth Symphonies, the Fourth Piano Concerto (with himself as soloist), and the Choral Fantasy — in a freezing hall with an underprepared orchestra. The Choral Fantasy collapsed midway through and had to be restarted." },
  { subject: "history-brahms-meets-schumann", type: "history", author: "Johannes Brahms", workTitle: null, musicSearchQuery: null,
    content: "When the 20-year-old Brahms visited Robert Schumann in Düsseldorf in September 1853 and played for him, Schumann immediately wrote a celebrated review in the Neue Zeitschrift für Musik calling him 'a young eagle' who had arrived 'fully formed.' It was Schumann's last published article; he suffered a mental breakdown six months later." },
  { subject: "history-liszt-invents-recital", type: "history", author: "Franz Liszt", workTitle: null, musicSearchQuery: null,
    content: "Franz Liszt effectively invented the solo piano recital in the 1840s, performing entire programmes alone on stage without supporting artists. Before Liszt, concerts always included multiple performers and genres. He also introduced the practice of placing the piano sideways so audiences could see his face, and performed entire programmes from memory." },
  // PRACTICE
  { subject: "practice-dotted-rhythms", type: "practice", author: null, workTitle: null, musicSearchQuery: null,
    content: "Dotted-rhythm practice: take an even passage and play it in long-short dotted rhythm (hold the first note, snap the second), then reverse to short-long. This forces each individual finger to move with full commitment instead of sliding passively between notes. It is particularly effective for even runs where weak fingers (4th and 5th) tend to drag." },
  { subject: "practice-hands-separately", type: "practice", author: null, workTitle: null, musicSearchQuery: null,
    content: "Never put hands together until each hand alone is fully reliable at the target tempo. The standard mistake is combining hands too early, which locks in errors rather than correcting them. Practise each hand at least twice as long as you think necessary — and test separately again after combining to check nothing was lost." },
  { subject: "practice-mental-practice", type: "practice", author: null, workTitle: null, musicSearchQuery: null,
    content: "Mental practice — playing through a piece in your mind, without touching the piano — exposes gaps in musical knowledge more efficiently than physical practice. Sviatoslav Richter and Glenn Gould both used it extensively. If you cannot play a passage mentally in real time, note by note, you do not truly know it." },
  { subject: "practice-metronome-method", type: "practice", author: null, workTitle: null, musicSearchQuery: null,
    content: "Build tempo in increments: start at 60% of target speed and practise until the passage feels effortless — not merely possible. Increase by 5–10 BPM only when it feels comfortable, not forced. Jumping to full speed too early compresses errors into the technique permanently. The final tempo should feel like the easiest speed, not the hardest." },
  // MASTERCLASS
  { subject: "masterclass-chopin-nocturne-line", type: "masterclass", author: null, workTitle: null, musicSearchQuery: null,
    content: "To play a Chopin Nocturne melody convincingly, think of each phrase as a breath: the phrase rises on the inhale and subsides on the exhale. The left hand keeps strict time while the right hand is given complete freedom to linger or press forward. The melody note should be played slightly after the bass note, not simultaneously — this creates the vocal quality Chopin demanded." },
  { subject: "masterclass-double-thirds", type: "masterclass", author: null, workTitle: null, musicSearchQuery: null,
    content: "Double thirds (Chopin Étude Op. 25 No. 6) require each pair of fingers to move independently yet simultaneously. Practise as separate thirds — play only the top voice as a melodic line, then only the bottom — before combining. The third finger must not dominate; balance each pair equally. At full speed the motion is a light, flickering surface rotation of the hand." },
  { subject: "masterclass-fast-scales", type: "masterclass", author: null, workTitle: null, musicSearchQuery: null,
    content: "Even scales require the thumb-under motion to be entirely silent and invisible. Practise placing the thumb under the hand before it is needed — arriving before the beat, not on it. The weakness is almost always the junction between fingers 3 and 4 or 4 and 5; isolate these two fingers in a five-finger exercise at the thumb-crossing point and drill them separately." },
  { subject: "masterclass-debussy-pedal", type: "masterclass", author: null, workTitle: null, musicSearchQuery: null,
    content: "Debussy's harmonic language requires pedalling that would sound wrong in standard repertoire. In Clair de lune, use the pedal to blend a full bar of harmony at a time — but change it precisely before any clash occurs. The half-pedal technique (partially releasing and re-pressing without full clearance) is essential for keeping the shimmer without muddy accumulation." },
  // ORCHESTRAL
  { subject: "kleiber-beethoven5", type: "fact", author: "Carlos Kleiber", workTitle: "Symphony No. 5, Op. 67", musicSearchQuery: "Carlos Kleiber Beethoven 5 Vienna Philharmonic 1975",
    content: "Carlos Kleiber's 1975 recording of Beethoven's Fifth Symphony with the Vienna Philharmonic is widely considered the finest ever made. Kleiber rehearsed the orchestra obsessively, insisting on tempos and articulations that seemed impossible. He conducted fewer than 100 performances in his entire career, accepting only engagements where he had complete artistic control." },
  { subject: "celibidache-no-recordings", type: "fact", author: "Sergiu Celibidache", workTitle: null, musicSearchQuery: "Sergiu Celibidache conducts Bruckner",
    content: "Sergiu Celibidache refused all commercial recordings during his lifetime, insisting that a recording of music is 'like a picture of a sunset' — a dead substitute for the living event. After his death, his estate released archival broadcasts; his slow, meditative Bruckner symphonies with the Munich Philharmonic revealed a conductor of extraordinary depth." },
  { subject: "shostakovich-leningrad-premiere", type: "history", author: "Dmitri Shostakovich", workTitle: "Symphony No. 7, 'Leningrad'", musicSearchQuery: "Shostakovich Leningrad Symphony premiere 1942",
    content: "Shostakovich's Seventh Symphony was performed inside besieged Leningrad on August 9, 1942, by an orchestra so weakened by starvation that reinforcements had to be brought in from the frontline. The score had been microfilmed and flown out of the city. Loudspeakers broadcast the premiere across the city and toward the German lines." },
  { subject: "abbado-mahler9-lucerne", type: "recording", author: "Gustav Mahler", workTitle: "Symphony No. 9 in D major", musicSearchQuery: "Abbado Mahler 9 Lucerne Festival 2010",
    content: "Claudio Abbado's 2010 live recording of Mahler's Ninth Symphony with the Lucerne Festival Orchestra — made after Abbado's recovery from cancer — is considered one of the greatest Mahler recordings. At the end of the final Adagio, the audience sat in silence for over two minutes before applauding. Abbado described this concert as 'the most important of my life.'" },
  { subject: "rite-of-spring-significance", type: "history", author: "Igor Stravinsky", workTitle: "The Rite of Spring", musicSearchQuery: "Stravinsky Rite of Spring history significance",
    content: "The Rite of Spring (1913) represents the moment when rhythm, rather than melody or harmony, became the primary structural force in Western music. Its displaced accents and unpredictable meter changes — grouped as 2+3+2+2+3 rather than regular bars — gave 20th-century composers permission to treat rhythm as an independent compositional parameter." },
  // OTHER
  { subject: "bill-evans-portrait-jazz", type: "fact", author: "Bill Evans", workTitle: "Portrait in Jazz", musicSearchQuery: "Bill Evans Portrait in Jazz 1959 Riverside Records",
    content: "Bill Evans's 1959 recording Portrait in Jazz with bassist Scott LaFaro and drummer Paul Motian established the model for the modern jazz piano trio — three equal voices in conversation, rather than piano accompanied by rhythm section. LaFaro's melodic, independent bass lines were so unprecedented that jazz musicians still study them as textbooks." },
  { subject: "cage-prepared-piano", type: "misc", author: "John Cage", workTitle: "Sonatas and Interludes", musicSearchQuery: "John Cage Sonatas and Interludes prepared piano",
    content: "John Cage invented the prepared piano in 1938 by inserting bolts, screws, rubber, and felt between the strings of a grand piano. The instrument becomes a one-person percussion orchestra — each key producing a different, unpredictable timbre. His Sonatas and Interludes (1946–48) is the masterwork for the instrument, requiring 45 preparations across 16 strings." },
  { subject: "history-first-piano-recording", type: "history", author: null, workTitle: null, musicSearchQuery: "earliest piano recordings 1890s cylinder",
    content: "The earliest surviving piano recordings date from the 1890s, made on wax cylinders with a sound quality so poor that pitch and tempo are barely discernible. However, piano rolls from the 1900s–1920s preserve performances by Mahler, Debussy, Saint-Saëns, and Grieg playing their own music — giving us a direct, if imperfect, connection to the interpretive world of the 19th century." },
];

// ─── Topic definitions for AI generation (one per subject) ───────────────────
// The AI enriches subjects not yet covered by curated items

type TopicDef = {
  subject: string;
  category: InspirationCategory;
  prompt: string;
};

const AI_TOPICS: TopicDef[] = [
  { subject: "chopin-piano-preference", category: "fact",
    prompt: "Describe Frédéric Chopin's preference for Pleyel pianos over Érard and Steinway — why he favoured Pleyel's lighter action and singing tone, what he said about other instruments, and how this shaped his compositions." },
  { subject: "scriabin-color-organ", category: "fact",
    prompt: "Describe Alexander Scriabin's synesthesia and the 'tastiera per luce' (color organ) he specified for the premiere of Prometheus: The Poem of Fire — the colour-pitch correspondences he used and whether the device worked as planned at the 1915 Carnegie Hall premiere." },
  { subject: "quote-liszt-technique", category: "quote",
    prompt: "Share a specific quote from Franz Liszt about virtuosity versus expression — his belief that technique should be invisible, or his view that the piano must be made to sing above all else. Give context." },
  { subject: "tip-trill-development", category: "tip",
    prompt: "Explain how to develop a fast, even trill on the piano: the finger-pair combinations, why the wrist must stay relaxed, and a graduated daily exercise for building trill speed over several weeks." },
  { subject: "masterclass-brahms-chords", category: "masterclass",
    prompt: "Write a 2-paragraph masterclass on playing Brahms's thick chord textures without tension: how to distribute arm weight across multiple fingers, and use the opening of the Brahms Intermezzo Op. 118 No. 2 as an example." },
  { subject: "theory-octatonic-scale", category: "theory",
    prompt: "Explain the octatonic (diminished) scale, its alternating whole-step–half-step pattern, how it creates symmetrical instability, and how Stravinsky uses it in The Rite of Spring and Bartók uses it in his piano music." },
  { subject: "inspiration-chromatic-mediant", category: "inspiration",
    prompt: "Give a specific composition idea using chromatic mediant relationships for piano: choose a starting key, describe two chromatic mediant moves, and the emotional journey they create." },
  { subject: "theory-ravel-orchestration", category: "theory",
    prompt: "Describe a specific orchestration technique from Ravel — his transparent texture, use of muted strings, or orchestration of Pictures at an Exhibition — explaining what makes his orchestral palette unique." },
  { subject: "theory-bartok-night-music", category: "theory",
    prompt: "Describe Bartók's 'night music' texture: chromatic string tremolos, isolated wind calls, piano clusters — where it first appeared and how it influenced later composers." },
  { subject: "history-vienna-philharmonic", category: "history",
    prompt: "Describe the founding of the Vienna Philharmonic in 1842 and a decisive moment in their history — a legendary conductor, a historic recording, or a defining concert — that shaped their identity as an orchestra." },
  { subject: "quote-abbado", category: "quote",
    prompt: "Share a specific quote from Claudio Abbado about the relationship between conductor and orchestra, about listening, or about collaborative music-making. Give context." },
  { subject: "quote-celibidache", category: "quote",
    prompt: "Share a specific quote from Sergiu Celibidache about music, silence, recordings, or the act of conducting — capturing his philosophical, almost mystical approach. Give context." },
  { subject: "tip-legato-technique", category: "tip",
    prompt: "Explain how to achieve true legato on the piano — why it is difficult on a percussive instrument, how to overlap key releases, the role of the pedal vs. finger legato, and a Schubert slow movement as a test case." },
  { subject: "masterclass-octave-repetitions", category: "masterclass",
    prompt: "Write a 2-paragraph masterclass on fast repeated octaves: the role of forearm supination/pronation rather than wrist bouncing, and how to practise Liszt La Campanella or Brahms Paganini Variations safely." },
  { subject: "inspiration-bwv-invention", category: "inspiration",
    prompt: "Give a specific idea for composing a two-voice invention in the style of Bach: describe the subject melodically, how to invert it for the answer, a suitable key for an episode, and a harmonic destination for the climax." },
  { subject: "history-shostakovich-fifth", category: "history",
    prompt: "Describe the premiere of Shostakovich's Fifth Symphony in Leningrad in 1937: the political context (Stalin's terror), the audience weeping during the slow movement, and how the finale was interpreted differently by different listeners." },
  { subject: "misc-theremin", category: "misc",
    prompt: "Describe the theremin: how it works, who invented it and when, which composers wrote for it, and how it influenced 20th-century film music." },
  { subject: "quote-kleiber", category: "quote",
    prompt: "Share a specific, memorable quote from Carlos Kleiber about conducting, music, or the orchestra — something that reveals his unusual personality and perfectionism. Give context." },
  { subject: "mahler-eighth-premiere", category: "history",
    prompt: "Describe the premiere of Mahler's Eighth Symphony in Munich on September 12, 1910 — the thousand performers, the audience reaction, who attended, and Mahler's state of mind." },
  { subject: "karajan-beethoven-cycle", category: "recording",
    prompt: "Describe Herbert von Karajan's 1963 Beethoven symphony cycle with the Berlin Philharmonic: the recording conditions, technical innovations, and why this set dominated the market for 30 years." },
];

// ─── Served-subject tracking — persists for the server's lifetime ─────────────

const servedSubjects = new Set<string>();
const recentCategories: InspirationCategory[] = [];
const RECENT_WINDOW = 4;

function trackServed(item: InspirationItem) {
  servedSubjects.add(item.subject);
  recentCategories.push(item.type);
  if (recentCategories.length > RECENT_WINDOW) recentCategories.shift();
}

// ─── Queue — curated items consumed in shuffled order ────────────────────────

let curatedQueue: InspirationItem[] = shuffle(CURATED);
let curatedIndex = 0;

function nextCuratedItem(excludeCats: InspirationCategory[]): InspirationItem | null {
  // Try to find an unserved item with a different category
  const remaining = curatedQueue.slice(curatedIndex);
  const preferred = remaining.filter(i => !servedSubjects.has(i.subject) && !excludeCats.includes(i.type));
  if (preferred.length > 0) return preferred[0];

  const anyUnserved = remaining.filter(i => !servedSubjects.has(i.subject));
  if (anyUnserved.length > 0) return anyUnserved[0];

  // All curated items served — reshuffle and start again
  curatedQueue = shuffle(CURATED);
  curatedIndex = 0;
  servedSubjects.clear(); // reset only when deck is fully exhausted
  return curatedQueue[curatedIndex++];
}

// ─── AI enrichment pool ───────────────────────────────────────────────────────

type AIPoolItem = InspirationItem;
const aiPool: AIPoolItem[] = [];
const POOL_TARGET = 20;
let isGenerating = false;

let aiTopicQueue: TopicDef[] = shuffle(AI_TOPICS);
let aiTopicIndex = 0;

function nextAITopic(): TopicDef | null {
  // Skip topics already in pool or already served
  while (aiTopicIndex < aiTopicQueue.length) {
    const t = aiTopicQueue[aiTopicIndex++];
    if (!servedSubjects.has(t.subject) && !aiPool.some(p => p.subject === t.subject)) {
      return t;
    }
  }
  // Reshuffle when exhausted
  aiTopicQueue = shuffle(AI_TOPICS);
  aiTopicIndex = 0;
  return null;
}

async function generateOne(topic: TopicDef): Promise<AIPoolItem | null> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 450,
      messages: [
        {
          role: "system",
          content: "You are a world-class music scholar. Respond ONLY with a valid JSON object — no markdown, no code fences.",
        },
        {
          role: "user",
          content: `${topic.prompt}

Return JSON with exactly:
- "type": "${topic.category}"
- "content": 2–4 sentences in English, specific and factually accurate. Include exact dates, names, opus numbers.
- "author": full name or null
- "workTitle": exact title or null
- "musicSearchQuery": English YouTube search query or null

JSON only.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!raw) return null;

    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(raw); }
    catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) return null;
      try { parsed = JSON.parse(m[0]); } catch { return null; }
    }

    const content = String(parsed.content ?? "").trim();
    if (!content || content.length < 40) return null;
    if (servedSubjects.has(topic.subject)) return null;

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
    let attempts = 0;
    while (aiPool.length < POOL_TARGET && attempts < POOL_TARGET * 4) {
      attempts++;
      const topic = nextAITopic();
      if (!topic) break;
      const item = await generateOne(topic);
      if (item) aiPool.push(item);
    }
  } finally {
    isGenerating = false;
  }
}

setInterval(() => {
  if (aiPool.length < POOL_TARGET && !isGenerating) fillPool().catch(() => {});
}, 8_000);

fillPool().catch(() => {});

// ─── Route ────────────────────────────────────────────────────────────────────

router.get("/inspiration", (req, res) => {
  const excludeCats = recentCategories.slice(-RECENT_WINDOW);

  // 1. Try AI pool first (unserved subject, different category)
  let item: InspirationItem | undefined;

  if (aiPool.length > 0) {
    const freshNew = aiPool.filter(i => !servedSubjects.has(i.subject) && !excludeCats.includes(i.type));
    const freshAny = aiPool.filter(i => !servedSubjects.has(i.subject));
    const candidates = freshNew.length > 0 ? freshNew : freshAny.length > 0 ? freshAny : [];

    if (candidates.length > 0) {
      const idx = Math.floor(Math.random() * candidates.length);
      item = candidates[idx];
      aiPool.splice(aiPool.indexOf(item), 1);
    }

    if (aiPool.length < POOL_TARGET * 0.5 && !isGenerating) fillPool().catch(() => {});
  }

  // 2. Fall back to curated library (guaranteed non-repeat)
  if (!item) {
    const curated = nextCuratedItem(excludeCats);
    if (curated) item = curated;
  }

  if (!item) {
    res.status(503).json({ error: "No inspiration available" });
    return;
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
