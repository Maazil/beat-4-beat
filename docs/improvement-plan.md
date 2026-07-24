# Beat 4 Beat — Improvement Plan

Prioritized backlog from a full-codebase survey (features, optimization, design/UX).
One branch + PR per item, off `main`. Sizes: S ≈ hours, M ≈ a day, L ≈ multi-day.
Completed items have been removed; numbering is kept stable for traceability.

---

## Phase 3 — Design-system foundation

11. **Landing mobile nav** — under 720px only "Sign in" survives; add a hamburger
    (`stage-night.css:170`). — M

## Phase 4 — Performance & scale _(as usage grows)_

15. **Dashboard/market item payload** — category images are off the room doc now,
    but the grids still stream every room's full `categories[].items[]` (~7 KB a
    room) to show a name, a count and a date. The web SDK can't project fields,
    so going further means a real summary document per room. — M

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
