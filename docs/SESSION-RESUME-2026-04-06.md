# Session Resume — 2026-04-06

## Hovedopgaver løst

### 🎯 Refactor: Single-page admin (MusicKit dør ikke)
- Merged quiz display ind i admin.html som overlay
- `quiz-display.js` — selvstændig modul med alle 7 quiz-skærme
- Host.html udfaset → redirecter til admin
- Én MusicKit instans, ingen navigation = ingen playback-død
- WS keepalive (30s ping) forhindrer idle disconnects

### 🎵 Playback fixes
- `Player.playExact()` + `searchAndPlay()` tilføjet til player.js (manglede)
- `_waitForMk()` gate venter på MusicKit init før playback commands
- Admin disconnect cleanup: `setSendToHost` re-routes til næste aktive admin
- `dj_play_current` sender play uden at advance køen
- `markCurrentFailed()` ved playback fejl (retry-friendly)
- `playDjSong` returnerer success/fail

### 🇩🇰 Dansk Musik (kuraterede liste)
- `src/quiz/data/artists-dk.json` — 115 danske kunstnere (Carl Nielsen → Tobias Rahim)
- `data/artist-songs-dk.json` — pre-cached 673 sange fra 111 kunstnere
- `dansk` source bruger cache (ingen runtime API calls)
- Verificeret: 100% danske matches i E2E test

### 🧠 Trivia banker udvidet
- **Global trivia:** 666 → 695 (+29 fra matrix test)
- **Dansk trivia:** 0 → 124 (Sonnet generated + Opus curated)
- **Soundtrack trivia:** 0 → 148 (Opus curated, fuld Tarantino + Nolan dækning)
- **Gossip:** 100 → 155 (+55 Opus curated)
- **TOTAL:** 1067 spørgsmål

### 🎬 Tarantino + Nolan komplet dækning
| Tarantino | Nolan |
|---|---|
| Pulp Fiction (15), Kill Bill (14), Django (10), Reservoir Dogs (7), OUATIH (6), Jackie Brown (5), Death Proof (4), Inglourious (4), Hateful Eight (3) | Interstellar (11), Dark Knight (10), Inception (10), Tenet (8), Dunkirk (7), DK Rises (3), Prestige (3), Oppenheimer (3), Memento (2), Batman Begins (2), Insomnia (1) |

### 🧪 E2E Test Infrastructure
- `scripts/e2e-source-matrix.js` — persistent 6-source matrix (samme 3 spillere)
- `scripts/e2e-dansk-50.js` — Danish-only verification
- `scripts/e2e-admin-quiz.js` — single quiz flow med `--mute --headless` flags
- Runtime mute via `POST /quiz/api/mute` (ingen env var, ingen restart)

### 📊 Recently Played
- Cap hævet 100 → 500
- Persisteret til disk med artwork
- Engine logger tracks i mute mode (for E2E)
- Bruger track change log, ikke Apple Music API (var altid tom)

### 🎨 Admin UI forbedringer
- Stats dashboard viser alle 4 trivia banks (global, gossip, dansk, soundtrack)
- DJ tab header viser track count (matcher RP stil)
- Playlist tracks har ··· menu med "Add to DJ"
- Admin Setup tab har audio output detection

### 🗑️ Cleanup
- Slettet 8 historiske `trivia-batch-*.json` filer (alle 413/416 spørgsmål allerede i main bank)
- Slettet `data/danish-artists.json` (duplikat)
- Normaliseret alle data filer til flat array struktur
- Fjernet dual-parsing fallback kode

## Arkitektur snapshot

```
admin.html (én side, MusicKit alive)
  ├─ Tabs: DJ | Quiz | Recently Played | Playlists | Favorites | Setup
  ├─ Quiz overlay (fullscreen, hides admin)
  │   └─ quiz-display.js (alle 7 skærme)
  ├─ Mini player (bottom)
  └─ Admin WS (registers as admin + host on create_session)

server.js → routes.ts + ws-handler.ts
  ├─ Quiz engine (engine.ts → quiz.ts)
  ├─ DJ mode (persistent dj-state.json)
  ├─ Playback providers
  │   ├─ MusicKitWebProvider (browser via WS)
  │   └─ HomeControllerProvider (osascript via /home-ws)
  ├─ Banks
  │   ├─ quiz-question-bank.json (695 global trivia, grows)
  │   ├─ quiz-gossip-bank.json (155 gossip, grows)
  │   ├─ quiz-trivia-dk.json (124 dansk, statisk)
  │   └─ quiz-trivia-soundtrack.json (148 soundtrack, statisk)
  └─ Caches
      ├─ artist-songs-dk.json (673 sange)
      └─ track-log.json (Recently Played, 500 cap)
```

## Test resultater (matrix test)

| Source | Result | Q# | Tid |
|---|---|---|---|
| Mixed | ✅ 20/20 | OK | 338s |
| Top Charts | ⚠️ 18/20 | OK | 368s |
| Jazz | ⚠️ 18/20 | OK | 370s |
| Movie Soundtracks | ⚠️ 17/20 | OK | 380s |
| Danish Music | ⚠️ 19/20 | OK | 355s |
| Live Music | ⚠️ 15/20 | OK | 418s |

**Total:** 107/120 spørgsmål spillet, 0 crashes, RP voksede 211 → 318 (+107).

## Kendte issues

1. **Q18-20 timeouts** — sidste par spørgsmål timer ud i nogle quizzer pga. dedup/song pool sent i runden. Ikke en bug, men en degradering.
2. **Recently Played artwork** — gamle indgange mangler artwork (logget før artwork-fix). Nye er fine.
3. **MusicKit auth race** — første playback command efter page load kan fejle hvis MusicKit ikke er initialiseret endnu (mitigeret med `_waitForMk` 5s wait).

## Commits denne session

```
03635b0 feat: +55 Opus-curated gossip questions
086e73c feat: full Tarantino + Nolan soundtrack trivia coverage
5172d30 chore: delete historical trivia batch files
8ed8af9 chore: normalize artist data to flat array
677ee92 feat: Danish artist bank + soundtrack trivia + source matrix testing
eaa89a0 data: add artists-dk.json — 115 Danish artists
9b2ee02 feat: runtime mute toggle — E2E tests without server restart
660d43a refactor: merge quiz display into admin — single page, no MusicKit death
```
