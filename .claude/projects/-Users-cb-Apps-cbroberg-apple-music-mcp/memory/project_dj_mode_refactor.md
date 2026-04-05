---
name: DJ Mode Admin Refactor
description: DJ Mode skal flyttes fra host-skærmen til admin tab-systemet — prioritet efter lørdag quiz party
type: project
---

DJ Mode kører i dag fra host.html (screen-dj). Brugeren vil have det integreret i admin.html tab-systemet i stedet, så DJ Mode styres fra Admin UI ligesom alt andet.

**Why:** Host-skærmen er til storskærm/TV — DJ Mode controls hører hjemme i Admin hvor man styrer alt andet. Host bør kun vise Now Playing under DJ Mode.

**How to apply:** Stort refactor — flyt DJ Mode UI (queue, picks, autoplay, End Event) til en DJ tab i admin. Host viser kun Now Playing vinyl under DJ Mode. WebSocket events skal routes til admin i stedet for host.
