Foreslået feature-opdeling

  ┌───────────────────────────┬───────────────┬───────────┬──────────────────────────────────────────────────────────┐
  │          Feature          │      Fra      │ Prioritet │                       Beskrivelse                        │
  ├───────────────────────────┼───────────────┼───────────┼──────────────────────────────────────────────────────────┤
  │ F17: MusicKit JS Playback │ P1            │ 🔴 Høj    │ Browser-baseret Apple Music afspilning, erstatter Home   │
  │                           │               │           │ Controller som primær                                    │
  ├───────────────────────────┼───────────────┼───────────┼──────────────────────────────────────────────────────────┤
  │ F18: Playback Provider    │ P1+P2         │ 🔴 Høj    │ PlaybackProvider interface — foundation for              │
  │ Abstraction               │               │           │ multi-provider                                           │
  ├───────────────────────────┼───────────────┼───────────┼──────────────────────────────────────────────────────────┤
  │ F19: Party Session        │ Netop done    │ ✅ Done   │ Event → Rounds, immutable playlist, picks akkumulerer    │
  ├───────────────────────────┼───────────────┼───────────┼──────────────────────────────────────────────────────────┤
  │ F20: Spotify Support      │ P2            │ 🟡 Medium │ Web Playback SDK + OAuth PKCE + song resolver            │
  ├───────────────────────────┼───────────────┼───────────┼──────────────────────────────────────────────────────────┤
  │ F21: Movie/TV Quiz        │ MOVIE-QUIZ.md │ 🟡 Medium │ TMDB, film-citater, soundtrack-afspilning                │
  ├───────────────────────────┼───────────────┼───────────┼──────────────────────────────────────────────────────────┤
  │ F22: User Auth            │ P4            │ 🟡 Medium │ Magic link email, bruger-database                        │
  ├───────────────────────────┼───────────────┼───────────┼──────────────────────────────────────────────────────────┤
  │ F23: Billing (Stripe)     │ P4            │ 🟠 Lav    │ Tiers, Stripe Checkout, plan enforcement                 │
  ├───────────────────────────┼───────────────┼───────────┼──────────────────────────────────────────────────────────┤
  │ F24: Landing Page         │ P4            │ 🟠 Lav    │ Branding, eget domæne, go-to-market                      │
  └───────────────────────────┴───────────────┴───────────┴──────────────────────────────────────────────────────────┘
  
  Men det her er et godt tidspunkt at stoppe op og tænke over helheden i stedet for at lappe videre. Vi har:

  - Admin med mini player, provider toggle, Now Playing overlay
  - Host med quiz, DJ Mode, embedded Now Playing
  - Builder med playback
  - Standalone Now Playing
  - Player.js der binder det sammen

  Det virker, men det er vokset organisk og der er overlap og rod. Skal vi tage en pause fra nye features og lave en UI
  cleanup session næste gang? Rydde op i navigation, fjerne døde skærme, gøre flowet klart:

  1. Admin = setup + musikafspiller + recently played
  2. Host = quiz + DJ Mode + Now Playing (kun under Event)
  3. Builder = playlist curation
  4. Player = telefon PWA
  
  Root / - Altid "Now playing"
  Tilgængelige menupunkter (Admin - checker om jeg er logged ind, ja - videre, nej login)
  Hvis intet spiller og ingen HC er installeret på maskine der besøger root skal vi have onboarding (den venter vi med)
  
  Admin (new tabbed menu)
  - Audio setup (Controller switch skal måske være synlig hele tiden)

  MENUER
  - Recently played (default menu/list/grid)
  - Playlists (Music Quiz playlists ikke fra brugerens Apple/Spotify profil) - Add playlist to Quiz Builder () 
  - Favorites (List/Grid) - numre kan tilføjes til Playlists
  - Quiz Builder (Curated quiz lists) - Load in new quiz (går til Quiz/Host med list loaded)
  - Quiz (Events (Create (name, date, description, fixed num rounds/free), Planned events Start -> Music Quiz) - Quiz Now (single round) Host, DJ Mode, Game - the works) - har kun Admin som menu i top - 
  - Cmd + K search i admin player finder kunstnere, albums, numre - resultat viser artist (Artist page med Top songs og albums) - Numre eller hele albums kan tilføjes til en Playlist/Favorites og et nummer kan afspilles (starter i MP i admin)
  
  DJ Mode (Inherits Event or QuizNow (single round no event))
  - Now playing
  - Mini player, samme som admin med pause, stop, next song (mangler på MP)
  - Autoplay (Toggle)
  - New Round
  - End Event
  
  Player = telefon PWA (as is for now)
  
  