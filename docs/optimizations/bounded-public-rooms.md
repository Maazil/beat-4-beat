# Optimization: Bound the public-rooms query

**Area:** performance / Firestore cost · **Impact:** medium now, grows with the catalog · **Effort:** low-medium

## Problem

The marketplace and rooms list live-subscribe to **every** public room with no limit, and each `Room` payload carries full `categories`/`items`/`scores`/`gameState` even though the grid only renders name + category count. Reads, listener cost, and re-render cost scale unbounded with catalog size.

## Evidence

- `src/services/roomsService.ts:151` — `subscribeToPublicRooms` uses `query(roomsCollection, where("isPublic", "==", true))` with no `limit()` or `orderBy()`.
- Consumed on two routes: `src/pages/market/market.tsx:7` and `src/pages/rooms/RoomsList.tsx:7` via `usePublicRooms`.
- `src/hooks/usePublicRooms.ts:27` — maps every doc to a new `Room` per snapshot into a plain signal (full-replace re-render of the whole grid).

## Suggested fix

1. Add `orderBy("createdAt", "desc")` + `limit(N)` with cursor pagination (`startAfter`) and a "load more" affordance.
2. Consider a one-shot `getDocs` read for the market/list views instead of a live listener — the grid doesn't need real-time updates. If live is kept, still cap with `limit`.
3. Longer-term: a lightweight list projection (summary fields on the doc, or a separate summaries collection) so list views don't download full boards.

## Acceptance criteria

- Market/rooms list issues a bounded query (verify in the network tab / Firestore usage console).
- Pagination or "load more" works past N rooms.
- `pnpm ts` / `lint` / `test` pass.

_Sources: architecture audit finding #4; performance audit finding #3 (2026-07-17)._
