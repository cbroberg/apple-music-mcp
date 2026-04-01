❯ OK, masser af godt, masser af fejl, så hold tungen lige i munden:

[Image #106] Christian på mobil - der er check bokse ud fra hans valg, men de bliver ikke tilføjet under som de gjorde
hos Sanne. Det er som om at det nummer Sanne var hurtig at vælge er i kø allerede og derfor kan Christians valg ikke
vises under hans søgevørktøj. Søgeværktøjet skal vise albums også som i Builder og der skal flere sange med når man
søger på en kunstner. Der bliver også ved med at stå 3 picks left på Christians skærm. Jeg tænker ikke at "Kø" er
vigtigt for Christian på dette tidspunkt, hele skærmen skal bruges til søgning og udvælgelse. Når numre er "indsendt til
 DJ'ens kø, så kan den vise den samlede kø hos christian og når musikken spiller vise Nor playing. Det er vigtigt at
sålænge spilleren har sin browser åben så skal der kommunikeret med Websockets til spilleren, og putter Christian mobil
i lommen et stykke tid er det ok, men hvis han åbner den igen og går tilbage til Music Quiz så skal han sende et ping
til srver om at nu er jeg i live igen og vil gerne se Now playing og mulighed for at kunne se køen.
[Image #107] Sanne og host på 107 - Sanne har valgt sine 6 numre og har også en kø under, det skal som med Christian
først komme senere, hun ar bare først (jeg tester jo for begge). Men se så på Host, den er gal her. Der står Christian 3
 picks (det var det jeg havde vundet men kunne ikke tilføje til kø) og ved Sanne står der 0. Det betyder nok at Sanne
har brugt sine, men jeg tænker at taller skal være det antal vi hver i sær har på køen som spillere. Så snart Christians
 numre kommer på (når det virker), så skal listen shuffle listen.

Knappen Exit game kan jeg ikke se hvad vi skal have der for når vi er i DJ Mode, fpr
  ⎿  [Image #106]
  ⎿  [Image #107]

⏺ Det er super god feedback. Lad mig opsummere hvad jeg forstår skal fikses:

  Player DJ Mode (telefon):
  1. Christians picks tæller ikke ned — "3 picks left" forbliver efter han vælger sange, checkmarks vises men sange
  tilføjes ikke til kø
  2. Skjul kø-sektionen mens spilleren stadig vælger — vis kun søgning og valg. Køen vises først når alle picks er brugt
  3. Album-søgning som i Builder — vis albums + enkelt-sange, flere resultater
  4. Reconnect-logik — hvis telefon går i dvale og vågner, send ping og genoptag DJ Mode med Now Playing + kø

  Host DJ Mode:
  5. Picks-tallet ved spillernavne skal vise antal sange i køen (ikke resterende picks)
  6. Shuffle køen efter alle har tilføjet — bland sangene så det ikke er alle Sannes først, så alle Christians
  7. Fjern Exit Game knap i DJ Mode (irrelevant)

  Root cause for Christians fejl: Sandsynligvis et WebSocket-problem — hans dj_add_song messages når ikke serveren, eller
   getPlayerNameByWsId returnerer tom string fordi hans session-reference er tabt.

  Skal jeg gå i gang med alle 7 punkter?

✻ Crunched for 43s

❯ Ja go og jeg vil lige tilføje at hvis jeg ikke vil se køen men gerne have startskærmen (No playing) vist så kan jeg
klikke på den, men på Now playing skal der være et link tilbage til DJ Mode så vi kan komme tilbage og se køen.

⏺ Forstået — tilføjer:
  8. Now Playing link på player — klik for at se sfæren/now playing, med "Back to DJ Mode" link dér

  Går i gang med alle 8 punkter.

⏺ Først root cause — getPlayerNameByWsId er broken. Den leder i sessions men spilleren kan have disconnected fra quiz
  session:

⏺ Reading 1 file… (ctrl+o to expand)
  ⎿  src/quiz/ws-handler.ts

✳ Fixing DJ Mode issues… (11m 18s · ↓ 246 tokens)
  ⎿  ◼ Fix DJ Mode — 8 issues from testing


  ❯ kan vi tvinge browseren til at holde skærmen tændt indtil brugeren aktivt trykker på luk knappen på siden af
  telefonen (på ipnone)?
  ❯ En ændring til kø kulturen. Efter spillet er afsluttet kan der jo være (som i Christian stilfælde) nogle spillere
  der er langsom om at få tilføjet, det kan være han lige skulle på toilet. Så de andre til festen skal jo ikke sidde
  uden musik fordi han er langsom. Så det først nummer der rammer køen skal bare starte automatisk. Så shuffles der
  mellem alle andre numre, men de numre der har været afspillet shuffles selvfølgelig ikke med så risikerer vi at de
  numre bliver spilet igen og det er jo ikke demokratisk.
  ❯ Som køen er nu, virker det ikke helt som om at den selv starter med næste nummer. [Image #108] Er lige blevet
  færdig med Miles Davis men den starter ikke Georgy Porgy med Toto.
  ❯ Jeg kan se at DJ sjal trykke på Next song, det er faktisk fint, men herfra skal der faktisk være en Autoplay knap
  så DJ (host) også kan være en del ad festen.
  
⏺ OK, der er mange ting. Lad mig samle alt feedback i én liste før jeg gør noget:

  Bugs at fikse:
  1. Christians picks tæller ikke ned + sange tilføjes ikke (root cause: getPlayerNameByWsId er broken)
  2. Host viser "3 picks" / "0 picks" — skal vise antal sange i kø per spiller
  3. Køen auto-starter ikke næste sang

  UX ændringer — Player:
  4. Skjul kø under song-valg, vis kun søgning. Køen vises efter alle picks er brugt
  5. Album-søgning som i Builder
  6. "Now Playing" link → vis sfæren, med "Back to DJ Mode" link
  7. Wake Lock API — hold skærmen tændt

  UX ændringer — Host:
  8. Fjern Exit Game knap i DJ Mode
  9. Første sang starter automatisk når den rammer køen
  10. Shuffle køen (men ikke allerede spillede sange)
  11. Autoplay toggle — så host ikke skal trykke Next Song manuelt
  12. Picks-chips viser antal sange i kø, ikke remaining picks

  Kø-logik:
  13. Første sang starter automatisk
  14. Nye sange shuffles ind blandt ikke-spillede sange
  15. Allerede spillede sange røres ikke

  Skal jeg gå i gang med alle 15?
  
  ⏺ God feedback. Lad mig opsummere hvad jeg ser i screenshots:

    1. Picks enforcement mangler — Christian kan stadig søge og se + knapper selvom han har 0 picks left. Knapperne skal
    disables og søgefeltet låses.
    2. Autoplay virker ikke — musik stoppede efter første nummer, Next Song skal køre automatisk
    3. Host scroll låst — sandsynligvis fordi DJ mode screen har overflow: hidden fra .screen klassen
    4. Player DJ layout trængt — "sammenpresset og forkert" som du siger

    Min plan:
    1. Disable søgefelt + add-knapper når picks er 0
    2. Fix autoplay — efter en sang er færdig (via Home Controller now-playing polling), advance queue automatisk
    3. Fix host DJ screen overflow til overflow-y: auto
    4. Giv player DJ Mode mere plads og bedre spacing

    Autoplay er den sværeste — vi har ingen "song ended" event fra Home Controller. Løsning: poll now-playing og detect når
     state skifter fra "playing" til "stopped/paused", og advance queue.

    Skal jeg gå i gang?
	
Men min pointe er jo at mens alle er i DJ mode dvs. spillelisten er fyldt med dejlige numre, og quiz
  master har IKKE startet et nyt spil, hvorfor pokker skal vi så konstant lytte efter om en spiller skal
  rejoine et spil. Ja vi skal kunne rejoine hvis telefonen har været lukket men vi kan rejoine til DJ
  mode playliste og se køen men når der ikke er et aktivt spil i gang så kan man ALDRIG rejoine et spil.
  Hvis du ikke har fattet det så lad mig skære det ud i pap sådan her, så kan du omskrive det til
  forkromet udvikler sprog:

  1 - Pre-fase: Spillelister laves der kan loades som quiz grundlagt eller vi lader bare random vælge.
  2- Create-game-fase: DJ/Game master har trykket på Create-game og spørgsmål genereres og sange
  valideres/hentes -> Lobby (Join)
  3 - Game fase (vi spiller, der er lukket for join/rejoin)
  4- Winning Ceremony - Vi lytter til Queen og afventer at DJ trykker på DJ Mode. (Vi kan indsætte en
  Auto DJ mode hvis DJ er på toilet, så spillere ikke skal vente på at kunne søge og tilmelde numre til
  playlist)
  5 - DJ Mode - Spillere søger og tilføjer numre (når ingen tilbage kan de kun se kø og Now playing
  (nemt)) - spillere kan "Rejoin" DJ Mode/kø men IKKE Lobby
  6 - Spillelisten er tom (eller lidt før) og DJ kan klargøre et nyt spil og så starter vi forfra, og vi
  kommer til nu at vi skal kunne igangsætte et nyt spil MENS den første og iganvørende DJ mode
  spilleliste stadig spiller.

  Først når Lobby åbner op igen kan en spiller REJOIN som dy ynder at kalde det.

  Så man kan rejoine 2 modes. Game Mode (Lobby og KUN nåt Lobby er ÅBEN) og DJ Mode, er efter spillet
  mens spillelisten kører og indtil der genereres et nyt stil og lobby åbner igen - så jeg kan på INGEN
  måde se nogen form for undskyldning hvorfor vi skal se "glimt" af lobbyen når den er CLOSED.

  Hvis dette ikke er det setup du kører efter så gå i gang med at lave det sådan. Forstår du mig?
  
	
	