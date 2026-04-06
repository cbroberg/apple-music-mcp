# tvOS WebSocket Protocol — `register_display`

> **Status:** Implemented in `packages/quiz-engine/src/ws-handler.ts` (april 2026).
> **Audience:** tvOS Swift client developer. Bind once, render forever.

The tvOS app is a **read-only display client**. It never hosts a quiz, never
mutates state. It registers as a `display`, mirrors everything the host sees,
and (optionally) acts as the MusicKit playback target so songs play through
native `MusicKit.framework` on Apple TV.

---

## 1. Endpoint

```
ws://<host>:3000/quiz-ws            # local dev
wss://music.broberg.dk/quiz-ws      # production
```

Same WS endpoint as host/admin/player. Role is determined by the first
message you send.

---

## 2. Registration

Send this as your **first** message after the socket opens:

```json
{
  "type": "register_display",
  "sessionId": "abc123",      // optional — bind to a specific session
  "partyId": "party-xyz",     // optional — bind to a party (multi-round event)
  "claimPlayback": true       // optional — see §4
}
```

Server replies with:

```json
{ "type": "display_registered", "id": "<your-conn-id>" }
```

If `sessionId` is provided AND that session exists, the server immediately
follows up with a `game_state` snapshot so the display can render without
waiting for the next state change.

You can also register **without** a sessionId (e.g. when the tvOS app boots
before any quiz exists). The display will start receiving broadcasts as soon
as the first session is created and routed.

---

## 3. Inbound messages (server → display)

Display receives **everything** the host receives, plus the player-side
`scoreboard` broadcast. All inbound messages are JSON with a `type` field.

| Type | When | Payload (key fields) |
|------|------|----------------------|
| `display_registered` | After your `register_display` | `id` |
| `game_state` | State transition (lobby → countdown → playing → reveal → scoreboard → finished) | `state`, `question` (HostQuestionData with artwork, options, correctAnswer when revealing), `timeLimit`, `questionNumber`, `totalQuestions`, `roundNumber` |
| `player_joined` | Player joined the session | `playerId`, `playerName`, `avatar` |
| `player_left` | Player disconnected | `playerId`, `playerName` |
| `answer_received` | Any player submitted | `total`, `expected` (use to render "3/5 answered") |
| `question_results` | All answers in for a question | `results[]` with `playerName`, `avatar`, `answer`, `correct`, `points`, `aiExplanation`, `streak`, `totalScore` + the full `question` (with `correctAnswer`, `funFact`, `artworkUrl`) |
| `scoreboard` | Between questions + on finish | `rankings[]` with `rank`, `playerName`, `avatar`, `score`, `streak` |
| `final_results` | Quiz over | `rankings[]` with full stats + `roundNumber` |
| `dj_state` | DJ mode update (queue, picks, current song) | (mirrors host) |
| `error` | You sent a forbidden command | `message` |
| `playback_command` | **Only if** `claimPlayback: true` — see §4 | `commandId`, `command`, `params` |

`HostQuestionData` (sent inside `game_state.question`) contains everything
the display needs to render the question screen including `questionType`,
`questionText`, `options`, `artworkUrl`, `isTrivia`, `funFact`, and (only
during `reveal`/`scoreboard`) `correctAnswer`, `songName`, `artistName`,
`albumName`, `releaseYear`. See `packages/shared/src/types.ts` for the full
TypeScript interface.

---

## 4. Outbound messages (display → server)

**Display is read-only.** Any `create_session`, `start_quiz`, `next_question`,
`kick_player`, `end_party`, `activate_dj`, etc. message will be rejected:

```json
{ "type": "error", "message": "Display connections are read-only — cannot send \"start_quiz\"" }
```

The **only** message a display may send (other than `register_display`) is
`playback_response`, and only if it claimed playback.

### 4.1 Playback claim (`claimPlayback: true`)

When the tvOS client sets `claimPlayback: true` in `register_display`, the
server routes its `MusicKitWebProvider` outbound channel to the tvOS socket.
This is the **same** wire protocol the browser MusicKit JS host uses today —
no new provider, no parallel channel.

#### Server → Display: `playback_command`

```json
{
  "type": "playback_command",
  "commandId": "mk-42",
  "command": "play_exact",
  "params": { "name": "Bohemian Rhapsody", "artist": "Queen", "randomSeek": false }
}
```

