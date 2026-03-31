# Next Session Prompt: Music Quiz Multiplayer Web Game

## Kontekst

Vi bygger videre på Apple Music MCP serveren (`music.broberg.dk`). Serveren har 34 MCP tools, Now Playing frontend med pulserende sfære, og en quiz med playback der virker (5/5 tracks spiller med random seek). Se `docs/QUIZ-PLAN.md` for den fulde plan.

## Hvad er bygget

- Express + Next.js custom server på Fly.io (Stockholm)
- 34 MCP tools (catalog, library, quiz, playback, AirPlay)
- Home controller via WebSocket (Mac agent, launchd auto-start)
- Quiz generator med 7 sources + 6 typer + decade/genre filtre
- Quiz game UI (lobby, spørgsmål, countdown, scoring, reveal, winner)
- Auto-playback: pre-load sange → search-and-play → random seek
- Now Playing landing page med live album artwork
- GitHub OAuth login + dev auto-login
- Token persistence på Fly.io volume

## Opgaven: Fase 1 Web Quiz — Full Multiplayer

Byg det komplette multiplayer quiz-spil som beskrevet i `docs/QUIZ-PLAN.md` fase 1. Web first, ingen tvOS endnu.

### Prioriteret rækkefølge:

1. **Game Engine** (`src/quiz/engine.ts`) — erstat nuværende `quiz-manager.ts` med fuld engine: 6-tegn join-koder, player management, game states (lobby → countdown → playing → evaluating → reveal → scoreboard → finished), Kahoot-stil scoring med streak bonus

2. **WebSocket Protocol** (`src/quiz/ws-handler.ts`) — host + player real-time kommunikation via `/quiz-ws`

3. **Host UI** (`/quiz/host`) — fullscreen storskærm: QR-kode, countdown animation, spørgsmål med artwork, reveal, animeret scoreboard, confetti podium

4. **Player PWA** (`/quiz/play`) — telefon: join via QR/kode, emoji avatar, multiple-choice knapper + free-text input, result feedback, final score

5. **AI Answer Evaluation** (`src/quiz/ai-evaluator.ts`) — Claude API (haiku) evaluerer free-text svar: stavefejl OK, forkortelser OK, batch alle svar i ét kald

6. **QR-kode** — `npm install qrcode`, vis på host setup screen

7. **Preview Fallback** — hvis ingen Home Controller, brug Apple Music 30s preview i `<audio>` element

### Teknisk setup:

- Alle quiz-filer i `src/quiz/` mappen
- Host + Player er vanilla HTML/CSS/JS (ingen React — holdes simpelt for fremtidig tvOS WebView)
- Express routes serverer static files
- `.env` har `ANTHROPIC_API_KEY` for Claude API
- Udvikl og test lokalt (`node server.js`) før deploy
- E2E test-script der simulerer 6 spillere

### Design:

- Mørk baggrund (#0a0a0a) med noise texture
- Apple Music rød (#fc3c44) som accent
- Store fonts (læsbare på TV-afstand)
- Smooth CSS animations
- Album artwork som hero-element med glow
- Kahoot!-inspireret men med mere æstetik

### Vigtige detaljer:

- Max 8 spillere per session
- Join-koder: 6 tegn, alfanumerisk, case-insensitive
- Scoring: 1000 point max, falder lineært med svartid, 1.5x streak efter 3, 2x efter 5
- Musik starter ved hvert spørgsmål via Home Controller (allerede virker)
- Pre-load alle sange til Apple Music library ved quiz-oprettelse (allerede virker)
- Random seek position (allerede virker)
- Sessions timeout efter 30 min inaktivitet
- Reconnect-logik for spillere der mister forbindelse

### Filer at læse først:

- `docs/QUIZ-PLAN.md` — den fulde plan
- `src/quiz-manager.ts` — nuværende simpel quiz state (skal erstattes)
- `src/quiz.ts` — quiz generator (genbruges)
- `src/home-ws.ts` — home controller WebSocket (genbruges)
- `src/browser-ws.ts` — browser WebSocket pattern (genbruges)
- `src/index.ts` — Express routes og MCP tools
- `server.js` — custom server (Express + Next.js routing)
