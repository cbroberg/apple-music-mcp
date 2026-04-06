# Next Session — Features Focus

## Status snapshot

Music Quiz v3.0+ er **production-klar** for Saturday party. Refactor + playback + bank-udvidelser fra 2026-04-06 sessionen er pushed til main. Se [SESSION-RESUME-2026-04-06.md](./SESSION-RESUME-2026-04-06.md) for fuld resumé.

**Banks:** 1067 trivia questions (695 global + 155 gossip + 124 dansk + 148 soundtrack).

## Næste fokus: FEATURES

Vi er færdige med fixing — nu bygger vi det der gør spillet vildere. Tre prioriterede tracks:

---

### 🌍 Track 1: Country Banks (F21) — quick win

**Mål:** Replikere dansk-mønstret til 3-4 andre lande så vi kan tilbyde "Svensk Musik", "Britisk Musik" osv.

**Pattern (kopiér fra dansk):**
1. Skab `src/quiz/data/artists-{xx}.json` — flat array af kuraterede kunstnere (50-100 per land)
2. Tilføj source case i `src/quiz.ts` switch (eller generaliser dansk-case til at tage country param)
3. Pre-cache via script: `node scripts/cache-{xx}-songs.js`
4. Tilføj source option i admin.html dropdown
5. Test med E2E

**Forslag (prioritet):**
- 🇸🇪 **Svensk** — ABBA, Avicii, Roxette, Robyn, Tove Lo, Zara Larsson, Swedish House Mafia, The Cardigans, First Aid Kit, Lykke Li
- 🇬🇧 **Britisk** — Beatles, Stones, Bowie, Queen, Adele, Ed Sheeran, Coldplay, Oasis, Spice Girls, Amy Winehouse
- 🇺🇸 **Amerikansk** — Elvis, Dylan, Springsteen, Madonna, Beyoncé, Taylor Swift, Eminem, Jay-Z, Kanye, Drake
- 🇩🇪 **Tysk** — Kraftwerk, Rammstein, Scorpions, Tokio Hotel, Modern Talking, Nena, Helene Fischer

**Effort:** ~2 timer per land (curated list + cache + test). Total: 1 dag for 3-4 lande.

**Filer at oprette:**
- `src/quiz/data/artists-se.json`
- `src/quiz/data/artists-uk.json`
- `src/quiz/data/artists-us.json`
- `data/artist-songs-{xx}.json` (efter cache run)
- Eventuelt: `src/quiz/data/country-config.json` med fælles definition

**Engine refactor (anbefalet):** Lav `dansk` case generisk: `case "country": loadCountryArtists(config.country)`. Source IDs som `country:dk`, `country:se`, etc.

---

### 👤 Track 2: User Profiles (F22 fase 1) — fundamentet

**Mål:** Persistente bruger-konti så folk genkendes på tværs af sessioner.

Se [docs/features/F22-personalized-quiz-pool.md](./features/F22-personalized-quiz-pool.md) for fuld spec.

**Fase 1 — kun profile system, INGEN Apple Music endnu:**
1. **Data model:**
   ```typescript
   interface UserProfile {
     id: string;
     email?: string;
     displayName: string;
     avatar: string;
     createdAt: string;
     lastSeenAt: string;
     stats: { quizzesPlayed: number; totalCorrect: number; totalAnswers: number };
   }
   ```
2. **Storage:** `data/user-profiles.json` (samme pattern som events/playlists)
3. **API endpoints:**
   - `POST /quiz/api/profiles` — opret profil
   - `GET /quiz/api/profiles/:id` — hent profil
   - `PUT /quiz/api/profiles/:id` — opdater
   - `GET /quiz/api/profiles/by-email/:email`
4. **Player join flow:** Når en spiller joiner, tjek om de har en profil baseret på navn/email → genbrug
5. **Stats tracking:** Efter hver quiz, opdater profil's stats
6. **UI:** Player PWA tilføjer "Mit profil" view (stats, history)

**Effort:** ~4-6 timer

---

### 🎵 Track 3: Apple Music Library Mix (F22 fase 2) — wow factor

