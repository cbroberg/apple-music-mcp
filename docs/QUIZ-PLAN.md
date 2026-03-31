# Apple Music Quiz — Multiplayer Party Game

## Vision

En musik-quiz der bringer familien og vennerne sammen. Quizmasteren starter spillet på storskærmen (Apple TV eller en Mac i fullscreen), musikken spiller, og deltagerne svarer fra deres telefoner. Alt drevet af det eksisterende MCP tool-sæt og Apple Music API.

**To spil-modes:**

1. **Web Mode** — Mac i fullscreen + telefoner via QR-kode (fase 1)
2. **TV Mode** — tvOS app på Apple TV + telefoner via QR-kode (fase 2)

Begge modes deler samme backend, same deltager-PWA, og same game engine. Forskellen er kun hvad der driver storskærmen.

---

## Status: Hvad er bygget (pr. 31. marts 2026)

### Fungerer nu
- ✅ Quiz generator med 7 sources (Recently Played, Charts, Library, Genre, Movie Soundtracks, Dansk Musik, Random Shuffle)
- ✅ Quiz game UI med lobby, spørgsmål, countdown, scoring, reveal, winner
- ✅ Automatisk musik-playback via Home Controller (search-and-play + osascript)
- ✅ Pre-loading af sange til library ved quiz-oprettelse
- ✅ Random seek position (15-60% af tracklængde) — ikke altid intro
- ✅ Retry-logik med forenklet søgenavn (fjerner feat/brackets)
- ✅ 6 quiz-typer: mixed, intro-quiz, guess-the-artist/song/album/year
- ✅ Decade-filter (60s-20s)
- ✅ Genre-dropdown med 16 genrer
- ✅ Recent players husket i localStorage
- ✅ GitHub OAuth login (produktion) + auto-login (dev)
- ✅ Stop Quiz funktion
- ✅ MCP tool: `create_visual_quiz` (opret quiz fra Claude, returnerer URL)
- ✅ MCP tool: `music_quiz` (generér quiz data)
- ✅ E2E test: 5/5 unikke tracks spiller med random seek

### Kendte problemer
- ⚠️ Notification Center på Mac viser sangtitel (spoiler) — slå fra i System Settings → Notifications → Music
- ⚠️ Quiz sessions er in-memory (tabes ved deploy)
- ⚠️ Ingen QR-kode tilmelding endnu (quiz-master klikker navne manuelt)
- ⚠️ Ingen free-text svar fra deltagere (kun klik-på-navn scoring)
- ⚠️ Ingen AI-evaluering af svar

### Mangler til fase 1 (næste sessioner)
- 🔲 QR-kode join flow
- 🔲 Player PWA (deltager svarer fra sin telefon)
- 🔲 Multiple choice svarmuligheder
- 🔲 Free-text svar mode med AI-evaluering
- 🔲 Kahoot-stil scoring (hurtigere = flere point)
- 🔲 Streak bonus
- 🔲 Host UI optimeret til fullscreen storskærm
- 🔲 Animeret scoreboard med leaderboard-bevægelser
- 🔲 Countdown 3-2-1 animation
- 🔲 Confetti/podium ved quiz-slut
- 🔲 Preview fallback (30s Apple Music preview i browser hvis ingen Home Controller)

---

## Forudsætninger

- Apple Music abonnement (til afspilning)
- Apple Developer konto ($99/år — allerede aktiv)
- MCP server kørende på `music.broberg.dk` (Fly.io)
- Home controller på Mac (til Web Mode afspilning)

---

## Fase 1: Web Quiz (Fuld web-oplevelse)

### Overblik

