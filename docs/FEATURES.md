# Music Quiz — Feature List

**Last updated:** 2026-04-03

---

## Legend

- **Done** — shipped and working
- **In progress** — actively being built
- **Planned** — designed, ready to build
- **Idea** — needs design/spec work

---

## Features

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| F01 | [Multiplayer Quiz Engine](#f01-multiplayer-quiz-engine) | Done | WebSocket game engine, join codes, QR, real-time scoring |
| F02 | [AI Answer Evaluation](#f02-ai-answer-evaluation) | Done | Claude haiku evaluates free-text answers, generous with spelling |
| F03 | [Custom Quiz Builder](#f03-custom-quiz-builder) | Done | Search Apple Music catalog, curate playlists, save/load |
| F04 | [DJ Mode](#f04-dj-mode) | Done | Music democracy — players earn picks, shared queue, autoplay |
| F05 | [Library Cleanup](#f05-library-cleanup) | Done | Track quiz-added songs, osascript delete on DJ Mode end |
| F06 | [Steal Round](#f06-steal-round) | Planned | Wrong answers open for steal by other players |
| F07 | [All-In Round](#f07-all-in-round) | Planned | Double-or-nothing — risk current score on confidence |
| F08 | [Sound Clash](#f08-sound-clash) | Planned | 1v1 head-to-head elimination bracket |
| F09 | [Blind Round](#f09-blind-round) | Planned | No multiple choice — pure free-text, harder scoring |
| F10 | [Playlist Battle](#f10-playlist-battle) | Planned | Teams build playlists, audience votes |
| F11 | [Home Controller App](#f11-home-controller-app) | Planned | Standalone macOS app with UI, status, controls |
| F12 | [Lyrics Display](#f12-lyrics-display) | Idea | Show synced or static lyrics on Now Playing |
| F13 | [tvOS App](#f13-tvos-app) | Idea | Apple TV companion — host display on big screen |
| F14 | [Spotify Support](#f14-spotify-support) | Idea | Alternative music source for non-Apple users |
| F15 | [Tournament Mode](#f15-tournament-mode) | Idea | Multi-round tournament with brackets and finals |
| F16 | [Party Themes](#f16-party-themes) | Idea | Visual themes (80s neon, rock, jazz club, etc.) |
| F17 | [MusicKit JS Playback](features/F17-musickit-js-playback.md) | Planned | Browser-based Apple Music — no Mac/Home Controller needed |
| F18 | [Playback Provider Abstraction](features/F18-playback-provider-abstraction.md) | Planned | Provider interface for swappable playback engines |
| F19 | [Party Session (Events)](features/F19-party-session.md) | Done | Event → Rounds, immutable playlist, picks accumulate |
| F20 | [Global Search](features/F20-global-search.md) | Planned | Unified search across catalog, library, playlists |
| F21 | [Hum It / Sing It](features/F21-hum-it.md) | Idea | Players sing/hum into mic, others guess the song |
| F22 | [Time Machine](features/F22-time-machine.md) | Idea | Drag slider to guess release year — continuous scoring |
| F23 | [Cover vs. Original](features/F23-cover-vs-original.md) | Idea | Spot the original, identify the cover artist |
| F24 | [Genre Roulette](features/F24-genre-roulette.md) | Idea | 4-layer progressive reveal: genre → decade → artist → song |
| F25 | [Music Map](features/F25-music-map.md) | Idea | Pin artist origin on world map — distance-based scoring |
| F26 | [Setlist Challenge](features/F26-setlist-challenge.md) | Idea | Guess next track on album or in artist catalog |
| F27 | [Mashup Round](features/F27-mashup-round.md) | Idea | Two songs play simultaneously — identify both |
| F28 | [Audience Mode](features/F28-audience-mode.md) | Idea | Spectator voting, predictions, reactions for large events |
| F29 | [Ear Trainer](features/F29-ear-trainer.md) | Idea | Progressive playback: 1s → 3s → 5s → 10s — shorter = more points |
| F30 | [Stats & Replay](features/F30-stats-replay.md) | Idea | Personal quiz history, genre radar, achievements, shareable results |

---

## Feature Details

### F01: Multiplayer Quiz Engine
**Status:** Done

- WebSocket real-time communication (host ↔ server ↔ players)
- 6-character join codes (excluding confusing chars I/O/0/1)
- QR code with LAN IP auto-detection
- Kahoot-style scoring: 1000pts max, linear time decay
- Streak bonuses: 1.5x after 3, 2x after 5 correct
- Game states: lobby → countdown → playing → evaluating → reveal → scoreboard → finished
- Max 8 players per session
- Question types: guess-the-artist, guess-the-song, guess-the-album, guess-the-year, intro-quiz
- Music sources: charts, recently-played, library, genre, live, mixed (6 parallel fetches)

### F02: AI Answer Evaluation
**Status:** Done

- Claude haiku batch-evaluates all player answers in a single API call
- Generous with spelling, abbreviations, partial matches
- Provides explanations for incorrect answers
- Used for free-text answer mode

### F03: Custom Quiz Builder
**Status:** Done

- Two-panel layout: search (left) + playlist (right)
- Search songs and albums from Apple Music catalog
- Album expansion with per-track add
- Mini now-playing bar with equalizer animation
- Save/load custom playlists (persisted to disk as JSON)
- Custom modals for save/load/confirm (no browser alerts)

### F04: DJ Mode
**Status:** Done

- Activated after quiz ends — players use earned picks to queue songs
- Pick distribution: #1=5, #2=3, #3=2, rest=1, streak bonus +1
- Queue shuffling: new songs inserted at random position among unplayed
- Autoplay detection via now-playing polling (2s interval, position-based)
- Wake Lock API keeps player screens on
- Player reconnect preserves picks and queue state
- Host controls: next, remove, autoplay toggle

### F05: Library Cleanup
**Status:** Done

- Tracks every song added to library via `addToLibrary` (name + artist)
- `delete-from-library` osascript command removes songs from local Music.app
- Only deletes songs that were added by the quiz system, never user's own music
- Admin API endpoint: `POST /quiz/api/admin/cleanup-library`

### F06–F16: See individual descriptions below

### F06: Steal Round — Planned
After the main question timer ends, players who got the wrong answer can "steal" by answering again within a short window. Correct steals earn partial points.

### F07: All-In Round — Planned
Before answering, players choose to go "all-in" (risk 50% of current score for 2x points) or play safe (normal points). High-risk, high-reward.

### F08: Sound Clash — Planned
Two players go head-to-head. Both hear the same song snippet. First correct answer wins. Loser is eliminated. Bracket-style tournament.

### F09: Blind Round — Planned
No multiple choice options — pure free-text answers only. Harder but more rewarding. AI evaluation required for all answers.

### F10: Playlist Battle — Planned
Teams build playlists from their picks. Songs are played, and the opposing team + audience votes. Best playlist wins bonus points.

### F11: Home Controller App — Planned
Standalone macOS app replacing the CLI-only Home Controller. See [feature doc](features/F11-home-controller-app.md).

### F12: Lyrics Display — Idea
Show lyrics on the Now Playing page (Apple Music API, Musixmatch, or Genius).

### F13: tvOS App — Idea
Apple TV companion app for big screen display. See [QUIZ-PLAN.md](QUIZ-PLAN.md) fase 2.

### F14: Spotify Support — Idea
Alternative music source via Spotify Web Playback SDK. See [QUIZ-PATCH-001.md](QUIZ-PATCH-001.md) P2.

### F15: Tournament Mode — Idea
Multi-round tournament with group stages, semi-finals, and finals.

### F16: Party Themes — Idea
Visual themes: 80s Neon, Rock, Jazz Club, Disco.

### F17–F20: See individual feature docs in `docs/features/`

### F21: Hum It / Sing It — Idea
Players sing/hum a song via phone mic, others guess. MediaRecorder API, WebSocket audio streaming. See [feature doc](features/F21-hum-it.md).

### F22: Time Machine — Idea
Drag slider to guess release year. Continuous scoring based on distance. See [feature doc](features/F22-time-machine.md).

### F23: Cover vs. Original — Idea
Two versions of same song — spot the original or identify the cover artist. See [feature doc](features/F23-cover-vs-original.md).

### F24: Genre Roulette — Idea
4-layer progressive reveal per song: genre → decade → artist → title. 250 points per layer. See [feature doc](features/F24-genre-roulette.md).

### F25: Music Map — Idea
World map quiz — pin where the artist is from. Haversine distance scoring. Leaflet.js + OpenStreetMap. See [feature doc](features/F25-music-map.md).

### F26: Setlist Challenge — Idea
Play 3-4 tracks from an album, guess the next one. Tests deep album knowledge. See [feature doc](features/F26-setlist-challenge.md).

### F27: Mashup Round — Idea
Two songs play simultaneously or in quick switches — identify both. Double points. See [feature doc](features/F27-mashup-round.md).

### F28: Audience Mode — Idea
Spectators join via `/quiz/watch` — predictions, voting, emoji reactions. Scales events to 50+ people. See [feature doc](features/F28-audience-mode.md).

### F29: Ear Trainer — Idea
Progressive playback: 1s → 3s → 5s → 10s → 15s → 30s. Shorter clip = more points. Heardle-style but multiplayer. See [feature doc](features/F29-ear-trainer.md).

### F30: Stats & Replay — Idea
Post-quiz stats (genre radar, streaks, speed), persistent history, achievements, shareable results. See [feature doc](features/F30-stats-replay.md).
