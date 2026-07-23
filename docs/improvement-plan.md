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
4. ~~**End-of-game winner moment**~~ — **[DONE]** A "🏆 Finish game" button sets a
   shared `gameState.gameOver` flag that raises a `WinnerOverlay` (confetti,
   winning team(s), final standings). The audience view mirrors it read-only so a
   projected screen celebrates in step. — S
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
16. ~~**Bundle splitting**~~ — **[DONE]** SimBoard is now `lazy()`-loaded off the
    landing hero, and the Auth SDK is dynamically imported by `AuthContext`
    (via a memoized `lib/auth` re-export that keeps it tree-shaken) instead of
    statically. `manualChunks` isolates `firebase-auth` and `firebase-firestore`
    so neither can pull the other. Landing critical-path JS dropped from ~186 KB
    to ~63 KB raw — no Firebase on first paint. — M
17. ~~**`usePlaybackProgress`**~~ — **[DONE]** The seek position is now
    interpolated from a wall-clock anchor on a 250ms local tick and reconciled
    against the Spotify Web API every 5s (plus once immediately on start/resume)
    instead of polling every 1s — ~5x fewer steady-state playback API calls, and
    a smoother bar. Same public signal interface; still idle while paused/hidden. — M

## Phase 5 — Code quality / refactors

18. ~~**Extract shared standings logic**~~ — **[DONE]** The rank-ordering and
    leader-detection `AudienceView`, `Scoreboard`, and `WinnerOverlay` each
    derived on top of `computeStandings` now live in `lib/standings.ts` as
    `rankTeams` and `isLeadingStanding` (with tests). The visual rows differ too
    much to share a component — Scoreboard's are interactive — so that stays for
    the #20 split. — M
19. ~~**Extract `<Tile>`**~~ — **[DONE]** `GameBoard` now renders a single local
    `<Tile>` for both the single- and multi-category layouts; the two paths only
    pass different size classes (`buttonClass` / `levelClass`). The revealed
    toggle, stage-card ink vars, click, and level-color logic live in one place. — M
20. ~~**Split `Scoreboard.tsx`**~~ — **[DONE]** The 610-line component split into
    `scoreboard/ScoreRow` (interactive row, owns its inline-rename state),
    `AddTeamForm` (owns its open/draft state), `RoundBreakdown` (read-only
    round-by-round table), and a `scoreboardFlip` helper (`withFlip` + `popChip`
    element-ref animations). `Scoreboard.tsx` is now a ~194-line orchestrator that
    owns scores state, standings memos, and the mutation handlers. — M/L
21. ~~**Split `SongItemCard.tsx`**~~ — **[DONE]** The 397-line component split into
    a `SongItemEditModal` (the Portal edit modal) and a `songItemFlip` helper (the
    two inline FLIP enter/exit callbacks + an exported `tileFrame` translate/scale
    geometry, covered by tests), mirroring the #20 `scoreboardFlip` split.
    `SongItemCard.tsx` is now a ~100-line board tile that keeps only the
    `originRect` capture the animation needs. — M
22. ~~**`useGameState`**~~ — **[DONE]** The non-shared (localStorage) path now
    uses a `solid-js` store: reads track fine-grained, updates merge via
    `setLocal`, and room changes `reconcile` a fresh load — no more manual `Map`
    + version signal. `game()` is a `createMemo`. — S
23. **Test coverage** — `roomsService` (score migration, editor dedup,
    `duplicateRoom`), playback routing, PKCE flow. — M

## Phase 6 — Larger investments

24. **Sound effects** — buzz-in / correct / wrong / times-up. — M
25. **Game history / results archive** — `gameState` is wiped on new game; nothing
    persists for leaderboards or "last played". — M
26. **Marketplace discovery** — tags/genre, play count, favorites; today
    `marketFilter` matches names only and sorts by date. — M
27. **Phone join + buzz-in** — the `AudienceView` "QR join" TODO; player-side join,
    buzz ordering, answer submission. — L