```
┌─────────────────────────────────────────────────┐
│  Mac Browser (fullscreen)                       │
│  music.broberg.dk/quiz/host                     │
│  ┌───────────────────────────────────────────┐  │
│  │  Quiz Host UI                             │  │
│  │  - Viser spørgsmål, artwork, scoreboard   │  │
│  │  - Afspiller musik via Home Controller    │  │
│  │  - Viser QR-kode til deltagere            │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
        ▲ WebSocket ▼
┌─────────────────────────────────────────────────┐
│  music.broberg.dk  (MCP server / Fly.io)        │
│  ┌────────────┐ ┌────────────┐ ┌─────────────┐ │
│  │ Quiz Game  │ │ Apple Music│ │   Home WS   │ │
│  │ Engine     │ │ API        │ │   Bridge    │ │
│  └────────────┘ └────────────┘ └─────────────┘ │
│  ┌────────────────────────────────────────────┐ │
│  │ Claude API (AI Answer Evaluation)          │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
        ▲ WebSocket ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ iPhone 1 │ │ iPhone 2 │ │ iPhone 3 │
│ PWA      │ │ PWA      │ │ PWA      │
│ /quiz/   │ │ /quiz/   │ │ /quiz/   │
│  play    │ │  play    │ │  play    │
└──────────┘ └──────────┘ └──────────┘
```

### F1.1: Quiz Game Engine (server-side)

**Fil:** `src/quiz/engine.ts`

Game engine der orkestrerer hele quiz-flowet server-side. Stateful per session.

```typescript
interface QuizSession {
  id: string;                    // 6-char join code (f.eks. "ROCK42")
  hostId: string;                // WebSocket connection id for host
  players: Map<string, Player>;  // spillere indexed by connection id
  config: QuizConfig;
  state: GameState;
  currentQuestion: number;
  questions: QuizQuestion[];
  timer: NodeJS.Timeout | null;
}

interface Player {
  id: string;
  name: string;
  avatar: string;      // emoji valgt ved join
  score: number;
  streak: number;      // consecutive correct answers
  answers: Answer[];   // historik for scoreboard
}

interface QuizConfig {
  questionCount: number;       // 5-20
  timeLimit: number;           // sekunder per spørgsmål (10-60)
  quizType: QuizType;
  source: QuizSource;
  sourceArtist?: string;
  decade?: string;
  genre?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  answerMode: 'multiple-choice' | 'free-text' | 'mixed';
}

type GameState =
  | 'lobby'           // venter på spillere
  | 'countdown'       // 3-2-1 før spørgsmål
  | 'playing'         // musik spiller, spillere svarer
  | 'evaluating'      // AI evaluerer free-text svar
  | 'reveal'          // viser korrekt svar + point
  | 'scoreboard'      // viser rangering mellem spørgsmål
  | 'finished';       // slut — final scoreboard

interface QuizQuestion {
  songId: string;
  songName: string;
  artistName: string;
  albumName: string;
  albumArtwork: string;      // URL fra Apple Music
  releaseYear: number;
  previewUrl?: string;       // 30s preview (fallback)
  options: string[];          // 4 svarmuligheder (multiple-choice mode)
  correctIndex: number;
  hint?: string;
}
```

**Game loop:**

1. Host opretter session → får join-kode (f.eks. "ROCK42")
2. Spillere scanner QR / indtaster kode → joiner lobby
3. Host trykker "Start" → engine pre-loader sange og genererer spørgsmål
4. Per spørgsmål:
   - State → `countdown` (3-2-1 animation på host + player screens)
   - State → `playing` — musik starter via Home Controller, timer kører
   - **Multiple-choice mode:** Spillere ser 4 svarmuligheder, trykker på svar
   - **Free-text mode:** Spillere skriver svar (artist, titel, album, etc.)
   - Points: hurtigere svar = flere point (1000 max, falder lineært med tid)
   - Streak bonus: 2x efter 3 korrekte i træk
   - **Free-text:** State → `evaluating` — AI evaluerer alle svar
   - State → `reveal` — viser korrekt svar, artwork, hvem der svarede rigtigt
   - State → `scoreboard` — animeret leaderboard
5. Efter sidste spørgsmål: `finished` — podium-animation, confetti

### F1.2: AI Answer Evaluation (Claude API)

**Ny komponent til free-text svar-evaluering.**

Når spillere skriver free-text svar i stedet for multiple choice, bruger serveren Claude API til at evaluere om svaret er korrekt.

**Fil:** `src/quiz/ai-evaluator.ts`

