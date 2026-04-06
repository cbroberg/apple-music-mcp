# F31 — Next.js Migration of Quiz UI (Admin + Player PWA + Host)

> **Status:** PROPOSED — not yet scheduled
> **Priority:** Medium-high (technical debt with strategic upside, not a user-facing feature)
> **Effort:** 3-5 dedicated sessions
> **Author:** Claude session 2026-04-06

## Why we should do it

Music Quiz's quiz UI is currently four ~1000-line vanilla HTML/JS files
(`admin.html` + `admin.js`, `host.html`/`quiz-display.js`, `play.html` +
`play.js`, `builder.html` + `builder.js`). They were intentionally vanilla
because of **Hard Rule #7** ("tvOS WebView compatibility"). That rule was
**ophævet april 2026** when the tvOS team confirmed WebKit doesn't exist in
the AppleTVOS SDK and the tvOS app is being built as 100% native SwiftUI.

The original constraint is gone. The cost of vanilla is now pure friction.

### Concrete pain we feel today

- **Stale element IDs.** The recent monorepo session found that
  `e2e-screenshot-test-3players.js` had been silently broken for weeks
  because admin.html renamed `cfg-*` → `qz-cfg-*`. No type checker, no
  compile error, no test failure — the test just `set null.value =` and
  defaulted to whatever was hard-coded. A React/TS component with a typed
  prop would have caught this at edit time.
- **Duplicated state across files.** Player credits, queue, current song,
  WebSocket connection, MusicKit auth state — all are reimplemented in
  every vanilla file with subtly different reconciliation logic. A
  `useQuizSession()` hook would consolidate this into one place.
- **No code reuse with `web/`.** `packages/web` already runs Next.js for the
  marketing/login/now-playing pages. Quiz UI is a parallel universe that
  shares zero code, zero types, zero components.
- **Hand-rolled tab switching, modal management, drag-drop.** Every vanilla
  file reinvents the wheel. shadcn/ui + Tailwind would erase ~40% of the
  CSS and most of the boilerplate.
- **No dev-time error feedback.** A typo in admin.js doesn't throw until
  the user hits the broken path at runtime. TypeScript would catch
  90%+ of these at edit time.
- **Cmd+K global search.** ~300 lines of vanilla code to do what `cmdk` +
  shadcn does in 30.
- **Quiz overlay = mode-confusion.** Admin.html embeds the quiz overlay
  (`#quiz-overlay`) inside the admin layout, hidden by default, opened
  imperatively via `showQuizOverlay()`. With Next.js this would be a
  separate route `/quiz/admin/play` with its own layout — no overlay
  hack, no tab/quiz-mode toggling.

### What Next.js gives us beyond fixing pain

- **Component library reuse.** All other Webhouse projects use shadcn/ui
  + Tailwind v4. The same KPI cards, modals, command palettes, dropdowns
  work everywhere. New quiz features get built faster.
- **Server actions for admin operations.** Things like "create event",
  "bulk-add to playlist", "kick player" become server actions instead of
  ad-hoc fetch + WebSocket dance. Less moving parts.
- **Type-safe WebSocket layer.** A `useQuizWs()` hook exposes typed
  `send()` and discriminated-union `onMessage` — fully type-checked end
  to end with the shared types in `@music-quiz/shared`.
- **PWA via Serwist (already in fysiodk-aalborg-sport).** Drop-in
  replacement for the hand-rolled service worker in `play.js` with
  background sync, install prompts, push notifications.
- **Easier internationalization.** When (not if) we ship Music Quiz as a
  global product, `next-intl` makes Danish/Swedish/UK/US builds trivial.
  Vanilla string interpolation is a nightmare to localize.
- **A/B testing + analytics.** Vercel Web Analytics, PostHog, etc.
  drop in cleanly. Vanilla = bespoke event-tracking glue.
- **SSR for SEO of marketing pages.** Already true for `packages/web`,
  but moving quiz UI in lets us eventually pre-render the lobby join
  page from a shared link.

### What we lose

- **Bundle size goes up.** Vanilla admin.js is ~80KB. Next.js + React +
  shadcn for the same surface is closer to ~200KB on first load (after
  code-splitting). On a phone over 4G this is ~200ms slower TTI. We can
  mitigate with aggressive code splitting per route, but it will never be
  as small as vanilla.
- **Build complexity.** `pnpm build` already runs turbo across packages —
  this isn't new, but the quiz route gets pulled into the Next.js build
  graph and any TS error blocks the deploy.
