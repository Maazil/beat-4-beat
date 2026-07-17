# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Beat 4 Beat is a music-quiz party game. Hosts build "rooms" — a Jeopardy-style board of categories × difficulty levels where each tile is a song — and play them live: songs stream via Spotify or YouTube, teams guess, and scores are tracked round by round. Rooms can be public (marketplace) or private, and support co-owner editors via invite links.

## Working Guidelines

Bias toward caution over speed; for trivial tasks, use judgment.

- **Think before coding.** State assumptions explicitly. If multiple interpretations exist, present them — don't pick silently. If a simpler approach exists, say so.
- **Simplicity first.** Minimum code that solves the problem. No speculative features, abstractions for single-use code, or configurability that wasn't asked for.
- **Surgical changes.** Touch only what you must; match existing style. Remove imports/code that *your* change made unused, but don't refactor, "improve", or delete pre-existing code unless asked — mention it instead. Every changed line should trace to the request.
- **Verify before done.** Define what success looks like, then check it: `pnpm ts`, `pnpm lint:fix`, and `pnpm test` must pass before proposing changes.

## Project Skills (use them)

Detailed, repo-specific conventions live in `.claude/skills/`. Invoke the matching skill *before* writing code in its area:

- **`solid-patterns`** — SolidJS reactivity beyond the basics: stores (path syntax, `produce`, `reconcile`, `unwrap`), memos vs effects, `on()`, `createResource`/Suspense, lifecycle. Use for any component, hook/primitive, or state logic.
- **`firestore-data-layer`** — the services/hooks layering, the canonical subscription-hook shape, signals vs stores + `reconcile` for snapshot data. Use for anything that reads/writes Firestore.
- **`solid-router`** — adding routes in `src/routes.ts`, wrapper/guard patterns, params & search params, `query` + `createAsync` data APIs. Use for routes, pages, navigation, or URL state.
- **`solid-testing`** — the vitest node setup for pure logic, plus the recipe for adding component/primitive tests. Use when writing tests or test infra.

## Conventions

- Conventional Commits (`feat:`, `fix:`, etc.).
- Never add Claude Code as a co-author on commits or pull requests.
- Never commit `.env` / `.env.local` or other secrets.

## Commands

```bash
pnpm dev          # Start dev server (localhost:3000) + TypeScript check in parallel
pnpm build        # Production build to /dist via Vite
pnpm serve        # Preview production build
pnpm ts           # TypeScript type check (no emit)
pnpm test         # Run vitest once
pnpm test:watch   # Run vitest in watch mode
pnpm format       # Format code with oxfmt
pnpm format:check # Verify formatting without writing
pnpm lint         # Lint with oxlint
pnpm lint:fix     # oxlint auto-fix
pnpm deploy       # Build + deploy to Firebase Hosting
```

## Architecture

### Tech Stack

- **Solid.js** v1.9 — Reactive UI framework (NOT React)
- **Vite** v8 — Build tool and dev server
- **Firebase** v12 — Auth (Google OAuth), Firestore (real-time NoSQL), Analytics, Hosting
- **TypeScript** — Strict mode enabled
- **Tailwind CSS** v4 — Utility-first styling via `@tailwindcss/vite` plugin
- **@solidjs/router** v0.16 — Client-side routing with lazy loading
- **Vitest** v4 — Unit tests (node environment, pure logic)
- **Spotify Web API + Web Playback SDK** — In-app music playback (frontend-only PKCE OAuth)
- **YouTube IFrame API** — Alternative playback source

### Routing

SolidJS Router. Route definitions in `src/routes.ts`:

- `/` — Landing page
- `/login` — Authentication page
- `/host-guide` — Public how-to-host guide
- `/market` — Public room marketplace
- `/rooms`, `/rooms/:id`, `/rooms/:id/play` — Browse, view, and play rooms
- `/dashboard` — Authenticated user dashboard
- `/dashboard/create` — Create or edit room (`?edit=roomId` for edit mode)
- `/invite/:roomId/:token` — Accept a co-owner invite link
- `/profile` — User profile (incl. DJ name)
- `/ui-preview`, `/forms-preview`, `/spotify-test` — Development-only showcases
- `**` — NotFound fallback

### Data Layer

**Firestore collections:** `rooms/` and `users/`

**Service layer** in `src/services/`:

- `roomsService.ts` — Room CRUD, real-time subscriptions (`onSnapshot`), duplicate/delete/toggle-active, live `gameState` sync (`updateRoomGameState`), co-owner management (invite generate/revoke/accept, editor list/remove), permission helpers (`isRoomHost`, `canEditRoom`)
- `usersService.ts` — User profile sync to Firestore on auth state change (`upsertUserProfile`), DJ name get/update

**Custom hooks** in `src/hooks/`:

