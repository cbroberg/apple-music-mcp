# Next Session Prompt — Party Session Architecture

Paste this to start a new session:

---

## Context

Læs `CLAUDE.md` i project root — den indeholder komplet status over hele projektet.

## Opgave: Implementer Party Session Architecture

Læs `docs/PARTY-SESSION.md` for det fulde design. Her er et resumé:

### Hvad skal ændres

**Nuværende arkitektur:** Hver quiz er en uafhængig `GameSession` med sin egen join code, spillerliste og DJ kø. Når DJ starter nyt spil, oprettes en helt ny session.

**Ny arkitektur:** En **Party** er hele aftenen. Den ejer playlisten, spillerne og join koden. **Rounds** er quiz-spil inden for en Party.

### Konkrete ændringer

1. **Ny datamodel:**
   - `Party` type: id, joinCode, playlist, players, currentRound, rounds[], state
   - `Round` type: number, config, questions, rankings, completedAt
   - `GameSession` → erstattes af `Party` + `Round`

2. **Party states:** `playlist` | `lobby` | `quiz` | `ceremony`
   - Default = `playlist` (musik spiller, spillere browser kø)
   - `lobby` = DJ har startet en ny runde, spillere joiner
   - `quiz` = spørgsmål kører
   - `ceremony` = resultater, Champions, picks uddeles

3. **Én join code per Party** (ikke per Round)
   - QR koden er den samme hele aftenen
   - Spillere der scanner koden under quiz → Waiting Room
   - Waiting Room spillere auto-joiner næste lobby

4. **Playlist er immutable** — kun tilføjelser, aldrig sletning under Party
   - Spiller kontinuerligt mellem rounds
   - Quiz-sange fra `play-exact` afbryder midlertidigt
   - Resumerer efter quiz

5. **Round # synligt i UI** — "Round 1", "Round 2" etc. på host + player

6. **Picks akkumuleres** — Round 1 picks + Round 2 picks = total

7. **"End Party" knap** — den eneste måde at stoppe alt og rydde op

### Filer der skal ændres
- `src/quiz/types.ts` — Party + Round types
- `src/quiz/engine.ts` — Største ændring: split GameSession → Party + Round
- `src/quiz/ws-handler.ts` — Opdater message handlers til Party context
- `src/quiz/dj-mode.ts` — Playlist ejes af Party, ikke DJ session
- `src/quiz/public/host.html` + `host.js` — Round #, Party states
- `src/quiz/public/play.html` + `play.js` — Round #, Party states
- `scripts/e2e-full-flow.js` — Opdater til Party flow

### Vigtigt
- Læs CLAUDE.md for hard rules (ingen fuzzy, ingen fade-volume, etc.)
- Kør `scripts/e2e-full-flow.js` efter implementering for at verificere
- Servere startes med: `NODE_ENV=development node server.js` + Home Controller
- Home Controller: `source .env && MCP_WS_URL=ws://localhost:3000/home-ws HOME_API_KEY=$HOME_API_KEY node home/dist/server.js`
