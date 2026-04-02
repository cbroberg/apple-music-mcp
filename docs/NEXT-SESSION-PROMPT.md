# Next Session Prompt

Paste this to start a new session:

---

## Context

Læs `CLAUDE.md` i project root — den indeholder komplet status over hele projektet.

## Hvad blev lavet i denne session (2. april 2026, aften)

### F20: Global Search (Cmd+K) ✅
- Cmd+K command palette med Apple Music search (artists, albums, songs)
- Artist Page (`#artist/{id}`) — hero, top songs 3-kolonne grid, albums grid
- Album Page (`#album/{id}`) — hero, numbered tracks med hover play (num→▶)
- Song Context Menu (···) — Play, Go to Album, Go to Artist, Add to Playlist
- Hash routing inden for Admin, localStorage husker position

### Events ✅
- Event store: disk-persisteret (`quiz-events.json`)
- Create/Edit/End events med navn, dato, rounds (unlimited/fixed), playlist-link
- Active/Scheduled/Previous filter tabs
- Start Quiz fra Event → preloader playlist, viser event name + rounds i titel
- Custom selects (dark theme), custom confirm dialogs (ALDRIG native)

### Admin Improvements ✅
- Provider: "Apple Music" / "Home Controller"
- AirPlay selector for HC, Volume slider begge providers
- Play endpoint: `addToLibrary` + `playExact` (ikke fuzzy searchAndPlay)
- Play log: `GET /quiz/api/admin/play-log` (requested vs actual)
- Track log: `GET /quiz/api/admin/track-log` (alt der faktisk spillede)
- MusicKit CDN loaded dynamisk kun for Apple Music provider

### PWA Fixes ✅
- Wake Lock fra lobby + NoSleep video fallback
- Auto-rejoin kun fra aktiv session (ikke fresh QR scan)
- Avatar persisteret i localStorage, 18 avatarer i 3x6 grid
- Service Worker v2: network-first, auto-update hvert 30s
- overflow-x: hidden (ingen horizontal wiggle)
- Preparation modal: Cancel knap + ESC

### Engine ✅
- `getArtistTopSongs()` i AppleMusicClient
- Fallback options i `generateOptions` (ingen "—" mere)
- Questions default 3 (dev), min 1

## KRITISK: Næste session prioriteter

### 1. Async Download-and-Play Flow 🔴
**Problem:** `addToLibrary` tilføjer til iCloud, men Music.app lokal DB synker langsomt. `playExact` fejler fordi sangen ikke er indekseret endnu. Resultatet: forkert sang spiller, eller intet sker.

**Løsning:** 
- Vis loader på sangen i UI når den ikke er i biblioteket
- Poll `checkLibrary(name, artist)` indtil sangen er klar (max 10s)
- Spil først når verify OK
- Samme flow som quiz preparation men for enkelt-sange

### 2. PWA Stabilitet 🔴
- Join virker i E2E test men har været ustabil fra telefon
- Wake Lock + screen lock recovery mangler robust test
- Service Worker cache kan give stale content

### 3. Recently Played mangler songId 🟡
- Tracks fra live now-playing (HC poll) har ingen songId
- Når du klikker dem, kan `addToLibrary` ikke køre → playExact finder forkert match
- Fix: slå songId op via Apple Music catalog search når track mangler id

### 4. Play All / Next Song 🟡
- Auto-advance logik mangler robust test
- Next Song springer ikke altid korrekt

### 5. End Game flow 🟡
- Exit Game reloader ikke længere — men flowet til finished/DJ Mode skal testes

## Hard Rules (opdateret)
10. **ALDRIG native confirm/alert/prompt** — brug altid custom dark-theme modal dialogs

## Server start
```bash
NODE_ENV=development node server.js
source .env && MCP_WS_URL=ws://localhost:3000/home-ws HOME_API_KEY=$HOME_API_KEY node home/dist/server.js
```

## Debug endpoints
- `GET /quiz/api/admin/play-log` — hvad blev requested vs hvad spillede
- `GET /quiz/api/admin/track-log` — alt der faktisk spillede
- `GET /quiz/api/events` — alle events
- `GET /quiz/api/playback-provider` — aktiv provider
