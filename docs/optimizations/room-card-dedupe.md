# Optimization: Unify room cards + remove dead code

**Area:** architecture / design consistency · **Impact:** medium · **Effort:** low

## Problem

`/rooms` and `/market` show the same public-rooms data with divergent hand-rolled markup; the status badge and date formatting are re-implemented in four files; two service functions are dead; and RoomView ships two buttons that do nothing.

## Evidence

- `src/pages/rooms/RoomsList.tsx:51-88` inlines a card whose class string (`:52`) is a byte-for-byte copy of `src/components/RoomPreview.tsx:60`, but diverges: "Active/Inactive" vs "Live/Inactive" labels, navigates to `/rooms/:id` vs `/rooms/:id/play`, omits host list + save button. `src/pages/market/market.tsx:53` uses the shared `<RoomPreview>`.
- Empty/error states differ: Market uses a dashed-border panel (`market.tsx:45-49`), RoomsList a bare `<p>` (`RoomsList.tsx:46-48`).
- isActive→badge mapping re-implemented in `RoomView.tsx:11-19`, `RoomManageCard.tsx:34-39`, `RoomPreview.tsx:38-56`, `RoomsList.tsx:60-67`; `createdAt.toLocaleString("en-GB", { dateStyle: "short" })` copy-pasted in the same four files.
- Dead code: `getPublicRooms` (`roomsService.ts:124`) and `getMyRooms` (`roomsService.ts:134`) are never called (only the `subscribeTo*` variants are). *Note: the bounded-public-rooms proposal may repurpose `getPublicRooms` for one-shot reads — coordinate before deleting.*
- Dead UI: `RoomView.tsx:118` "Edit settings" and `:121` "Delete room" have no `onClick`.

## Suggested fix

1. Have RoomsList render `<RoomPreview>` (or extract a shared `<RoomGrid>` owning loading/empty/error markup); standardize the dashed-panel empty state.
2. Add `<RoomStatusBadge active>` and a `formatRoomDate(createdAt)` helper; use them in all four call sites.
3. Delete the dead service functions (or wire `getPublicRooms` into the bounded-query work).
4. Wire RoomView's "Edit settings" to `/dashboard/create?edit=:id` (guarded by `canEditRoom`) and "Delete room" to the existing delete flow — or remove the buttons.

## Acceptance criteria

- One card recipe for public rooms across `/rooms` and `/market`; one badge + one date helper.
- No non-functional buttons; no unreferenced service exports.
- `pnpm ts` / `lint` / `test` pass.

_Sources: architecture audit findings #9, #10, #12; design audit finding P2 (2026-07-17)._
