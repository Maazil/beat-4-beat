# Beat 4 Beat — Improvement Plan

Prioritized backlog from a full-codebase survey (features, optimization, design/UX).
One branch + PR per item, off `main`. Sizes: S ≈ hours, M ≈ a day, L ≈ multi-day.
Completed items have been removed; numbering is kept stable for traceability.

---

## Phase 3 — Design-system foundation

12. **Skeleton loading states** + fix header hide-on-scroll (`PageWrapper.tsx`
    vanishes until you scroll all the way back to top). — M

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
