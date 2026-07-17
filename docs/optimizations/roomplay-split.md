# Optimization: Split RoomPlay.tsx into focused units

**Area:** architecture / maintainability · **Impact:** medium · **Effort:** medium

## Problem

`RoomPlay.tsx` is 569 lines mixing playback control, device state, board rendering, and game-flow helpers. Two full board grids live inline, making the file hard to change safely.

## Evidence

- Device fetch/select: `src/pages/rooms/RoomPlay.tsx:96-111`.
- Play/pause/resume/skip handlers: `RoomPlay.tsx:172-218`.
- Item lookup helpers `locateItem` / `itemById` / `roundLabels`: `RoomPlay.tsx:220-254` (pure game logic living in a page).
- Two full board grids: single-category (`:419-451`) and multi-category (`:453-520`).

## Suggested fix

1. Extract a `useRoomPlayback` primitive (device state + Spotify/YouTube play/pause/skip handlers). Pairs well with the Spotify-boundary proposal (`getPlaybackState`/`skipRelative` in `spotify.api.ts`).
2. Extract a `<GameBoard>` component owning both grid layouts.
3. Move `locateItem` / `roundLabels` into `src/lib/` as pure functions with unit tests (the repo's `solid-testing` skill: extract pure logic and test with plain vitest).

RoomPlay then becomes orchestration: subscribe, wire hooks, compose components.

## Acceptance criteria

- `RoomPlay.tsx` under ~250 lines with no behavioral change.
- `locateItem` / `roundLabels` covered by unit tests in `src/lib/`.
- `pnpm ts` / `lint` / `test` pass; a full game round plays identically.

_Sources: architecture audit finding #6 (2026-07-17)._
