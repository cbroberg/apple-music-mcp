# Next Session Prompt

Paste this to start a new session:

---

## Context

Læs `CLAUDE.md` i project root — den indeholder komplet status over hele projektet.

## Hvad blev lavet i denne session (2. april 2026)

### Party Session Architecture (F19) ✅
- Event (Party) = hele aftenen. Round = én quiz. Playlist akkumulerer.
- Én join code per Event. Spillere persisterer. Picks akkumulerer.
- Round # badge i UI. "New Round" / "End Event" knapper.
- Verificeret med 5-runde E2E test (28 sange akkumuleret).

### PlaybackProvider Abstraction (F18) ✅
- `PlaybackProvider` interface i `src/quiz/playback/types.ts`
- `HomeControllerProvider` wrapper (zero behavior change)
- `MusicKitWebProvider` (server→browser WS proxy)
- `ProviderManager` med fallback chain
- Engine + ws-handler bruger provider — ingen direkte `sendHomeCommand`

### MusicKit JS Browser Playback (F17) ✅
- Apple Music afspilning direkte i browser via MusicKit JS CDN
- Developer token endpoint: `GET /quiz/api/musickit-token`
- Auth flow: Apple login popup, cookies delt mellem sider
- AirPlay picker i Safari (finder MusicKit's audio element)
- Virker uden Home Controller — cross-platform

### Universal Player (`player.js`) ✅
- Én fil, bruges af alle sider (Admin, Builder, Host)
- `Player.play(songId, name, artist)` — router til MusicKit JS eller HC
- `Player.pause()`, `.resume()`, `.togglePlayPause()`, `.stop()`
- `Player.getState()` — returnerer track info fra aktiv provider
- `Player.onUpdate(callback)` — fyrer kun ved state change
- `Player.showAirPlayPicker()` — Safari native
- Optimistisk UI-opdatering ved pause/play (instant feedback)
- Provider preference i localStorage, synkes til server ved page load

### Admin Hub (tabbed layout) ✅
- **Audio Setup** fast i top: provider toggle (MusicKit JS / Home Controller), mini player
- **Mini Player**: artwork, track, artist, progress, play/pause/next/stop
- **Tabs**: Recently Played | Playlists | Favorites | Quiz
- **Recently Played**: auto-opdaterer ved track change (ingen reload)
- **Playlists**: opret (inline), expand tracks, Play All, Start Quiz, delete
- **Favorites**: hjerte-knap (SVG) overalt, dedikeret tab med grid/list
- **Now Playing overlay**: embedded vinyl sphere, ESC lukker
- Alle tabs in-page — musik stopper aldrig

### Host Cleanup ✅
- Kun "Admin" i nav (fjernet DJ Mode, Now Playing links)
- Now Playing screen: fuld vinyl sphere med glow/grooves (Player-drevet)
- Ingen ghost DJ Mode ved fresh load (fjernet `dj_status` poll)

### Now Playing ✅
- Standalone side (`/quiz/now-playing`): read-only display via WebSocket
- Embedded i Host: Player-drevet, interpoleret tid
- Embedded i Admin: overlay med vinyl sphere
- Server push fra MusicKit JS + HC polling (saniteret endpoint)
- Smooth interpolation (kun resync ved position change)

## Næste opgave: Global Search (F20)

Læs `docs/features/F20-global-search.md` for spec.

### Kort resumé

**Cmd+K command palette** med Apple Music search:
- Søg kunstnere, albums, sange
- Klik artist → **Artist Page** (top songs + albums)
- Klik album → **Album Page** (track list med play/fav/add-to-playlist)
- Klik sang → afspil + tilføj til playlist
- Hash-routing inden for Admin (`#artist/123`, `#album/456`)
- Erstatter inline playlist search (allerede fjernet)

### API der skal tilføjes
- `GET /quiz/api/artist/:id` → artist info + top songs + albums

### Eksisterende API der genbruges
- `GET /quiz/api/builder/search?q=...` → returnerer artists, albums, songs
- `GET /quiz/api/builder/album/:id/tracks` → album tracks

### Design reference
- Apple Music web search (artists med cirkulært artwork, albums, songs)
- WebHouse CMS command palette (Cmd+K overlay med sektioner)

### Filer der skal ændres
- `src/quiz/public/admin.html` — Cmd+K overlay + artist/album pages
- `src/quiz/public/admin.css` — styling for search, artist page, album page
- `src/quiz/routes.ts` — artist endpoint

## Kendte issues at fixe
- **Play fra Recently Played** virker muligvis ikke konsekvent (inline onclick escaping)
- **Inline search fjernet fra Playlists** — venter på Cmd+K
- **Builder standalone** (`/quiz/builder`) eksisterer stadig men er deprecated
- **Next Song** virker men kan have timing issues med HC (3s poll delay)

## Vigtigt
- Læs CLAUDE.md for hard rules (ingen fuzzy, ingen fade-volume, etc.)
- `player.js` er den universelle Player — brug den overalt
- Provider toggle gemmes i localStorage `preferred-provider`
- Home Controller startes separat: `source .env && MCP_WS_URL=ws://localhost:3000/home-ws HOME_API_KEY=$HOME_API_KEY node home/dist/server.js`
- Server: `NODE_ENV=development node server.js`
- MUTE_ALL=true i .env for stille test
