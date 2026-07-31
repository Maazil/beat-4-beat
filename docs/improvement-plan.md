# Beat 4 Beat — Improvement Plan

Prioritized backlog from a full-codebase survey (features, optimization, design/UX).
One branch + PR per item, off `main`. Sizes: S ≈ hours, M ≈ a day, L ≈ multi-day.
Completed items have been removed; numbering is kept stable for traceability.

**Last reviewed 2026-07-31** — a *measured* pass against production (resource
timing per page, not a code read), after the 2026-07-25 code/architecture pass
that produced items #38–#46. The measured pass found one thing and it was large:
fonts were **68% of the landing page** (160 KB of 235 KB, against 64 KB for all
JS), because self-hosting them in #39 fixed the render-blocking stylesheet but
never touched the font bytes. Both the weight ranges and Bricolage's `opsz` axis
are now instanced down — 160 KB → 108 KB — and the reasoning, the measured
trade-off behind the pinned `opsz` value, and the refresh procedure that must not
drop the instancing step all live in the `── Fonts ──` comment in `src/index.css`.
Read that before touching a font file.

Checked and found in good shape — don't re-litigate
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

40. **Dashboard live listeners — mostly a non-issue; don't do this as written.**
    `useMyRooms` does open two `onSnapshot` queries, and each `gameState` write
    would re-send whole room documents (full `items[]` and all, #15) to a
    dashboard that was listening. The premise was that one is listening during a
    game — and it usually isn't: `RoomManageCard`'s **Start** button and
    `RoomPreview`'s card link both navigate in the same tab, so the dashboard
    unmounts and `onCleanup` drops both listeners before the first tile is
    clicked. Reproducing the churn takes a deliberately-opened second tab.

    Against that, the fix as written trades a self-maintaining subscription for
    manual `revalidate` calls at every mutation site (create, edit, duplicate ×2,
    delete) — the same call-site-discipline liability that got #15's summary
    collection rejected, for a saving that mostly doesn't occur. If the churn is
    ever measured in practice, the cheap version is to detach the listeners on
    `visibilitychange` and re-attach on focus: it kills exactly the
    background-tab case, needs no call-site discipline, and costs a re-read per
    return to the tab.

41. **Coalesce `gameState` writes — weaker than it first looked.** Every tile
    click, ±1 award and reveal toggle is its own write to the room document,
    echoed to every audience listener; a full game is roughly 200 writes. That
    part is real. But Firestore's ~1/s per-document limit is a _sustained_ rate
    that absorbs bursts, and a host awarding four teams spreads those clicks over
    seconds — so the limit isn't actually being hit. Debouncing would delay the
    audience view and opens a window where a write is lost on navigation.
    Revisit only if the write volume shows up on the bill or the audience view
    starts lagging. — M

42. **Firestore SDK bytes — investigated, not recommended.** At 457 KB raw /
    134 KB gzip it's by far the largest asset. `firebase/firestore/lite` is a
    fraction of that but has no `onSnapshot`, so it could only serve the list
    views (and only once #40 lands) — while any user who then opens a board would
    download the full SDK _as well_, making the common path heavier. Revisit only
    if a browse-only audience shows up.

## Phase 5 — Code quality / refactors

23. **Test coverage** — `roomsService` (score migration, editor dedup,
    `duplicateRoom`), playback routing, PKCE flow. — M

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

Sound effects (#24), a game history / results archive (#25) and phone join +
buzz-in (#27) were **dropped 2026-07-25** as features the game doesn't need —
not deferred. Don't reopen them.

26. **Marketplace discovery** — tags/genre, play count, favorites; today
    `marketFilter` matches names only and sorts by date. — M

46. **Backend question, now scoped to #26.** Frontend-only is a real strength of
    this app — PKCE with no token server, security rules as the whole
    authorization layer. With #25 and #27 dropped, the only remaining item that
    runs into it is #26: play counts and favorites need writes a client can't be
    trusted to make (a host can inflate their own room's counters), and rules
    can't express the constraint — the same wall #15's summary doc hit. Tags and
    genre filtering carry no such problem and can ship on their own. So the
    decision is no longer a roadmap blocker: build the parts of #26 that rules
    _can_ authorize, and treat counters as the one thing that would need Cloud
    Functions. — decision, not code
