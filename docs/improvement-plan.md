# Beat 4 Beat — Improvement Plan

Prioritized backlog from a full-codebase survey (features, optimization, design/UX).
One branch + PR per item, off `main`. Sizes: S ≈ hours, M ≈ a day, L ≈ multi-day.

---

## Phase 1 — Core promise & correctness _(do first)_

The marketing (`App.tsx:212`) and host guide (`HostGuide.tsx:222`) promise a
title/artist/steal scoring game the scoreboard doesn't implement, and the
audience screen leaks answers. Close that gap first.

1. ~~**Title / artist / steal scoring**~~ — **[DROPPED]** Scoring stays free-form:
   the host delegates points at their discretion via the flat +/- per-round model.
   A fixed title/artist/steal structure was prototyped and reverted (see
   `feat/title-artist-scoring`) — it's less flexible than letting the host award
   points however the room plays.
2. ~~**Gate audience answer reveal**~~ — **[DONE]** `revealTrackInfo` now lives in
   the shared `gameState`, so `AudienceView.tsx` shows "Guess the track!" until the
   host reveals the title/artist. — S

## Phase 2 — Cheap, high-value wins

3. ~~**`startTime` cue-point editor**~~ — **[DONE]** The song edit modal now has a
   "Start at (seconds)" input that threads through `onUpdate` → `updateItem` into
   the item's `startTime`, so hosts can skip long intros. — S
4. **End-of-game winner moment** — confetti / winner banner / final summary;
   today "new game" just resets. — S
5. **Copy-link "Copied!" feedback** — no visual confirmation today, and the logic
   is duplicated in `RoomView`, `RoomManageCard`, `RoomPreview`; consolidate. — S
6. ~~**Gate dev-only routes**~~ — **[DONE]** `/ui-preview`, `/forms-preview`, and
   `/spotify-test` now live in a `devOnlyRoutes` array spread into `routes.ts`
   only when `import.meta.env.DEV` is true; production falls through to NotFound
   and Rollup drops the three page chunks entirely. — S
7. **Drop `updateRoom`'s full-doc pre-read** — it re-checks ownership that
   `firestore.rules` already enforces; doubles every editor save. — S
8. **Random-tile picker** for lightning rounds. — S

## Phase 3 — Design-system foundation

9. **Toast / modal primitive** to replace ~20 native `alert()`/`confirm()` calls
   that shatter the Stage Night look and aren't accessible. Unblocks much of the
   design debt below. — L
10. **Accessible names** on icon-only buttons (`NowPlayingBar` play/pause/skip,
    `RoomPlayNav`) and game-board tiles (announce category + points + state);
    disable focusable dead tiles in `AudienceView`. — M
11. **Landing mobile nav** — under 720px only "Sign in" survives; add a hamburger
    (`stage-night.css:170`). — M
12. **Skeleton loading states** + fix header hide-on-scroll (`PageWrapper.tsx`
    vanishes until you scroll all the way back to top). — M
13. **Dead animation tokens** (`card-expand-*`, `backdrop-fade-*`, `beat-pulse`) —
    wire into the modal work (#9) or remove; apply consistent entrance motion. — S
14. **Small design debt** — contrast audit on low-opacity text; Profile uses the
    shared `Input` primitive; standardize route-based back navigation. — S

## Phase 4 — Performance & scale _(as usage grows)_

15. **Dashboard over-fetch** — `subscribeToMyRooms` streams full room docs incl.
    inline base64 category images just to show name/count/date; add a summary
    projection. Dominant read cost at scale. — M/L
16. **Bundle splitting** — no `manualChunks` (Firestore ships as one ~456 KB
    chunk); defer the Auth SDK (~88 KB) and the 632-line `SimBoard` off the
    landing critical path. — M
17. **`usePlaybackProgress`** polls Spotify every 1s all session — interpolate
    position locally, reconcile every 5–10s. — M

## Phase 5 — Code quality / refactors

18. **Extract shared standings component** — `AudienceView` re-implements
    `Scoreboard`'s ranking logic. — M
19. **Extract `<Tile>`** — `GameBoard` duplicates tile markup for single- vs
    multi-category layouts. — M
20. **Split `Scoreboard.tsx`** (610 lines) into rows / add-form / breakdown /
    FLIP helper. — M/L
21. **`useGameState`** — replace the manual `Map` + version signal with a store +
    `reconcile`; memoize `game()`. — S
22. **Test coverage** — `roomsService` (score migration, editor dedup,
    `duplicateRoom`), playback routing, PKCE flow. — M

## Phase 6 — Larger investments

23. **Sound effects** — buzz-in / correct / wrong / times-up. — M
24. **Game history / results archive** — `gameState` is wiped on new game; nothing
    persists for leaderboards or "last played". — M
25. **Marketplace discovery** — tags/genre, play count, favorites; today
    `marketFilter` matches names only and sorts by date. — M
26. **Phone join + buzz-in** — the `AudienceView` "QR join" TODO; player-side join,
    buzz ordering, answer submission. — L
