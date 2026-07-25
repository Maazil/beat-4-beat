# Beat 4 Beat — Improvement Plan

Prioritized backlog from a full-codebase survey (features, optimization, design/UX).
One branch + PR per item, off `main`. Sizes: S ≈ hours, M ≈ a day, L ≈ multi-day.
Completed items have been removed; numbering is kept stable for traceability.

**Last reviewed 2026-07-25** (perf + architecture pass over the production build,
hosting headers, the Firestore read/write paths and the render hot paths).
Items #38–#46 came out of it. Checked and found in good shape — don't re-litigate
without new evidence: route-level code splitting and the lazy Firebase SDKs
(entry chunk 34.9 KB), analytics deferred to `requestIdleCallback`,
`solid-devtools` fully stripped from the production bundle, `/assets/**` served
`immutable`, every keyframe and transition on `transform`/`opacity` with the
landing simulation's rAF gated on visibility and `prefers-reduced-motion`,
category-image compression with a real size guard (`lib/categoryImage.ts`),
store + `reconcile` in the subscription hooks, and the public-rooms grid on
bounded one-shot pages.

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

38. **`index.html` is CDN-cached for an hour.** `curl -sI https://beat-4-beat.web.app/`
    returns `cache-control: max-age=3600` — Firebase Hosting's default, because
    `firebase.json` only sets headers for `/assets/**` (correctly `immutable`).
    Asset filenames are hashed, so the HTML entry is the one document that must
    revalidate; until it does, a returning visitor can run an hour-old build.
    Add a `no-cache` (or `max-age=0, must-revalidate`) header for it. — S

39. **Self-host the web fonts.** `index.html` loads a render-blocking
    cross-origin stylesheet from `fonts.googleapis.com` (9.3 KB, 20 `@font-face`
    blocks across three families) before any styled text can paint, then fetches
    the woff2s from a second origin. The preconnects help, but with the entry
    chunk down to 34.9 KB the fonts _are_ the landing page's critical path now.
    Ship the subset woff2s from `/assets` (same origin, `immutable`, no third
    party), declare `@font-face` in `index.css`, and preload the two weights used
    above the fold. — S/M

40. **The dashboard doesn't need live listeners.** `useMyRooms` opens two
    `onSnapshot` queries; while a game is running, every `gameState` write
    re-sends the whole room document — full `items[]` payload and all (#15) — to
    any dashboard left open in another tab, and to every co-owner's. The list
    only has to change after the viewer's own create / duplicate / delete. Move
    it to one-shot reads behind the shared router `query` + `revalidate` that the
    editor already uses. — S/M

41. **Coalesce `gameState` writes.** Every tile click, every ±1 award and every
    reveal toggle is its own write to the room document, echoed to every audience
    listener. Firestore's sustained per-document write limit is roughly 1/s, and
    awarding four teams in quick succession clears that easily. Debounce the
    `gameState.scores` writes (~300–500 ms) while keeping tile clicks immediate —
    it trades a little sync latency for a large drop in writes. — M

42. **Firestore SDK bytes — investigated, not recommended.** At 457 KB raw /
    134 KB gzip it's by far the largest asset. `firebase/firestore/lite` is a
    fraction of that but has no `onSnapshot`, so it could only serve the list
    views (and only once #40 lands) — while any user who then opens a board would
    download the full SDK _as well_, making the common path heavier. Revisit only
    if a browse-only audience shows up.

## Phase 5 — Code quality / refactors

23. **Test coverage** — `roomsService` (score migration, editor dedup,
    `duplicateRoom`), playback routing, PKCE flow. — M

43. **No root `ErrorBoundary`.** Nothing catches a render throw — a malformed
    snapshot or a bad lazy chunk takes the page to blank white. The only
    `<Suspense>` is the one around `SimBoard` on the landing page. Wrap the
    `Router` in an `ErrorBoundary` with a reload panel. — S

44. **Split `roomsService.ts` (561 lines).** It carries four concerns: room CRUD
    and list subscriptions, the category-image asset document, the co-owner
    invite handshake, and the permission helpers. The co-owner block
    (`requireHostedRoom` through `removeRoomEditor`, ~120 lines) is a clean seam
    for a `coOwnersService`. — S

45. **`useRoomEditor` mints ids with `Date.now()`.** `cat-${Date.now()}` /
    `item-${Date.now()}`, while `defaultCategory()` / `defaultSongItem()` in the
    model already use `crypto.randomUUID()`. Two items created in the same
    millisecond collide, and the store's path selectors (`item.id === itemId`)
    would then write to both. Use the model helpers. — XS

## Phase 6 — Larger investments

24. **Sound effects** — buzz-in / correct / wrong / times-up. — M
25. **Game history / results archive** — `gameState` is wiped on new game; nothing
    persists for leaderboards or "last played". — M
26. **Marketplace discovery** — tags/genre, play count, favorites; today
    `marketFilter` matches names only and sorts by date. — M
27. **Phone join + buzz-in** — the `AudienceView` "QR join" TODO; player-side join,
    buzz ordering, answer submission. — L

46. **Decide about a backend before starting Phase 6.** Frontend-only is a real
    strength of this app — PKCE with no token server, security rules as the whole
    authorization layer — but it's now the binding constraint on the roadmap, and
    every remaining large item runs into the same wall: #25 game history and #26
    play counts / favorites need writes a client can't be trusted to make (a host
    can inflate their own room's counters), #27 buzz-in needs a trusted ordering
    of near-simultaneous writes from clients that must not read each other's
    documents, and #15's rejected summary doc failed for exactly this reason.
    Rules can't express any of them. Decide once whether Cloud Functions are on
    the table — the answer changes the design of all four — rather than
    rediscovering the constraint one item at a time. — decision, not code
