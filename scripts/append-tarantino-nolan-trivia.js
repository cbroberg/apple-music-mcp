/**
 * Append Tarantino + Nolan film soundtrack trivia.
 * Fills gaps (Death Proof, Memento, Insomnia, Batman Begins, The Prestige, Oppenheimer)
 * and adds depth to existing coverage.
 *
 * Usage: node scripts/append-tarantino-nolan-trivia.js
 */

import { readFileSync, writeFileSync } from 'node:fs';
import crypto from 'node:crypto';

const PATH = 'data/quiz-trivia-soundtrack.json';

const QUESTIONS = [
  // ─── DEATH PROOF (Tarantino) ──────────────────────────
  {
    questionText: "Which April March song plays during the opening credits of Tarantino's 'Death Proof'?",
    correctAnswer: "Chick Habit",
    options: ["Chick Habit", "Bang Bang", "These Boots Are Made for Walkin'", "Son of a Preacher Man"],
    artistName: "April March",
    funFact: "'Chick Habit' is April March's English version of France Gall's 'Laisse tomber les filles'.",
    backgroundSong: "Chick Habit",
    backgroundArtist: "April March",
    difficulty: "hard",
  },
  {
    questionText: "'Hold Tight!' by Dave Dee, Dozy, Beaky, Mick & Tich features in which brutal Tarantino car scene?",
    correctAnswer: "Death Proof",
    options: ["Death Proof", "Kill Bill Vol. 1", "Pulp Fiction", "Jackie Brown"],
    artistName: "Dave Dee, Dozy, Beaky, Mick & Tich",
    funFact: "The song plays in the infamous head-on collision scene — Tarantino picked it for its upbeat contrast.",
    backgroundSong: "Hold Tight!",
    backgroundArtist: "Dave Dee, Dozy, Beaky, Mick & Tich",
    difficulty: "hard",
  },

  // ─── MEMENTO (Nolan) ──────────────────────────────────
  {
    questionText: "Who composed the haunting, reversed-motif score for Christopher Nolan's 'Memento'?",
    correctAnswer: "David Julyan",
    options: ["David Julyan", "Hans Zimmer", "James Newton Howard", "Ludwig Göransson"],
    artistName: "David Julyan",
    funFact: "Julyan scored Nolan's first three films — Memento, Insomnia, and The Prestige — before Zimmer took over.",
    backgroundSong: "Memento Theme",
    backgroundArtist: "David Julyan",
    difficulty: "hard",
  },

  // ─── INSOMNIA (Nolan) ─────────────────────────────────
  {
    questionText: "David Julyan composed the chilling score for which 2002 Christopher Nolan thriller set in Alaska?",
    correctAnswer: "Insomnia",
    options: ["Insomnia", "The Prestige", "Memento", "Following"],
    artistName: "David Julyan",
    funFact: "Insomnia starred Al Pacino and Robin Williams and was Nolan's first major studio film.",
    backgroundSong: "Insomnia Theme",
    backgroundArtist: "David Julyan",
    difficulty: "hard",
  },

  // ─── BATMAN BEGINS (Nolan) ────────────────────────────
  {
    questionText: "Which two composers collaborated on the score for 'Batman Begins' (2005)?",
    correctAnswer: "Hans Zimmer & James Newton Howard",
    options: [
      "Hans Zimmer & James Newton Howard",
      "Hans Zimmer & John Williams",
      "Danny Elfman & Howard Shore",
      "John Williams & Alan Silvestri",
    ],
    artistName: "Hans Zimmer & James Newton Howard",
    funFact: "Zimmer and Howard collaborated on all three Dark Knight films, creating Batman's modern sound.",
    backgroundSong: "Molossus",
    backgroundArtist: "Hans Zimmer & James Newton Howard",
    difficulty: "medium",
  },
  {
    questionText: "The main Batman theme 'Molossus' from Batman Begins is named after what?",
    correctAnswer: "An ancient Greek war dance",
    options: [
      "An ancient Greek war dance",
      "A type of bat",
      "A Latin word for 'shadow'",
      "Bruce Wayne's butler",
    ],
    artistName: "Hans Zimmer",
    funFact: "The Molossus was an aggressive ancient dance — fitting for Batman's ferocity.",
    backgroundSong: "Molossus",
    backgroundArtist: "Hans Zimmer & James Newton Howard",
    difficulty: "hard",
  },

  // ─── THE PRESTIGE (Nolan) ─────────────────────────────
  {
    questionText: "David Julyan composed the score for which 2006 Christopher Nolan film about rival magicians?",
    correctAnswer: "The Prestige",
    options: ["The Prestige", "The Illusionist", "Now You See Me", "Sleight"],
    artistName: "David Julyan",
    funFact: "The Prestige was Julyan's last collaboration with Nolan before Zimmer took over from The Dark Knight onward.",
    backgroundSong: "Are You Watching Closely?",
    backgroundArtist: "David Julyan",
    difficulty: "medium",
  },

  // ─── OPPENHEIMER (Nolan) ──────────────────────────────
  {
    questionText: "Ludwig Göransson won an Oscar for his score to which 2023 Christopher Nolan epic?",
    correctAnswer: "Oppenheimer",
    options: ["Oppenheimer", "Tenet", "Dunkirk", "Interstellar"],
    artistName: "Ludwig Göransson",
    funFact: "Göransson's second Oscar — he previously won for Black Panther in 2019.",
    backgroundSong: "Can You Hear the Music",
    backgroundArtist: "Ludwig Göransson",
    difficulty: "easy",
  },
  {
    questionText: "The standout track 'Can You Hear the Music' from Oppenheimer was composed by whom?",
    correctAnswer: "Ludwig Göransson",
    options: ["Ludwig Göransson", "Hans Zimmer", "John Williams", "Alexandre Desplat"],
    artistName: "Ludwig Göransson",
    funFact: "Göransson is also famous for scoring The Mandalorian and Creed.",
    backgroundSong: "Can You Hear the Music",
    backgroundArtist: "Ludwig Göransson",
    difficulty: "medium",
  },
  {
    questionText: "Ludwig Göransson is from which country, making him one of the latest Scandinavian composers in Hollywood?",
    correctAnswer: "Sweden",
    options: ["Sweden", "Norway", "Finland", "Denmark"],
    artistName: "Ludwig Göransson",
    funFact: "Göransson also produces music for Childish Gambino and co-wrote 'This Is America'.",
    backgroundSong: "Destroyer of Worlds",
    backgroundArtist: "Ludwig Göransson",
    difficulty: "medium",
  },
  {
    questionText: "Which Nolan film's score features a solo violin recurring throughout as Oppenheimer's theme?",
    correctAnswer: "Oppenheimer",
    options: ["Oppenheimer", "Interstellar", "Tenet", "The Prestige"],
    artistName: "Ludwig Göransson",
    funFact: "Göransson wrote the theme before Nolan had even finished the script.",
    backgroundSong: "Can You Hear the Music",
    backgroundArtist: "Ludwig Göransson",
    difficulty: "medium",
  },

  // ─── TARANTINO DEPTH — PULP FICTION ───────────────────
  {
    questionText: "Chuck Berry's 'You Never Can Tell' soundtracks which famous dance scene in Pulp Fiction?",
    correctAnswer: "Mia and Vincent at Jack Rabbit Slim's",
    options: [
      "Mia and Vincent at Jack Rabbit Slim's",
      "The overdose scene",
      "The gimp scene",
      "Butch's apartment",
    ],
    artistName: "Chuck Berry",
    funFact: "John Travolta's dance moves helped revive his career — the scene became one of cinema's most iconic.",
    backgroundSong: "You Never Can Tell",
    backgroundArtist: "Chuck Berry",
    difficulty: "medium",
  },
  {
    questionText: "Which Kool & the Gang song plays when Vincent shoots Marvin in Pulp Fiction?",
    correctAnswer: "Jungle Boogie",
    options: ["Jungle Boogie", "Celebration", "Get Down On It", "Ladies' Night"],
    artistName: "Kool & the Gang",
    funFact: "Tarantino uses funk and soul hits as ironic counterpoints to violent scenes.",
    backgroundSong: "Jungle Boogie",
    backgroundArtist: "Kool & the Gang",
    difficulty: "hard",
  },
  {
    questionText: "'Miserlou' by Dick Dale is the iconic surf-rock opening theme of which Tarantino film?",
    correctAnswer: "Pulp Fiction",
    options: ["Pulp Fiction", "Reservoir Dogs", "Kill Bill Vol. 1", "Jackie Brown"],
    artistName: "Dick Dale",
    funFact: "The song was Dick Dale's 1962 hit — Tarantino's use of it reintroduced him to a new generation.",
    backgroundSong: "Miserlou",
    backgroundArtist: "Dick Dale",
    difficulty: "easy",
  },

  // ─── TARANTINO — KILL BILL ─────────────────────────────
  {
    questionText: "Nancy Sinatra's 'Bang Bang (My Baby Shot Me Down)' opens which Tarantino film?",
    correctAnswer: "Kill Bill: Vol. 1",
    options: ["Kill Bill: Vol. 1", "Kill Bill: Vol. 2", "Death Proof", "Pulp Fiction"],
    artistName: "Nancy Sinatra",
    funFact: "Sonny Bono wrote the song — it's been covered by countless artists including Cher.",
    backgroundSong: "Bang Bang (My Baby Shot Me Down)",
    backgroundArtist: "Nancy Sinatra",
    difficulty: "medium",
  },
  {
    questionText: "The whistling tune 'Twisted Nerve' by Bernard Herrmann features as whose theme in Kill Bill?",
    correctAnswer: "Elle Driver",
    options: ["Elle Driver", "The Bride", "O-Ren Ishii", "Vernita Green"],
    artistName: "Bernard Herrmann",
    funFact: "Originally from the 1968 film 'Twisted Nerve' — Tarantino loves rescuing obscure film music.",
    backgroundSong: "Twisted Nerve",
    backgroundArtist: "Bernard Herrmann",
    difficulty: "hard",
  },
  {
    questionText: "'Battle Without Honor or Humanity' by Tomoyasu Hotei is used in which Kill Bill scene?",
    correctAnswer: "The Crazy 88 fight",
    options: ["The Crazy 88 fight", "The opening credits", "Vernita's kitchen", "The Bride's training"],
    artistName: "Tomoyasu Hotei",
    funFact: "Hotei is a Japanese rock legend — the song became his international signature.",
    backgroundSong: "Battle Without Honor or Humanity",
    backgroundArtist: "Tomoyasu Hotei",
    difficulty: "hard",
  },
  {
    questionText: "Which Ennio Morricone piece is used in Kill Bill Vol. 2's finale?",
    correctAnswer: "L'Arena",
    options: ["L'Arena", "The Ecstasy of Gold", "Once Upon a Time in the West", "Cheyenne"],
    artistName: "Ennio Morricone",
    funFact: "Tarantino is a massive Morricone fan — he eventually got Morricone to score The Hateful Eight.",
    backgroundSong: "L'Arena",
    backgroundArtist: "Ennio Morricone",
    difficulty: "hard",
  },

  // ─── TARANTINO — DJANGO UNCHAINED ─────────────────────
  {
    questionText: "Which Jim Croce song plays during a key Django Unchained scene?",
    correctAnswer: "I Got a Name",
    options: ["I Got a Name", "Time in a Bottle", "Operator", "Bad, Bad Leroy Brown"],
    artistName: "Jim Croce",
    funFact: "Tarantino paired this 1973 folk hit with a horse-riding montage scene.",
    backgroundSong: "I Got a Name",
    backgroundArtist: "Jim Croce",
    difficulty: "hard",
  },
  {
    questionText: "Django Unchained features a new song specifically written for the film by which rapper?",
    correctAnswer: "Rick Ross",
    options: ["Rick Ross", "Kanye West", "Jay-Z", "2 Chainz"],
    artistName: "Rick Ross",
    funFact: "Rick Ross's '100 Black Coffins' was specifically commissioned for the film.",
    backgroundSong: "100 Black Coffins",
    backgroundArtist: "Rick Ross",
    difficulty: "hard",
  },

  // ─── TARANTINO — INGLOURIOUS BASTERDS ─────────────────
  {
    questionText: "David Bowie's 'Cat People (Putting Out Fire)' appears in which pivotal Inglourious Basterds scene?",
    correctAnswer: "Shosanna prepares for revenge",
    options: [
      "Shosanna prepares for revenge",
      "The basement tavern",
      "The opening farm scene",
      "Hans Landa's interrogation",
    ],
    artistName: "David Bowie",
    funFact: "Tarantino's use of the 1982 song gave it a second life — it became one of Bowie's most iconic film uses.",
    backgroundSong: "Cat People (Putting Out Fire)",
    backgroundArtist: "David Bowie",
    difficulty: "hard",
  },

  // ─── TARANTINO — ONCE UPON A TIME IN HOLLYWOOD ────────
  {
    questionText: "Once Upon a Time in Hollywood's soundtrack features music primarily from which year?",
    correctAnswer: "1969",
    options: ["1969", "1972", "1967", "1975"],
    artistName: "Various Artists",
    funFact: "The film is set in 1969 Los Angeles — Tarantino filled it with period-accurate radio hits.",
    backgroundSong: "Mrs. Robinson",
    backgroundArtist: "Simon & Garfunkel",
    difficulty: "medium",
  },
  {
    questionText: "The song 'California Dreamin'' by José Feliciano appears in which Tarantino film set in Los Angeles?",
    correctAnswer: "Once Upon a Time in Hollywood",
    options: ["Once Upon a Time in Hollywood", "Pulp Fiction", "Jackie Brown", "Death Proof"],
    artistName: "José Feliciano",
    funFact: "Feliciano's version was picked over The Mamas & the Papas original for its Latin feel.",
    backgroundSong: "California Dreamin'",
    backgroundArtist: "José Feliciano",
    difficulty: "hard",
  },

  // ─── TARANTINO — RESERVOIR DOGS ───────────────────────
  {
    questionText: "'Stuck in the Middle with You' by Stealers Wheel plays during which infamous Reservoir Dogs scene?",
    correctAnswer: "The ear-cutting torture scene",
    options: [
      "The ear-cutting torture scene",
      "The opening restaurant scene",
      "The warehouse standoff",
      "The getaway",
    ],
    artistName: "Stealers Wheel",
    funFact: "The juxtaposition of the cheery song with violence became a defining Tarantino technique.",
    backgroundSong: "Stuck in the Middle with You",
    backgroundArtist: "Stealers Wheel",
    difficulty: "medium",
  },
  {
    questionText: "What fictional radio station provides Reservoir Dogs' soundtrack?",
    correctAnswer: "K-Billy's Super Sounds of the '70s",
    options: [
      "K-Billy's Super Sounds of the '70s",
      "KTJX Golden Oldies",
      "Radio Reservoir",
      "WKRP Cincinnati",
    ],
    artistName: "Various Artists",
    funFact: "Steven Wright provides the deadpan DJ voice throughout the film.",
    backgroundSong: "Little Green Bag",
    backgroundArtist: "George Baker Selection",
    difficulty: "hard",
  },

  // ─── TARANTINO — JACKIE BROWN ─────────────────────────
  {
    questionText: "Bobby Womack's 'Across 110th Street' opens which Tarantino film as a tribute to 70s blaxploitation?",
    correctAnswer: "Jackie Brown",
    options: ["Jackie Brown", "Pulp Fiction", "Django Unchained", "Kill Bill Vol. 2"],
    artistName: "Bobby Womack",
    funFact: "Jackie Brown is Tarantino's love letter to 70s Pam Grier blaxploitation films.",
    backgroundSong: "Across 110th Street",
    backgroundArtist: "Bobby Womack",
    difficulty: "medium",
  },

  // ─── NOLAN — INTERSTELLAR DEPTH ───────────────────────
  {
    questionText: "Hans Zimmer's 'Cornfield Chase' from Interstellar features which prominent instrument?",
    correctAnswer: "Church organ",
    options: ["Church organ", "Piano", "Solo violin", "Synthesizer"],
    artistName: "Hans Zimmer",
    funFact: "Zimmer recorded the score on the 1926 Harrison & Harrison organ at the Temple Church in London.",
    backgroundSong: "Cornfield Chase",
    backgroundArtist: "Hans Zimmer",
    difficulty: "medium",
  },
  {
    questionText: "The iconic 'No Time for Caution' docking scene from Interstellar features what time signature?",
    correctAnswer: "Complex polyrhythm",
    options: [
      "Complex polyrhythm",
      "Standard 4/4",
      "Waltz 3/4",
      "7/8 odd meter",
    ],
    artistName: "Hans Zimmer",
    funFact: "The ticking in Interstellar's score represents time — one of the film's core themes.",
    backgroundSong: "No Time for Caution",
    backgroundArtist: "Hans Zimmer",
    difficulty: "hard",
  },

  // ─── NOLAN — INCEPTION DEPTH ──────────────────────────
  {
    questionText: "Which Édith Piaf song is the 'kick' trigger throughout Inception?",
    correctAnswer: "Non, je ne regrette rien",
    options: [
      "Non, je ne regrette rien",
      "La Vie en rose",
      "Milord",
      "L'Hymne à l'amour",
    ],
    artistName: "Édith Piaf",
    funFact: "The song is slowed down in the score to create the iconic 'BRAAM' — it's literally Piaf's song stretched.",
    backgroundSong: "Non, je ne regrette rien",
    backgroundArtist: "Édith Piaf",
    difficulty: "medium",
  },
  {
    questionText: "Hans Zimmer's 'Time' from Inception has become one of the most-used what in film history?",
    correctAnswer: "Trailer music",
    options: ["Trailer music", "Wedding music", "Commercials", "TV themes"],
    artistName: "Hans Zimmer",
    funFact: "'Time' is arguably the most emotionally powerful four-minute piece Zimmer ever composed.",
    backgroundSong: "Time",
    backgroundArtist: "Hans Zimmer",
    difficulty: "easy",
  },

  // ─── NOLAN — DARK KNIGHT DEPTH ────────────────────────
  {
    questionText: "The Joker's theme in The Dark Knight consists of what musical idea by Hans Zimmer?",
    correctAnswer: "A single rising razor-blade note",
    options: [
      "A single rising razor-blade note",
      "A piano march",
      "An orchestra choir",
      "A distorted guitar riff",
    ],
    artistName: "Hans Zimmer",
    funFact: "Zimmer achieved the sound by scraping razor blades across piano strings.",
    backgroundSong: "Why So Serious?",
    backgroundArtist: "Hans Zimmer",
    difficulty: "hard",
  },
  {
    questionText: "Which song plays during the prologue bank heist in The Dark Knight?",
    correctAnswer: "Why So Serious?",
    options: ["Why So Serious?", "Like a Dog Chasing Cars", "A Dark Knight", "Introduce a Little Anarchy"],
    artistName: "Hans Zimmer & James Newton Howard",
    funFact: "The Dark Knight's score won a Grammy for Best Soundtrack Album in 2010.",
    backgroundSong: "Why So Serious?",
    backgroundArtist: "Hans Zimmer & James Newton Howard",
    difficulty: "medium",
  },

  // ─── NOLAN — DUNKIRK DEPTH ────────────────────────────
  {
    questionText: "Hans Zimmer's Dunkirk score is built around what auditory illusion?",
    correctAnswer: "Shepard tone",
    options: ["Shepard tone", "Binaural beats", "White noise", "Bitonality"],
    artistName: "Hans Zimmer",
    funFact: "A Shepard tone sounds like it's perpetually rising — perfect for Dunkirk's relentless tension.",
    backgroundSong: "Supermarine",
    backgroundArtist: "Hans Zimmer",
    difficulty: "hard",
  },
  {
    questionText: "Dunkirk's score features a ticking clock. Whose watch was recorded for it?",
    correctAnswer: "Christopher Nolan's",
    options: [
      "Christopher Nolan's",
      "Hans Zimmer's",
      "A WWII era watch",
      "Tom Hardy's",
    ],
    artistName: "Hans Zimmer",
    funFact: "Nolan's pocket watch became the rhythmic heartbeat of the entire film.",
    backgroundSong: "The Mole",
    backgroundArtist: "Hans Zimmer",
    difficulty: "hard",
  },

  // ─── NOLAN — TENET ────────────────────────────────────
  {
    questionText: "Tenet was Ludwig Göransson's first collaboration with Christopher Nolan. In which year was it released?",
    correctAnswer: "2020",
    options: ["2019", "2020", "2021", "2022"],
    artistName: "Ludwig Göransson",
    funFact: "Göransson took over from Zimmer because Zimmer was working on Dune.",
    backgroundSong: "The Plan",
    backgroundArtist: "Ludwig Göransson",
    difficulty: "medium",
  },
  {
    questionText: "Travis Scott wrote which original song for Tenet?",
    correctAnswer: "The Plan",
    options: ["The Plan", "Goosebumps", "Sicko Mode", "Highest in the Room"],
    artistName: "Travis Scott",
    funFact: "It was Travis Scott's first-ever original song for a film.",
    backgroundSong: "The Plan",
    backgroundArtist: "Travis Scott",
    difficulty: "hard",
  },
];

async function main() {
  const existing = JSON.parse(readFileSync(PATH, 'utf-8'));
  const existingTexts = new Set(existing.map(q => q.questionText));

  let added = 0;
  for (const q of QUESTIONS) {
    if (existingTexts.has(q.questionText)) continue;
    existing.push({
      questionType: 'film-soundtrack',
      ...q,
      id: crypto.randomBytes(4).toString('hex'),
      validated: true,
      timesUsed: 0,
      createdAt: new Date().toISOString(),
      source: 'opus-curated',
    });
    added++;
  }

  writeFileSync(PATH, JSON.stringify(existing, null, 2));
  console.log(`✅ Added ${added} Tarantino/Nolan questions. Total: ${existing.length}`);
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
