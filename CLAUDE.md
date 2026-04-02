# Music Quiz — Project Instructions

## Current Status (April 2026)

Music Quiz v3.0.0 — multiplayer music quiz party game powered by Apple Music.
Core quiz + DJ Mode working end-to-end. Next major milestone: **Party Session architecture** (see below).

### What Works
- **Multiplayer Quiz:** WebSocket game engine, QR join, Kahoot-style scoring, AI answer evaluation
- **DJ Mode:** Players earn picks through quiz → search Apple Music → add to shared queue
- **Exact Match Playback:** `play-exact` osascript command, no fuzzy search, verified before timer starts
- **Pre-download:** All quiz songs downloaded + verified before quiz starts (progress modal with theme music)
- **Theme Songs:** "Theme from New York, New York" (prep), "We Are the Champions" (victory)
- **Waiting Room:** Late arrivals wait, auto-join when next lobby opens
- **Player Reconnect:** Rejoin DJ Mode seamlessly after page navigation
- **Library Cleanup:** Tracks quiz-added songs, deletes on DJ Mode end (never theme songs, never user's own music)
- **Screen Recording:** ScreenCaptureKit Swift CLI with system audio + `--crop` flag
- **E2E Testing:** Playwright, 4-window ultrawide, full 2-round flow with Waiting Room
- **Quiz Log:** Expected vs actual song verification saved to `recordings/`

### Architecture
- **Server:** Node.js + Express + WebSocket (`server.js` → `src/`)
- **Home Controller:** Separate Mac agent (`home/`) connects via WebSocket, controls Music.app via osascript
- **Host UI:** Vanilla HTML/JS (`src/quiz/public/host.*`) — fullscreen on Mac/TV
- **Player UI:** Vanilla HTML/JS PWA (`src/quiz/public/play.*`) — mobile phones
- **Now Playing:** Vanilla page (`src/quiz/public/now-playing.html`) — vinyl sphere + track info
- **Quiz Builder:** Vanilla HTML/JS (`src/quiz/public/builder.*`) — curate custom playlists
- **Admin:** Vanilla HTML/JS (`src/quiz/public/admin.*`) — recently played, play buttons
- **Frontend:** Next.js (`web/`) — original Now Playing page (being phased out for vanilla)
- **All quiz UI is vanilla** (not Next.js) for future tvOS WebView compatibility

### Key Files
| File | Purpose |
|------|---------|
| `src/quiz/engine.ts` | Game engine: sessions, scoring, question flow, song preparation |
| `src/quiz/ws-handler.ts` | WebSocket handler: host/player messages, DJ Mode, reconnect |
| `src/quiz/dj-mode.ts` | DJ Mode state: picks, queue, autoplay |
| `src/quiz/types.ts` | All TypeScript interfaces |
| `src/quiz/routes.ts` | Express routes for quiz pages + API |
| `src/quiz/ai-evaluator.ts` | Claude haiku for free-text answer evaluation |
| `src/quiz/playlist-store.ts` | Disk persistence for custom playlists |
| `home/server.ts` | Home Controller: osascript commands, WebSocket agent |
| `server.js` | Main server: routing between Express and Next.js |
| `scripts/e2e-full-flow.js` | Full E2E test: 2 rounds, Waiting Room, DJ Mode |
| `scripts/manual-test.js` | Semi-auto test: opens windows, user clicks |
| `scripts/screen-record/` | ScreenCaptureKit Swift CLI for video + audio recording |

## Song Playback

**ALDRIG fuzzy søgning.** Brug altid `play-exact` med eksakt sangnavn + artist.

### Playback Chain
1. **Pre-download:** `addToLibrary(songId)` via Apple Music API under preparation modal
2. **Verify:** `check-library({ name, artist })` confirms song is in local Music.app
3. **Play:** `play-exact({ name, artist, retries })` → osascript `whose name is "X" and artist contains "Y"`
4. **Fallback:** Try simplified name (without parentheses/remaster tags)
5. **Alt swap:** If both fail, swap question with pre-prepared alternative — NEVER silence
6. **Verify playing:** Poll `now-playing` with exponential backoff (300→600→1200→2000ms)
7. **Nudge:** If still not playing, send `play` command as different approach

### What Does NOT Work on macOS
- `play-ids` via URL scheme — navigates but doesn't play correct song
- MusicKit `SystemMusicPlayer` — `@available(macOS, unavailable)`
- Fuzzy `search playlist "Library" for "X"` — matches wrong songs

### Theme Songs (protected from cleanup)
- **Preparation:** "Theme from New York, New York" — Frank Sinatra (+ backups: Every Breath You Take, Message In A Bottle)
- **Victory:** "We Are the Champions" — Queen

## Game States & Join Rules

| Session State | New Player | Existing Player |
|---|---|---|
| **Lobby** | ✅ Join | ✅ Rejoin |
| **Game (playing/countdown/etc.)** | → Waiting Room | ❌ Closed |
| **Finished / DJ Mode** | → Waiting Room | ✅ Rejoin DJ Mode |
| **New Lobby opens** | Waiting Room → auto-join | Auto-join via `lobby_open` |

## DJ Mode Queue Rules
- Queue is immutable — songs are never deleted during a party
- Picks: #1=5, #2=3, #3=2, rest=1, streak bonus +1
- Picks accumulate across rounds
- 0 picks = search hidden, queue tab only
- Queue survives between quiz rounds

## Volume & Music
- **No fade-volume** — removed entirely, caused persistent volume=0 bugs
- Volume set to 75 at quiz start
- Music paused (not faded) between songs and before countdown
- Champions plays async after results (non-blocking)

## Danish Language Support
- `looksLikeDanish()` detects æøå in text
- Option generation prefers Danish alternatives for Danish songs
- Year options never exceed current year

## Engine: Question Generation
- Generates **3x** requested count (e.g., 9 for 3 questions)
- Primary questions get artwork + options
- Alternatives ready for runtime swap if primary fails playback
- `excludeRecentPlays` checkbox controls recently-played exclusion

## Testing
- **E2E full flow:** `node scripts/e2e-full-flow.js` — 2 rounds, Waiting Room, DJ Mode
- **Manual test:** `node scripts/manual-test.js` — opens windows, user controls
- **Quiz log:** Saved to `recordings/quiz-log-{timestamp}.json`
- **Screen recording:** `recordings/` dir (in .gitignore)
- **Server must be fresh** for clean `usedSongIds`

## Next: Party Session Architecture

**The next major refactor.** See [docs/PARTY-SESSION.md](docs/PARTY-SESSION.md) for full design.

Current architecture treats each quiz as an independent session. The Party Session redesign introduces:
- **Party** = entire evening (one join code, one playlist, multiple rounds)
- **Round** = one quiz game within a Party
- **Playlist** = immutable, plays continuously, owned by Party
- **Round #** visible in UI (host + players)
- Default state = playlist playing, quiz rounds are interruptions

## Documentation
- [docs/ROADMAP.md](docs/ROADMAP.md) — Milestones (done + planned)
- [docs/FEATURES.md](docs/FEATURES.md) — Feature list with descriptions (F01-F16)
- [docs/PARTY-SESSION.md](docs/PARTY-SESSION.md) — Party Session architecture design
- [docs/NEXT-SESSION-PROMPT.md](docs/NEXT-SESSION-PROMPT.md) — Previous session handoff (outdated, use this CLAUDE.md)

## Hard Rules
1. **Fortæl brugeren hvad du laver FØR du laver det**
2. **ALDRIG fuzzy søgning** — exact match or silence (but swap alternative first)
3. **ALDRIG fade-volume** — caused cascading volume=0 bugs
4. **Playlist er immutable** under en party — kun tilføjelser
5. **Picks tildeles synkront** — før DJ Mode kan aktiveres
6. **Ingen join-skærm glimt** — blank skærm under auto-rejoin
7. **Vanilla HTML/JS** for quiz UI (ikke Next.js) — tvOS WebView compatibility
