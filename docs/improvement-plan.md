# Beat 4 Beat — Improvement Plan

Prioritized backlog from a full-codebase survey (features, optimization, design/UX).
One branch + PR per item, off `main`. Sizes: S ≈ hours, M ≈ a day, L ≈ multi-day.
Completed items have been removed; numbering is kept stable for traceability.

---

## Phase 1 — Bugs / regressions (fix first)

30. **PlayBar position not visible when a song starts** — the seek/progress bar
    doesn't render its position at playback start. — S
31. **Play/pause state desync** — the play button still shows the pause icon while
    a song is playing (observed at least on the first song); button state and
    playback time drift out of sync. — M
32. **Skip ±seconds not synced immediately** — jumping forward/back by X seconds
    doesn't update the shared position/state right away. — M

## Phase 1.5 — Create-room / song-selection UX

33. **Cap start-at seconds to song length** — validate the "start at" input so it
    can't exceed the track's duration on song selection. — S
34. **Show artist in the song preview** — when a song is selected in create-room,
    display the artist alongside the title in the preview. — S
35. **Set start-at without the modal closing** — adding intro/start seconds when a
    song is selected currently dismisses the modal, forcing a re-click of the item
    to add the seconds; keep the modal open. — S/M
36. **Category preset colors on SongItemCards** — when a category preset color is
    chosen, make the song item cards match it. — S
37. **Song image not fetched** — the song artwork never loads; either fix the fetch
    or remove the image, as it isn't necessary (overlaps with #30/preview work). — S

## Phase 2 — Cheap, high-value wins

5. **Copy-link "Copied!" feedback** — no visual confirmation today, and the logic
   is duplicated in `RoomView`, `RoomManageCard`, `RoomPreview`; consolidate. — S
6. **Drop `updateRoom`'s full-doc pre-read** — it re-checks ownership that
   `firestore.rules` already enforces; doubles every editor save. — S
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

## Phase 5 — Code quality / refactors

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
