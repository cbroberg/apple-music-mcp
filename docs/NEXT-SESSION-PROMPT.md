# Next Session Prompt

Paste this to start a new session:

---

## Context

Læs `CLAUDE.md` i project root — den indeholder komplet status over hele projektet.

## Hvad blev lavet i denne session (2. april 2026, aften)

### F20: Global Search (Cmd+K) ✅
- Cmd+K command palette med Apple Music search (artists, albums, songs)
- Keyboard navigation (piletaster + Enter + ESC)
- Search-knap i Admin header

### Artist Page (`#artist/{id}`) ✅
- Hero med cirkulært artwork + navn + genres
- Top Songs i 3-kolonne grid (som Apple Music)
- Albums grid — klik navigerer til Album Page
- API: `GET /quiz/api/artist/:id` (top songs via Apple Music view API + albums via search)

### Album Page (`#album/{id}`) ✅
- Hero med artwork + titel + klikbar artist + år + track count
- Numbered track list med hover play (nummer → ▶ ved hover)
- Play All + Add All to Playlist knapper

### Song Context Menu (···) ✅
- ▶ Play, 💿 Go to Album, 🎤 Go to Artist
- Add to Playlist med liste + "New playlist" inline create

### Hash Routing ✅
- `#artist/123`, `#album/456` inden for Admin
- Back-knap med navigation history
- localStorage husker position ved reload

### Events (Quiz/Events tab) ✅
- Event store: disk-persisteret (`quiz-events.json`)
- Create event med navn + dato + rounds + playlist-link
- Active / Scheduled / Previous filter tabs
- Edit Event modal (custom selects for rounds + playlist)
- Start Quiz fra event → preloader playlist på Host
- Safe update: kun overskriver felter der er sendt (ingen undefined-nuking)

### Admin Improvements
- Provider toggle: "Apple Music" / "Home Controller"
- AirPlay selector for HC (liste over devices via osascript)
- Volume slider for begge providers (+ AirPlay device volume)
- Custom confirm dialogs (ALDRIG native confirm/alert)
- Custom select buttons (dark theme dropdowns)
- Host playlists modal: ⌘K-style med søg + artwork + keyboard nav
- Play endpoint: `addToLibrary` + `playExact` i stedet for fuzzy `searchAndPlay`

### PWA Fixes
- Wake Lock fra lobby (ikke kun DJ Mode)
- NoSleep video fallback for iOS Safari
- Avatar gemmes i localStorage
- Auto-rejoin kun når allerede i session (ikke på fresh QR scan)

### Engine
- `getArtistTopSongs()` metode tilføjet til AppleMusicClient
- Fallback artist/song/album names i `generateOptions` (ingen "—" mere)
- Play playlist API: `POST /quiz/api/admin/play-playlist/:id`

## KRITISKE ISSUES TIL NÆSTE SESSION

### 1. PWA Join sidder fast
**Symptom:** "Joining..." vises men spilleren kommer aldrig til lobby.
**Årsag:** Ukendt — kan være WS connection issue, caching, eller noget i join-flow.
**Prioritet:** BLOKERER fest på lørdag. FIX DETTE FØRST.
**Test:** Opret quiz på Host, scan QR fra telefon (Safari + Chrome), verificer join virker.

### 2. Skærm går i sort under quiz (iOS)
**Symptom:** Telefonen låser skærm under quiz-runde, spilleren mister state.
**Årsag:** Wake Lock API virker ikke i alle iOS Safari versioner. NoSleep video fallback tilføjet men utestet.
**Prioritet:** Høj — ødelægger spilsession.

### 3. Guitar-lyd ved join mangler
**Symptom:** Ingen instrument-lyd når spiller joiner i lobby.
**Årsag:** Lyden spiller på Host-siden i `playInstrumentSound(avatar)` — men kun i lobby state. Muligvis AudioContext kræver user gesture først.

### 4. End Game → instant reload
**Symptom:** Scoreboard vises 2 sek → reload til setup.
**Årsag:** `exitGame()` kaldte `location.reload()` — nu fjernet, men flowet skal testes.

## HARD RULES (tilføjet)
10. **ALDRIG native confirm/alert/prompt** — brug altid custom dark-theme modal dialogs

## Kendte issues (lavere prioritet)
- Play All virker fra nogle playlists men ikke alle (Police PL issue i browser)
- Next Song avancerer ikke automatisk (auto-advance logik mangler robust test)
- Edit Event: custom selects bruger `song-ctx-menu` element (delt med song context menu)
- Volume slider påvirker kun Music.app — AirPlay device volume er separat
- `play-exact` returnerer success men spiller forkert sang i visse tilfælde

## Filer ændret i denne session
- `src/apple-music.ts` — `getArtistTopSongs()` metode
- `src/quiz/engine.ts` — fallback options i `generateOptions`
- `src/quiz/event-store.ts` — NY: disk-persisteret event store
- `src/quiz/routes.ts` — artist API, events API, play-exact flow, play-playlist
- `src/quiz/ws-handler.ts` — game state i join response
- `src/quiz/public/admin.html` — Cmd+K, artist/album pages, events tab, context menu, volume, AirPlay
- `src/quiz/public/admin.css` — search overlay, content pages, custom selects, song rows
- `src/quiz/public/admin.js` — custom confirm
- `src/quiz/public/host.html` — playlists modal, confirm dialog
- `src/quiz/public/host.js` — playlists modal, event loading, provider status, keyboard nav
- `src/quiz/public/play.js` — wake lock, avatar persistence, auto-rejoin fix
- `CLAUDE.md` — Hard Rule #10

## Vigtigt
- Server: `NODE_ENV=development node server.js`
- HC: `source .env && MCP_WS_URL=ws://localhost:3000/home-ws HOME_API_KEY=$HOME_API_KEY node home/dist/server.js`
- MUTE_ALL=true i .env for stille test
- Læs CLAUDE.md for alle hard rules