```typescript
interface AnswerEvaluation {
  playerId: string;
  playerAnswer: string;
  isCorrect: boolean;
  confidence: number;        // 0-1
  explanation?: string;       // "Close enough — Fleetwood Mac accepted for Fleetwood"
}

async function evaluateAnswers(
  correctAnswer: string,
  questionType: QuizType,
  playerAnswers: Array<{ playerId: string; answer: string; timeMs: number }>,
): Promise<AnswerEvaluation[]> {
  // Single Claude API call med alle svar:
  // "The correct answer is 'Fleetwood Mac'.
  //  Evaluate these player answers as correct/incorrect:
  //  1. 'Fleetwood' - Player A
  //  2. 'Fleet wood mac' - Player B
  //  3. 'Eagles' - Player C
  //  Be generous with spelling and abbreviations."
}
```

**Evalueringsregler:**
- Stavefejl tilladt ("Fleet wood mac" = "Fleetwood Mac" ✓)
- Forkortelser tilladt ("Stones" = "The Rolling Stones" ✓)
- Delvise svar kan accepteres baseret på questionType:
  - `guess-the-artist`: artistnavn nok, fornavn kan være nok for soloartister
  - `guess-the-song`: sangtitel, parenteser/feat ignoreres
  - `guess-the-year`: ±2 år tæller som korrekt
- Batch-evaluering: alle spilleres svar sendes i ét API-kald (effektivt)
- Fallback: hvis API fejler, mark alle som "needs manual review" og quiz-master afgør

**Timing:**
- Free-text svar indsamles mens timer kører
- Når timer udløber ELLER alle har svaret → `evaluating` state (1-3 sekunder)
- AI evaluerer → `reveal` state med markering af korrekte/forkerte svar

**Claude API konfiguration:**
- Model: claude-haiku (hurtigt + billigt for simpel string-matching)
- Environment variable: `ANTHROPIC_API_KEY`
- Structured output: JSON array af evalueringer

### F1.3: Quiz Host UI (storskærm)

**Route:** `GET /quiz/host`

Single-page app optimeret til fullscreen visning på stor skærm. Ingen scroll, ingen input-felter — alt styres via keyboard shortcuts eller fra telefon.

**Screens:**

1. **Setup Screen**
   - Konfigurer quiz (type, antal, kilde, tidsgrænse, svar-mode)
   - Stor QR-kode med join-URL: `music.broberg.dk/quiz/play?code=ROCK42`
   - Join-kode vises stort: `ROCK42`
   - Liste over tilsluttede spillere (live-opdateret)
   - "Start Quiz" knap (eller tryk Space)

2. **Countdown Screen**
   - Spørgsmålsnummer (`3 / 10`)
   - 3-2-1 countdown animation
   - Quiz-type hint ("Gæt kunstneren!")

3. **Question Screen**
   - Album artwork (stort, centreret) — skjult i intro-quiz, vises gradvist
   - 4 svarmuligheder (A/B/C/D med farver) — eller "Skriv dit svar" for free-text
   - Countdown-timer (cirkulær progress)
   - Antal spillere der har svaret: `3/5 har svaret`
   - Musik spiller i baggrunden

4. **Evaluating Screen** (kun free-text mode)
   - "AI evaluerer svar..." med animation
   - Varer 1-3 sekunder

5. **Reveal Screen**
   - Korrekt svar highlighted i grøn
   - Album artwork + sang-info
   - Hvem svarede rigtigt (avatars + hvad de svarede)
   - Point-animation per spiller
   - For free-text: vis AI's evaluering ("Fleetwood → Fleetwood Mac ✓")

6. **Scoreboard Screen**
   - Animeret leaderboard (spillere rykker op/ned)
   - Avatar + navn + score + streak
   - Top 3 highlighted

7. **Final Screen**
   - Podium (1st, 2nd, 3rd)
   - Confetti-animation
   - Fuld statistik
   - "Spil igen" knap

**Teknisk:**

