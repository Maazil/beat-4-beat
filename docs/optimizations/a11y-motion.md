# Optimization: Keyboard/touch accessibility + reduced motion

**Area:** accessibility · **Impact:** high for keyboard/touch/motion-sensitive users · **Effort:** low-medium

## Problem

Card-sized click targets are unreachable by keyboard and invisible to screen readers; edit controls on the room builder only appear on hover (unreachable on phones/tablets — a primary authoring flow); and the app-wide animations ignore `prefers-reduced-motion` (only the landing page guards it).

## Evidence

**Keyboard:**
- `src/components/RoomPreview.tsx:59-61` — `<article onClick>` with `cursor-pointer`, no `role`/`tabindex`/key handler (the shared market card).
- `src/pages/rooms/RoomsList.tsx:51-53` — same pattern, duplicated inline.
- `src/pages/dashboard/create/SongItemCard.tsx:237` — modal backdrop `<div onClick>`, no Escape handler.

**Touch (hover-only controls):**
- `src/pages/dashboard/create/CategoryColumn.tsx:108,128,145` (rename, delete-category, image controls) and `SongItemCard.tsx:146` (remove item) are `hidden … group-hover:flex` with no touch fallback. Lower-stakes instances: `Scoreboard.tsx:274,407`, `SeekBar.tsx:42`.

**Motion:**
- Reduced-motion guards exist only for the landing page (`src/pages/stage-night.css:582`, `SimBoard.tsx:98`). The app-wide keyframes and `.animate-*` utilities in `src/index.css:155-165` have no guard; they fire on Login (`Login.tsx:47,50`), GuessTimer, and ~12 spinners.

## Suggested fix

1. Make cards real interactive elements (`<a href>`/`<button>`), or add `role="button" tabindex={0}` + Enter/Space `onKeyDown`. Add Escape handling to the SongItemCard modal.
2. Reveal builder edit controls on `focus-within` and make them always visible (reduced opacity) below `md:` — e.g. `max-md:flex md:hidden md:group-hover:flex`.
3. Add a global `@media (prefers-reduced-motion: reduce)` block in `index.css` neutralizing `.animate-*` and capping transition/animation durations, mirroring the landing-page block.

## Acceptance criteria

- Every card and control reachable and operable by keyboard; modal closes on Escape.
- Room builder fully usable on a touch device (no hover required).
- With reduced motion enabled, no ambient/pulse animations run anywhere in the app.
- `pnpm ts` / `lint` / `test` pass.

_Sources: design audit findings P1 (cards), P2 (motion), P3 (touch) (2026-07-17)._
