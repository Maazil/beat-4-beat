# Optimization: Restore the Spotify lib boundary + smarter playback polling

**Area:** architecture / efficiency · **Impact:** medium · **Effort:** low

## Problem

`~/lib/spotify` is the designated Spotify SDK boundary (same role as `src/services/` for Firestore), but playback-state reads and skip logic live in a page and a hook as three near-identical raw `fetch` calls. Separately, the playback-progress poll runs at 1 Hz for the whole session, even when the tab is hidden or playback is paused.

## Evidence

- Raw `fetch("https://api.spotify.com/v1/me/player", …)` duplicated 3×: `src/hooks/usePlaybackProgress.ts:43`, `src/pages/rooms/RoomPlay.tsx:193`, `src/pages/rooms/RoomPlay.tsx:208`. `spotify.api.ts` has no `getPlaybackState`.
- `handleSkipForward` / `handleSkipBackward` (`RoomPlay.tsx:190-218`) are near-identical fetch+seek pairs.
- `src/hooks/usePlaybackProgress.ts:39-55` — `setInterval(…, 1000)` started on first play, only cleared on component cleanup; one Spotify `/me/player` request per second for the entire play session regardless of visibility/pause state.

## Suggested fix

1. Add `getPlaybackState()` and `skipRelative(deltaMs)` to `src/lib/spotify/spotify.api.ts`; have `RoomPlay` and `usePlaybackProgress` call those. Collapse the two skip handlers into one call with ± delta.
2. Pause polling on `document.hidden` (visibilitychange) and while playback is paused; optionally back off to 2–3 s — `SeekBar`'s `transition-[width] duration-200` already smooths coarse updates.

## Acceptance criteria

- No `api.spotify.com` fetch outside `src/lib/spotify/`.
- Network tab shows polling stops when the tab is hidden or playback is paused.
- Seek bar and skip ±10s still work in a live session; `pnpm ts` / `lint` / `test` pass.

_Sources: architecture audit finding #5; performance audit finding #6 (2026-07-17)._