**Mål:** Connectede brugere bidrager med 10-20% af quiz songs fra deres eget bibliotek.

**Forudsætter Track 2 (profiles).**

1. **Apple Music auth flow** på profile setup side (MusicKit JS, vi har allerede tokens)
2. **Library snapshot** ved første connect:
   - Hent `/me/library/songs` (paginated, top 100-500)
   - Hent `/me/ratings/songs` (eksplicitte favoritter)
   - Hent `/me/recent/played`
   - Top 50 unique artister + favoritter gemmes i profil
3. **Quiz engine integration:**
   - Tjek om party har deltagere med library snapshots
   - Inject 15% personlige spørgsmål (`personalCount = floor(count * 0.15)`)
   - Format: "This song is from [Christian]'s library — what's the title?"
4. **Ny spørgsmålstype:** `guess-the-owner` — "Whose favorite is this?"
5. **UX:** Personlige spørgsmål viser ejer-avatar i UI

**Effort:** ~1-2 dage

---

## Andre features klar til pickup

| Priority | Feature | Effort |
|---|---|---|
| Medium | Email invites til events (AWS SES) | 4t |
| Medium | Mobile responsive admin (iPad host) | 4t |
| Medium | "Guess-the-owner" spørgsmålstype | 6t (del af F22) |
| Low | Quiz history per spiller | 6t |
| Low | Spotify integration (parallel til Apple Music) | 1-2 dage |

## Kendte tech debt

- Q18-20 timeouts i nogle quiz sources (dedup mangler i pool sent i runden)
- Recently Played artwork mangler for ældre indgange
- Player.js + MusicKit init race (mitigeret med `_waitForMk` men ikke 100% bulletproof)

## Hvor skal du starte?

**Anbefaling:** Track 1 (Svensk + Britisk) først — én dag, stor påvirkning, viser brugerne flere "verdener". Derefter F22 fase 1 (profile system) som forberedelse til den store F22-fase 2.

Eller hvis Saturday party er meget tæt: skip features, fokus på **edge case fixes** (Q18-20 timeouts, RP artwork backfill, MusicKit init race).

## Hard rules (fra CLAUDE.md)

1. Fortæl brugeren hvad du laver FØR du laver det
2. ALDRIG fuzzy søgning i playback — exact match eller alternative swap
3. ALDRIG fade-volume
4. Playlist immutable under en party
5. Vanilla HTML/JS for quiz UI (tvOS WebView compat)
6. Now Playing er read-only (viser kun host'ens state)
7. Én connect-knap (Apple Music via Admin)
8. ALDRIG native confirm/alert/prompt — brug custom dark-theme dialogs
9. **Ingen quick-fixes** — fix root cause
10. Sikkerhed: alle exposed services skal have auth

## Quick start commands

```bash
# Server (HC fallback)
NODE_ENV=development node server.js

# E2E source matrix (6 sources × 20 questions, ~35 min)
node scripts/e2e-source-matrix.js

# Single dansk verification (15 questions, ~5 min)
node scripts/e2e-dansk-50.js

# Trivia bank stats
curl -s http://localhost:3000/quiz/api/admin/stats | python3 -m json.tool
```

## Files at kende

- `src/quiz.ts` — quiz generation, source switch (`dansk`, `mixed`, `charts`, `live`, etc.)
- `src/quiz/engine.ts` — game flow, question selection, AI trivia injection
- `src/quiz/ai-enricher.ts` — Haiku trivia gen + Sonnet fact-check
- `src/quiz/public/admin.html` — single-page admin (tabs + quiz overlay)
- `src/quiz/public/quiz-display.js` — quiz UI module (7 screens)
- `src/quiz/data/artists-dk.json` — 115 dansk kunstnere (template for nye lande)
- `data/artist-songs-dk.json` — pre-cached song data (template)
- `data/quiz-trivia-dk.json` + `quiz-trivia-soundtrack.json` — specialized banks
- `scripts/cache-dansk-songs.js` — pre-fetch artist songs (template)
- `scripts/append-*.js` — Opus-curated content batches (gossip, soundtrack, trivia)