- `useRoom(getRoomId)` — Subscribe to single room (reactive)
- `useMyRooms()` — Subscribe to current user's rooms (owned or co-owned)
- `usePublicRooms()` — Subscribe to all public rooms
- Data hooks return `{ data/rooms, isLoading, error }` pattern with `onCleanup` for unsubscribing
- `useGameState(getRoomId, getRoom)` — Game state for a play session: hosts/co-owners read+write `room.gameState` (shared, refresh-safe); everyone else falls back to a private localStorage copy
- `usePlaybackProgress()` — Playback position tracking for the seek bar

### Authentication

Firebase Auth via `src/context/AuthContext.tsx`:

- **Google OAuth** — Authenticated users can create/manage rooms
- Methods/accessors: `signInWithGoogle()`, `signOut()`, `isAuthenticated()`, `isRoomHost(roomHostId?)`, `userNameSplit()`
- Route guards: `ProtectedRoute`, `RequireHost` components
- Rooms support **co-owners** (`editorIds`) invited via tokenized links; use `canEditRoom(room)` from `roomsService` for edit permission checks, not just host identity

### Music Playback

- `src/lib/spotify/` — Self-contained Spotify module with a barrel export (`~/lib/spotify`): PKCE OAuth (no backend), Web Playback SDK provider (`SpotifyPlayerProvider`, `useSpotifyPlayer`), playback control hook (`useSpotifyPlayback`), Web API calls (search, devices, playlists, play/pause/seek), URL→URI utils
- `src/lib/youtube.ts` + `src/components/YouTubePlayer.tsx` — YouTube URL parsing (video id, start time) and embedded player
- Playback UI components: `NowPlayingBar`, `SeekBar`, `DevicePicker`, `GuessTimer`, `Scoreboard`, `TurnTracker`

### Key Directories

- `src/services/` — Firebase CRUD operations + real-time subscriptions
- `src/hooks/` — Custom Solid.js primitives for data fetching + game/playback state
- `src/context/` — AuthContext (global auth state)
- `src/model/` — TypeScript interfaces (Room, Category, SongItem, Score, GameState)
- `src/pages/` — Route page components
- `src/components/` — Shared UI components (RoomManageCard, RoomPreview, ProtectedRoute, playback/game components, forms)
- `src/lib/` — Firebase SDK init (`firebase.ts`, Firestore split into `db.ts` to keep it out of the entry chunk), Spotify module, YouTube utils, pure game logic (`standings.ts`, `roomHosts.ts`)
- `src/theme/` — `palette.ts` with `STAGE_INKS` category color palette

### Data Model

```typescript
Room {
  id, roomName, hostId, hostName,
  editorIds?, editorNames?, inviteToken?,   // co-owner support
  categories: Category[],
  showCategories?, scores?, gameState?,
  isActive, isPublic, createdAt
}
Category { id, name, imageUrl?, items: SongItem[] }
SongItem { id, level (1–6), title?, artist?, songUrl?, startTime?, isRevealed }
Score { teamName, roundPoints: number[] }
GameState { playOrder: string[], currentItemId, scores: Score[] }  // board state derivable from playOrder
```

### Styling

Tailwind CSS v4 via Vite plugin. **"Stage Night" design system**: deep navy stage, periwinkle hairlines, one gold spotlight accent, hot magenta for big moments. Design tokens live in the `@theme` block in `src/index.css` (`--color-night`, `--color-beat`, `--color-magenta`, etc.) — use these, never generic Tailwind colors. Category colors come from `STAGE_INKS` in `src/theme/palette.ts`. Landing-page styles in `src/pages/stage-night.css`. Keyframe animations in `src/index.css` (`beat-pulse`, `ambient-float`, `rise-in`, `card-expand-*`, `backdrop-fade-*`).

### Testing

Vitest, node environment, `src/**/*.test.ts` (see `vitest.config.ts`). Tests cover pure logic modules (e.g. `src/lib/standings.test.ts`, `src/lib/spotify/spotify.utils.test.ts`) — no component/DOM tests yet.

### Environment Variables

Config via Vite env vars (`.env.local`):

- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_SPOTIFY_CLIENT_ID`, `VITE_SPOTIFY_REDIRECT_URI`

## SolidJS Best Practices (MUST follow)

For full explanations and code examples, use the `solid-patterns` skill (`.claude/skills/solid-patterns/`).

1. Call signals when passing to JSX props — props are plain values, not accessors (`<User id={id()} />`).
2. Never destructure props — it breaks reactivity; use `props.x` or `splitProps`.
3. Wrap derived values in functions or `createMemo` — a bare `count() * 2` outside a reactive scope never updates.
4. Use `<Show>` and `<For>` instead of `&&` conditionals and `.map()`.
5. Use `createEffect` sparingly — external side-effects only; never to sync state or fetch data (use `createResource`).
6. Derive as much as possible — never mirror a signal with a signal + effect.
7. Use stores for complex/nested objects (e.g. Room categories) — fine-grained updates instead of replacing whole objects.