Commands you must implement (Swift → `MusicKit.framework`):

| `command` | `params` | Expected `result` shape |
|-----------|----------|-------------------------|
| `play_exact` | `{ name, artist, randomSeek? }` | `{ playing: bool, track?: {name, artist, album, durationMs}, error?: string }` |
| `play_by_id` | `{ songId, seekToPercent? }` | `{ playing: bool, track?: {...}, error?: string }` |
| `pause` | `{}` | `{}` (any) |
| `resume` | `{}` | `{}` (any) |
| `set_volume` | `{ level }` (level is 0..1) | `{}` (any) |
| `now_playing` | `{}` | `{ state: "playing"\|"paused"\|"stopped", track?: {name, artist, album, positionMs, durationMs} }` |
| `check_library` | `{ name, artist }` | `{ found: bool }` |
| `search_and_play` | `{ query }` | `{ playing: bool, track?: {...} }` |

#### Display → Server: `playback_response`

For **every** `playback_command` you receive, send exactly one response with
the matching `commandId`:

```json
{
  "type": "playback_response",
  "commandId": "mk-42",
  "result": { "playing": true, "track": { "name": "...", "artist": "...", "album": "...", "durationMs": 354000 } }
}
```

If you don't respond within ~10s, the server times out and resolves the
provider call with `{ playing: false }` (no error).

#### Authorization

The server marks the provider as authorized as soon as you register with
`claimPlayback: true`. Apple ID / MusicKit user-token authorization happens
**inside the tvOS app** before you set `claimPlayback`. Only register with
the claim once `MusicAuthorization.currentStatus == .authorized` and the
user-token is in hand.

---

## 5. Lifecycle / reconnection

- Sockets idle out — the server pings every 30s. If the tvOS app loses
  network and reconnects, just send `register_display` again.
- A new display connection with the same `sessionId` does **not** kick the
  previous one — multiple tvOS instances on multiple Apple TVs can mirror
  the same session.
- Only **one** display may hold the `claimPlayback` lease at a time. If a
  Mac admin connects with `register_admin`, it overwrites the playback
  routing (last-writer-wins). The previous display still receives
  game_state etc., it just stops getting `playback_command`. tvOS apps
  should detect this by tracking whether their MusicKit player is being
  driven (e.g. heartbeat via `now_playing` polls) and degrade gracefully.
- On display disconnect: if it was holding the claim, server clears the
  MusicKit routing automatically. The next admin/display to claim wins.

---

## 6. Worked example (Swift pseudocode)

```swift
let ws = WebSocket(url: URL(string: "wss://music.broberg.dk/quiz-ws")!)
ws.onOpen = {
  ws.send([
    "type": "register_display",
    "sessionId": currentSessionId as Any,  // or NSNull
    "claimPlayback": true,
  ])
}

ws.onMessage = { msg in
  switch msg["type"] as? String {
  case "display_registered":
    print("Display ready: \(msg["id"] ?? "")")

  case "game_state":
    let state = msg["state"] as? String ?? ""
    let question = msg["question"] as? [String: Any]
    UI.render(state: state, question: question)

  case "scoreboard":
    UI.renderScoreboard(msg["rankings"] as? [[String: Any]] ?? [])

  case "playback_command":
    let cmdId = msg["commandId"] as? String ?? ""
    let command = msg["command"] as? String ?? ""
    let params = msg["params"] as? [String: Any] ?? [:]

    Task {
      let result = await MusicKitBridge.handle(command: command, params: params)
      ws.send([
        "type": "playback_response",
        "commandId": cmdId,
        "result": result,
      ])
    }

  case "error":
    print("WS error: \(msg["message"] ?? "")")

  default: break
  }
}
```

---

## 7. Open questions for the tvOS team

- Do you need a separate `dj_state` mirror, or will you reuse the existing
  `dj_state` payload that already broadcasts to host? (Currently it ships
  to displays via the same `sendToHostAndDisplays` plumbing.)
- Should `register_display` accept an `appVersion` so the server can log
  which tvOS builds are connected? Easy to add when needed.
- Multi-display playback fan-out: today only one socket holds the claim. If
  multiple Apple TVs in the same room should all play in sync, that's a
  bigger architectural change (server-side audio fan-out). Out of scope for
  now.

Bind the WS, render the messages, ship it.
