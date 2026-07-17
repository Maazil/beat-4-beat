# Optimization: Router preload + shared room query

**Area:** architecture / perceived performance · **Effort:** low-medium · **Impact:** medium

## Problem

Navigating RoomView → RoomPlay (and dashboard → edit) does a cold round-trip each time: each page opens its own fresh read/subscription of the same room doc, and no route declares `preload`, so data fetching can't start on link intent.

## Evidence

- `src/routes.ts` — all non-landing routes are correctly `lazy()`, but none declare `preload`.
- `src/pages/rooms/RoomView.tsx:9` subscribes to `:id`; "Start" navigates to `:id/play` (`RoomView.tsx:104`) where `RoomPlay` opens a brand-new subscription to the same doc.
- `src/pages/dashboard/create/createRoom.tsx:252` — edit mode does a one-shot `getRoom` in `onMount`.

## Suggested fix

Per the repo's `solid-router` skill (modern data APIs):

1. Wrap the room read in a `query()` so it's cached and shared across routes.
2. Add `preload` to the `rooms/:id` and `rooms/:id/play` route definitions so the fetch starts on hover/intent.
3. Note: the edit flow's one-shot read is intentional (avoids clobbering in-progress edits) — leave its semantics, but it can still warm from the query cache.

## Acceptance criteria

- Navigating RoomView → RoomPlay renders the board without a second cold fetch (verify in network tab).
- `pnpm ts` / `lint` / `test` pass.

_Sources: architecture audit findings #11, #13 (2026-07-17)._