- Vanilla HTML/CSS/JS (ingen framework — holdes simpelt for WebView-kompatibilitet i fase 2)
- WebSocket forbindelse til server for real-time game state
- CSS custom properties for theming (mørkt tema, Apple Music rød #fc3c44)
- Responsive: fungerer på 1080p+ skærme
- Keyboard shortcuts: Space (next), Escape (back to setup)
- Ingen lyd-afspilning i browseren — al musik via Home Controller

**Design-retning:**

- Mørk baggrund (#0a0a0a) med noise texture
- Apple Music rød (#fc3c44) som accent
- Store fonts, læsbare på afstand
- Smooth animations (CSS transitions + keyframes)
- Album artwork som hero-element med pulserende glow
- Inspiration: Kahoot! men med Apple Music æstetik

### F1.4: Player PWA (deltager-telefon)

**Route:** `GET /quiz/play`

Progressive Web App der installeres via "Tilføj til hjemmeskærm" efter QR-scan.

**Screens:**

1. **Join Screen**
   - Hvis `?code=ROCK42` i URL: auto-udfyldt
   - Ellers: Indtast join-kode (6 tegn)
   - Vælg navn (max 12 tegn)
   - Vælg avatar (grid af 16 emojis: 🎸🎤🎹🥁🎺🎻🎵🎶🎧🎼🪘🪗🎷🪈🪇🫧)
   - "Join" knap

2. **Lobby Screen**
   - "Venter på at quizmasteren starter..."
   - Liste over andre spillere (navn + avatar)
   - Pulserende animation

3. **Answer Screen (multiple-choice)**
   - Spørgsmålsnummer + quiz-type
   - 4 store svarknapper (farvekodet: blå, rød, grøn, gul)
   - Countdown-timer synkroniseret med host
   - Vibrering ved tryk (navigator.vibrate)
   - Knapperne disables efter svar
   - Viser valgt svar med checkmark

4. **Answer Screen (free-text)**
   - Spørgsmålsnummer + quiz-type hint ("Skriv artistens navn")
   - Tekstfelt med stor font
   - Send-knap
   - Countdown-timer
   - "AI evaluerer..." feedback efter indsendelse

5. **Result Screen**
   - ✅ Rigtigt / ❌ Forkert
   - Points earned denne runde
   - Streak counter
   - Din placering
   - (Free-text) Hvad du svarede + AI's vurdering

6. **Final Score Screen**
   - Din endelige placering
   - Total score
   - Statistik: korrekte svar, gennemsnitlig svartid, longest streak

**Teknisk:**

- PWA med manifest + service worker for offline shell
- Touch-optimeret (store knapper, minimum 48x48px tap targets)
- WebSocket forbindelse til server
- Reconnect-logik: hvis forbindelse droppes, auto-reconnect med session ID
- Ingen lyd-afspilning på telefonen

### F1.5: WebSocket Protocol

**Endpoint:** `wss://music.broberg.dk/quiz-ws`

Alle beskeder er JSON med `type` felt.

**Host → Server:**

```typescript
{ type: 'create_session', config: QuizConfig }
{ type: 'start_quiz' }
{ type: 'next_question' }
{ type: 'skip_question' }
{ type: 'end_quiz' }
{ type: 'kick_player', playerId: string }
```

**Server → Host:**

```typescript
{ type: 'session_created', sessionId: string, joinCode: string }
{ type: 'player_joined', player: Player }
{ type: 'player_left', playerId: string }
{ type: 'game_state', state: GameState, question?: QuizQuestion, scores?: PlayerScore[] }
{ type: 'answer_received', playerId: string, total: number, expected: number }
{ type: 'evaluating_answers' }   // AI is processing free-text answers
{ type: 'question_results', results: QuestionResult[] }
{ type: 'final_results', rankings: FinalRanking[] }
```

**Player → Server:**

```typescript
{ type: 'join_session', joinCode: string, name: string, avatar: string }
{ type: 'submit_answer', questionIndex: number, answerIndex: number, timeMs: number }  // multiple-choice
{ type: 'submit_text_answer', questionIndex: number, text: string, timeMs: number }    // free-text
```

**Server → Player:**

```typescript
{ type: 'joined', sessionId: string, player: Player, players: Player[] }
{ type: 'game_state', state: GameState, options?: string[], timeLimit?: number, answerMode?: string }
{ type: 'answer_result', correct: boolean, points: number, totalScore: number, rank: number, aiExplanation?: string }
{ type: 'final_result', rank: number, totalScore: number, stats: PlayerStats }
{ type: 'error', message: string }
```

### F1.6: Music Playback Integration

Musik-afspilning sker via det eksisterende Home Controller WebSocket.

Når game engine skal spille en sang:

1. Sange pre-loades til library ved quiz-oprettelse (`addToLibrary`)
2. Engine kalder `search-and-play` med `randomSeek: true` via Home Controller
3. Home Controller sender AppleScript til Music.app: søg → spil → sæt random position
4. Musik spiller ud af Mac'ens højttalere (eller via AirPlay til TV/speaker)

**Fallback (ingen Home Controller):**

Hvis Home Controller ikke er tilsluttet, brug Apple Music 30-second preview URLs:
- `previewUrl` er inkluderet i quiz-spørgsmålet fra Apple Music API
- Afspilles som `<audio>` element i host-browseren
- Markér tydeligt i UI at det er preview-mode

**Vigtig note:** Slå Music.app notifikationer fra i System Settings → Notifications → Music for at undgå spoilers på storskærmen.

### F1.7: Server Routes

Tilføj til eksisterende Express server:

```
GET  /quiz/host         → Host UI (fullscreen storskærm)
GET  /quiz/play         → Player PWA
GET  /quiz/manifest.json → PWA manifest
GET  /quiz/sw.js        → Service worker
GET  /quiz/api/session/:code → Session info (for player join validation)
WSS  /quiz-ws           → WebSocket endpoint for game communication
```

### F1.8: Filstruktur (nye filer)

```
src/
  quiz/
    engine.ts           # Game engine (session management, scoring, game loop)
    ai-evaluator.ts     # Claude API integration for free-text answer evaluation
    routes.ts           # Express routes for quiz endpoints
    ws-handler.ts       # WebSocket handler for quiz game
    types.ts            # TypeScript interfaces for quiz
    public/
      host.html         # Host UI (fullscreen storskærm)
      host.css          # Host styling
      host.js           # Host client-side logic
      play.html         # Player PWA
      play.css          # Player styling
      play.js           # Player client-side logic
      manifest.json     # PWA manifest
      sw.js             # Service worker
```

### F1.9: Implementeringsrækkefølge

1. `types.ts` — alle interfaces
2. `engine.ts` — game engine med session management og QR-kode join codes
3. `ai-evaluator.ts` — Claude API integration for free-text evaluering
4. `ws-handler.ts` — WebSocket handler med host + player protokol
5. `routes.ts` — Express routes
6. Integrér routes + ws i server
7. `host.html/css/js` — host UI med alle 7 screens inkl. evaluating
8. `play.html/css/js` — player PWA med alle 6 screens inkl. free-text
9. PWA assets (manifest, sw, icons)
10. E2E test med automatiseret quiz + mock-spillere + AI-evaluering
11. Deploy til Fly.io

---

## Fase 2: tvOS App (Apple TV)

### Overblik

tvOS-appen erstatter Mac-browseren som storskærm. Deltagerne bruger præcis samme PWA som i fase 1.

```
┌─────────────────────────────────────────────────┐
│  Apple TV                                       │
│  ┌───────────────────────────────────────────┐  │
│  │  SwiftUI Shell                            │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  WKWebView                          │  │  │
│  │  │  music.broberg.dk/quiz/tv           │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  │  ┌─────────────┐  ┌────────────────────┐  │  │
│  │  │  MusicKit   │  │  Siri Remote       │  │  │
│  │  │  Playback   │  │  Focus Engine      │  │  │
│  │  └─────────────┘  └────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### F2.1-F2.8: (Uændret fra original plan)

Se original plan-sektioner for tvOS-specifik implementering inkl. Xcode setup, SwiftUI shell, WKWebView + JS bridge, MusicKit playback, TV-optimeret UI, Siri Remote, TestFlight, og App Store submission.

Key point: MusicKit på tvOS afspiller direkte på Apple TV — ingen Home Controller nødvendig.

---

## Delt infrastruktur (begge faser)

### Scoring-algoritme

```typescript
function calculatePoints(timeMs: number, timeLimitMs: number, streak: number): number {
  if (timeMs > timeLimitMs) return 0;

  // Base: 1000 point, falder lineært med tid
  const timeRatio = 1 - (timeMs / timeLimitMs);
  const basePoints = Math.round(1000 * timeRatio);

  // Streak bonus: 1.5x efter 3, 2x efter 5
  const multiplier = streak >= 5 ? 2.0 : streak >= 3 ? 1.5 : 1.0;

  return Math.round(basePoints * multiplier);
}
```

### AI Evaluering (Claude API)

- Model: `claude-haiku-4-5-20251001` (hurtig + billig)
- Batch: alle spilleres svar evalueres i ét API-kald
- Genøsitet: stavefejl, forkortelser, delvise navne accepteres
- Fallback: quiz-master kan override AI-vurdering
- Cost: ~$0.001 per spørgsmål (trivielt)

### Apple Music Artwork

Artwork URLs fra Apple Music API:
```
https://is1-ssl.mzstatic.com/image/thumb/{path}/{w}x{h}.jpg
```
600x600 for host/TV, 200x200 for player thumbnails.

---

## Implementeringsstrategi

### Fase 1 estimat: 3-5 sessioner

| Session | Scope |
|---------|-------|
| 1 | `types.ts` + `engine.ts` + `ai-evaluator.ts` + `ws-handler.ts` + `routes.ts` + server integration |
| 2 | `host.html/css/js` — komplet host UI med alle 7 screens |
| 3 | `play.html/css/js` — komplet player PWA med alle 6 screens |
| 4 | PWA assets + QR-kode generation + E2E test + deploy |
| 5 | Polish: animations, edge cases, reconnect-logik, preview fallback |

### Fase 2 estimat: 2-3 sessioner

| Session | Scope |
|---------|-------|
| 1 | Xcode project setup + SwiftUI shell + WKWebView + MusicKit auth |
| 2 | JS ↔ Swift bridge + MusicPlayer + `/quiz/tv` route |
| 3 | Siri Remote focus + TestFlight build + polish |

### Definition of Done

**Fase 1:**
- [ ] Quizmaster kan oprette session og se QR-kode på storskærm
- [ ] 2+ spillere kan joine via QR-kode på telefon
- [ ] Quiz afspiller musik via Home Controller (eller preview fallback)
- [ ] Multiple-choice OG free-text svar modes
- [ ] AI evaluerer free-text svar via Claude API
- [ ] Spillere kan svare og se point i real-time
- [ ] Kahoot-stil scoring (hurtigere = flere point + streak bonus)
- [ ] Scoreboard vises mellem spørgsmål
- [ ] Final podium med statistik
- [ ] Deployed og tilgængeligt på music.broberg.dk/quiz

**Fase 2:**
- [ ] tvOS app loader quiz UI i WKWebView
- [ ] MusicKit afspiller sange direkte på Apple TV
- [ ] Siri Remote kan navigere UI
- [ ] TestFlight build installeret på Apple TV
- [ ] Samme player PWA fungerer med tvOS host

---

## Tekniske noter

### Eksisterende kode der genbruges

- `generateQuiz()` → kalds internt fra game engine for at generere spørgsmål
- `AppleMusicClient` → catalog search, artwork, addToLibrary
- Home Controller WebSocket → afspilning med search-and-play + randomSeek
- Express server → nye routes tilføjes
- Now-playing WebSocket → kan genbruges til host artwork display

### Dependencies (kun nye for fase 1)

- `@anthropic-ai/sdk` — Claude API for AI answer evaluation
- `qrcode` — QR-kode generation for join-links
- Ingen andre nye npm dependencies

### Sikkerhed

- Join-koder er 6-tegn alfanumeriske, case-insensitive, expires efter 30 min
- Ingen persondata gemmes (spillernavne er kun i memory)
- WebSocket connections autentificeres per session
- Rate limiting på session creation (max 10 per time per IP)
- Claude API key i Fly secret, aldrig eksponeret til klient

### Performance

- Game state holdes i memory (ikke database) — sessions er kortlivede
- WebSocket messages er typisk < 1KB
- Album artwork caches via CDN (Apple Music's mzstatic.com)
- Max 8 spillere × ~10 messages per spørgsmål = triviel load
- AI evaluering: ~200ms per batch (haiku er hurtig)

---

*Plan version 2.0 — Christian Broberg / WebHouse ApS*
*Opdateret: 31. marts 2026*
*Tilføjet: AI answer evaluation, free-text mode, status over hvad der er bygget, notification fix*
