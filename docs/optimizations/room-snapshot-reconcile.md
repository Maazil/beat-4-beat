# Optimization: Reconcile room snapshots + field-path gameState writes

**Area:** performance / data layer · **Impact:** high (core gameplay latency) · **Effort:** medium

## Problem

Every tile click or score change during a live game rewrites the whole `gameState` blob to Firestore, and the echoed snapshot replaces the entire `Room` object in a plain signal — so all ~25+ board tiles are destroyed and re-created in the DOM on every single game action, for the host and every co-owner.

## Evidence

- `src/hooks/useRoom.ts:23` — `createSignal<Room | null>(null)`; `setRoom(roomData)` on each snapshot (`:42`). Plain signal, not a store; `reconcile` is used nowhere in `src/`.
- `src/services/roomsService.ts:44` — `docToRoom()` builds a brand-new `Room` (new `categories` array, new item objects) per snapshot; `<For>` keys by reference identity, so every tile `<button>` in `src/pages/rooms/RoomPlay.tsx:422,461,487` is rebuilt each echo.
- `src/services/roomsService.ts:253-255` — `updateRoomGameState` writes `{ gameState }` wholesale; called on every tile click (`RoomPlay.tsx:115` via `useGameState.ts:74`) and every +1/−1 score press (`Scoreboard.tsx:128-142`).
- `src/pages/rooms/RoomPlay.tsx:243-254` — `roundLabels()` runs an O(rounds × categories × items) scan with no `createMemo`; `scores()`/`playOrder()`/`currentItemId()` (`:57-59`) re-derive through `game()` on every read.

This is exactly the case CLAUDE.md rule #7 and the `firestore-data-layer` skill call out (store + `reconcile` for snapshot documents that feed lists).

## Suggested fix

1. Back `useRoom` with `createStore` and apply snapshots via `reconcile(roomData, { key: "id" })` so only the changed subtree (usually `gameState`) triggers updates. Apply the same pattern to `useMyRooms` / `usePublicRooms` list hooks.
2. Use Firestore field-path updates in `updateRoomGameState` (`"gameState.currentItemId"`, `"gameState.playOrder"`, `"gameState.scores"`) so a score write doesn't rewrite `playOrder` and vice versa; optionally coalesce rapid +1/−1 presses before flushing.
3. Wrap `game`, `roundLabels`, and the `locateItem`/`itemById` lookups in `createMemo` (or a `Map<id, {item, category}>` index memo) in `RoomPlay.tsx`.

## Acceptance criteria

- Clicking a tile or awarding points updates only the affected tile/score DOM nodes (verify with devtools paint flashing or a `<For>` re-creation probe).
- A score write does not include `playOrder` in the Firestore update payload.
- `pnpm ts`, `pnpm lint`, `pnpm test` pass; live play still syncs across two browsers.

_Sources: architecture audit findings #1, #2; performance audit findings #1, #4 (2026-07-17)._
