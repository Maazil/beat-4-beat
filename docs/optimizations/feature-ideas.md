# Proposal: Next feature candidates

**Area:** features · **Effort:** varies per item

The July roadmap (8 features) is fully shipped and its security follow-ups are fixed (CSP headers, Firestore category cap, song-URL sanitizing). These are the candidates surfaced by TODO.md and the 2026-07-17 audits, roughly ordered by value. Status: #1 ships in this PR; #2, #3, and #6 shipped on their own branches/PRs; #4 and #5 are deferred.

## 1. Marketplace search, filter & pagination — ✅ shipped in this PR
The market grid renders all public rooms with no search or filtering. Pairs naturally with the bounded-public-rooms optimization (limit + cursor pagination): add a search box (client-side name filter to start), category-count/active filters, and "load more".

**Done:** search box (room + host name), All/Live status filter, and client-side "Load more" (12 at a time) — see `src/pages/market/market.tsx` and the pure `filterMarketRooms` helper (`src/lib/marketFilter.ts`) with tests. Firestore cursor pagination is left to the bounded-public-rooms work; the category-count filter was skipped as marginal.

## 2. Component/primitive test coverage — ✅ shipped (separate PR)
The `solid-testing` skill already documents the recipe (@solidjs/testing-library, `renderHook`, `testEffect`), but no component tests exist yet. Highest-value targets: `useGameState` (shared vs localStorage fallback paths), `useRoom` subscription lifecycle, and Scoreboard scoring interactions. The RoomPlay-split proposal also moves `locateItem`/`roundLabels` into `src/lib/` where plain vitest covers them.

**Done (own branch/PR):** added the jsdom + `@solidjs/testing-library` infra alongside the existing node pure-logic tests (no tsconfig `types` pollution) and tests for `useRoom`, `useGameState`, and `Scoreboard`.

## 3. Category image presets/templates (TODO.md) — ✅ shipped (separate PR)
Bundled preset artwork for common genres (80s, Rock, Movie themes…) so hosts without images get a polished board. Ship as static WebP assets; reuse the existing compression pipeline.

**Done (own branch/PR):** a genre preset picker in `CategoryColumn`, backed by `src/lib/categoryPresets.ts`. Art is generated as inline SVG data URLs in the Stage Night palette (no bundled asset weight); swap in real WebP later without touching the picker.

## 4. Animated GIF category headers (TODO.md) — ⏸ deferred
Currently images are canvas-compressed to static WebP. Supporting GIFs means skipping canvas re-encode for `image/gif` — but watch the Firestore 1 MB doc limit (GIFs are far larger than the ~5–15 KB WebPs; likely needs a size gate or Firebase Storage).

## 5. Collaborative editing safety — ⏸ deferred
The edit flow is a one-shot read while view/play are live (`createRoom.tsx` `getRoom` in `onMount` — intentional, avoids clobbering in-progress edits). If host + co-owner ever edit simultaneously, last-write-wins silently. Options: a lightweight "being edited by X" presence flag on the room doc, or field-level merges on save.

## 6. Player-facing join experience — ✅ shipped (separate PR)
Today non-editor players watch the host's screen. A low-effort "audience view" — a read-only `/rooms/:id/play` that hides host controls (it already partially works via the localStorage gameState fallback) — could become a QR-code "join on your phone" flow for buzzing/guessing later.

**Done (own branch/PR):** a read-only `/rooms/:id/watch` spectator page that mirrors live `room.gameState` and reuses `GameBoard` in a non-interactive mode, plus an "Audience view" link on the play page. QR-code "join on your phone" buzzing is still future work.

_Sources: TODO.md future considerations; architecture audit finding #13; 2026-07 roadmap memory; performance/design audits (2026-07-17)._
