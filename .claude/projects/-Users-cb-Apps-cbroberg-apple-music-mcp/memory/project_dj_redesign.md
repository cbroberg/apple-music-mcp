---
name: DJ Redesign v4.0
description: Complete DJ redesign — moves to admin as first tab, persistent WS tokens, song credits survive rounds, simplified controls
type: project
---

## DJ Redesign v4.0

### Navneændringer
- "DJ Mode" → **"DJ"**
- "Picks" → **"Song Credits"**
- DJ er en aktiv kø (queue) af musik

### To kilder til DJ-køen
1. **Quiz Master / DJ** vælger numre manuelt (søgning, playlists → "Add to DJ")
2. **Demokratiske song credits** fra quiz-deltagere efter quiz rounds

### Admin er centrum

- **DJ tab er FØRSTE tab** (før Recently Played)
- Tab-rækkefølge: DJ → Recently Played → Playlists → Favorites → Quiz → Setup
- Mini player altid synlig i admin header (kan expandere til "maxi player" med artwork, play/pause/stop)
- Levende picks/credits-liste med bruger-tags/pills over listen
- DJ kan selv tilføje numre via søgning (nyt mål: Search → DJ)
- Hvem der har tilføjet nummeret vises ved hvert nummer

### Host = Quiz ONLY

- Host viser KUN quiz screens (lobby → countdown → playing → reveal → scoreboard → ceremony)
- **Ingen Now Playing på host under quiz** — det er ikke relevant
- **Ingen DJ controls på host** — alt styres fra Admin
- Efter ceremony: to knapper → "New Quiz" eller "DJ" (sender til admin DJ tab)

### Spillere (PWA)

- Kan ALTID søge og tilføje sange når:
  1. Ingen quiz er i gang
  2. De har optjente song credits
- Song credits optjenes ved at fuldføre quiz rounds
- Credits overlever mellem runder og quiz sessions

### Game Server kører konstant

- Holder track på: WS connections, alle spillede sange, antal runder, song credits
- Intern round counter (automatisk, rounds++)
- **Ingen "End Event" knap** — eventet lever så længe game server kører
- **Ingen "New Round" knap** — game master starter ny quiz fra admin når klar
- Events bruges til markedsføring (push game-kode via SMS/mail/Discord)

### WS Token / Player Persistence

**Problem i dag:** Mobil slukker skærm → WS disconnects → credits væk → bruger låst fast.

**Løsning:**
- Ved QR-scan/kode-indtastning: generer persistent token (localStorage + server-side)
- Token overlever page refresh, skærm-sluk, browser-genåbning
- PWA re-connecter automatisk med token → server genkender bruger → pusher state
- Song credits gemmes server-side knyttet til token (ikke WS connection)
- Server kan pushe til spillerens skærm så snart de er synlige igen
- Kontrollerer hvad der vises — spillere bliver aldrig låst fast

**Hvad bryder WS chain:**
- Lukker siden → WS lukkes, MEN token i localStorage → re-connect ved genåbning
- Skærm slukkes → WS lukkes efter ~30s → re-connect ved genåbning
- Force-close browser → samme som lukker siden
- **Ingen af disse mister song credits** — credits er server-side

### Flow

1. Event markedsføres (QR, SMS, mail, Discord) → folk scanner → PWA med token
2. Game master starter quiz fra Admin → spillere ser lobby automatisk
3. Quiz kører → ceremony → song credits awarded (server-side, knyttet til token)
4. Game master vælger "DJ" → admin DJ tab → ser credits-liste, kan tilføje egne numre
5. Spillere søger og tilføjer sange med deres credits
6. Game master starter ny quiz → rounds++ → nye credits lægges oven i

### Kritiske bugfixes fra quiz party (P0)
- **DJ autoplay trampler quiz:** DJ kø autoplay SKAL stoppes/pauses under quiz. Løses naturligt ved at DJ er i admin, ikke host
- **checkLibrary broken med MusicKit JS:** Skip verify helt med MusicKit (allerede delvist fixet)
- **Gossip faktuelle fejl:** Re-run Sonnet fact-check, fjern forkerte
- **Forkerte sangversioner:** Filtrer acoustic/radio edit/live versions
- **AI hallucination 42%:** Bed Haiku om IKKE at opfinde 2026-fakta