- **More tooling to maintain.** ESLint config, Tailwind config,
  next.config.ts. Already true for `packages/web`, just more surface to
  match across both.

## My honest recommendation

**Do the migration, but do it phased and start with the highest-leverage
piece.** Vanilla is "good enough" right now, but every new feature we add
to admin.js adds proportional friction. We just spent 30 minutes debugging
a stale-ID bug that wouldn't exist in TypeScript. That cost will compound.

**On the "global game / API platform" question** — the user asked whether
vanilla can scale to a global product. My take:

1. **Vanilla can absolutely run a global game.** Performance-wise,
   bandwidth-wise, scale-wise, vanilla HTML/JS is fine. Discord ran on
   raw Backbone/jQuery for years.
2. **What vanilla can't do well is "platform"** — third-party developers,
   themes, plugins, embeds, internationalization, design-system reuse,
   typed APIs. If Music Quiz is just a party game forever, vanilla is
   fine. If it becomes a platform (custom quiz packs, embeddable widgets,
   white-label tournaments, marketplace for question banks), Next.js +
   typed contracts is the right foundation.
3. **The honest test:** how many features are in the next 6 months
   roadmap that touch the UI? If it's 10+, migrate. If it's 1-2, defer.
   Looking at FEATURES.md (F22 personalized pool, F23 cover-vs-original,
   F24 genre roulette, F25 music map, F26 setlist challenge, F27 mashup,
   F28 audience mode, F29 ear trainer, F30 stats replay) → **9 UI-heavy
   features queued.** Vote: migrate.

## Phased migration plan

### Phase 0 — Foundation (1 session)
- New `packages/web/app/quiz/` route group
- `useQuizWs()` hook with typed messages from `@music-quiz/shared`
- `<QuizSessionProvider>` context for credits/queue/current song
- shadcn/ui set up (probably already there from the `web` package)
- Tailwind theme tokens matching the current dark theme + Apple Music red
- Express routing: `/quiz/admin` → Next.js, with feature flag
  `?legacy=1` falling back to vanilla admin.html during migration

### Phase 1 — Quiz overlay → standalone route (1 session)
- Most self-contained vanilla file (`quiz-display.js`, ~700 lines)
- Becomes `/quiz/admin/play` with its own layout
- 7 sub-screens (setup, countdown, question, evaluating, reveal,
  scoreboard, final) become 7 React components
- Drives the existing WebSocket — no server changes
- **Acceptance:** can run a full quiz without touching admin.html

### Phase 2 — DJ tab (1 session)
- Default tab in admin.html, ~400 lines of admin.js
- Drag-drop queue, picks display, autoplay toggle
- Becomes `/quiz/admin/dj`
- **Acceptance:** DJ Mode works identically to vanilla

### Phase 3 — Recently Played + Playlists + Favorites (1 session)
- All three are list views with grid/list toggle, search, play actions
- Share a `<TrackGrid>` + `<TrackList>` component
- Becomes `/quiz/admin/library/{recent|playlists|favorites}`
- **Acceptance:** all three tabs work, Cmd+K global search works

### Phase 4 — Player PWA (1 session)
- `play.html` + `play.js` → `packages/web/app/quiz/play/`
- Serwist for service worker
- Reuses `useQuizWs()` and the same shared types as admin
- **Acceptance:** join, play, see results, install as PWA on iPhone

### Phase 5 — Cleanup (½ session)
- Remove vanilla files
- Remove `?legacy=1` flag
- Update CLAUDE.md
- Update e2e tests

### Out of scope
- `host.html` standalone fullscreen route — keep as vanilla until tvOS
  is shipped (it's a fallback display target). Can be migrated later.
- Quiz Builder — small, self-contained, low priority. Migrate if/when
  we touch it for other reasons.

## Open questions

- Do we want `/quiz/admin` under `packages/web` or as a new
  `packages/admin` workspace? I'd say `packages/web` to keep deploy
  simple — one Next.js process, one Express custom server.
- Auth: admin currently authorizes via the same iron-session cookie as
  `packages/web`. Should be a no-op since they'd live in the same
  Next.js app.
- WebSocket from React: `useEffect` + manual cleanup, or use
  `@tanstack/react-query` with WS subscriptions? I'd lean on a small
  custom hook for now (~80 lines). Avoid bringing in another lib.

## Decision needed

- ✅ / ❌ Approve migration
- If approved: which session do we start Phase 0?
- Confirm scope: is `host.html` standalone really out of scope?
- Confirm: keep both vanilla and Next.js running side-by-side during
  migration (feature flag), or hard cut after each phase?
