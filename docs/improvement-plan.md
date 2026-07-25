# Beat 4 Beat — Improvement Plan

Prioritized backlog from a full-codebase survey (features, optimization, design/UX).
One branch + PR per item, off `main`. Sizes: S ≈ hours, M ≈ a day, L ≈ multi-day.
Completed items have been removed; numbering is kept stable for traceability.

---

## Phase 4 — Performance & scale _(as usage grows)_

15. **Dashboard/market item payload — DEFERRED, not worth it yet.** Category
    images are off the room doc, but the grids still stream every room's full
    `categories[].items[]` (~10 KB a room once Spotify metadata is attached) to
    show a name, a count, up to six category names and a date. Neither
    `RoomPreview` nor `RoomManageCard` reads `items[]` at all, so the waste is
    real — but Firestore bills document _reads_, not bytes, and a summary doc is
    still one read per room. The win is egress and parse time only, which at this
    catalog size doesn't pay for the work.

    **Rejected: a client-maintained `roomSummaries` collection.** Summaries for
    other hosts' public rooms can only be written by those hosts, so the
    marketplace would sit empty until every owner happened to re-save (fixable
    only with an Admin-SDK backfill, or a dual read that gives the savings back).
    Validating a summary against its room needs `get()` on the room, which inside
    a batch sees pre-batch state — the same create-can't-batch asymmetry
    `categoryImages` already hit, leaving a window where a room exists with no
    listing. And six write paths (`createRoom`, `updateRoom`, `toggleRoomActive`,
    `deleteRoom`, `acceptRoomInvite`, `removeRoomEditor`) would each have to keep
    two documents in step forever.

    **If it ever is needed, invert it instead:** move `categories[].items[]` into
    `rooms/{roomId}/assets/board`, mirroring the `categoryImages` split. The room
    document then _is_ the summary — one source of truth, no forged-listing rules
    problem, and migration is free because rooms saved before the split keep
    `items` inline and readers fall back to it. Cost is one extra read on the
    play/view/edit paths, which are already loading a board. — M

    **Trigger to revisit:** the public catalog passing a few hundred rooms, or
    "Load more" measurably dragging on mobile.

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
