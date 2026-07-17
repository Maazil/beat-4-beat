# Optimization: Store-backed room builder + split createRoom.tsx

**Area:** architecture / performance · **Impact:** medium-high (authoring UX, maintainability) · **Effort:** medium-high

## Problem

`createRoom.tsx` is 903 lines mixing four concerns, keeps the nested categories/items data in a plain signal, and rebuilds the entire array on every keystroke — which in turn triggers the signal-mirroring `createEffect`s in the child editors (a CLAUDE.md anti-pattern).

## Evidence

- `src/pages/dashboard/create/createRoom.tsx:39` — `createSignal<Category[]>([])`; whole-array rebuilds in `updateCategoryName` (`:325`), `updateCategoryImage` (`:330`), `addItem` (`:347`), `updateItem` (`:365`), `removeItem` (`:388`) — each clones the full board via nested `.map()`.
- Mixed concerns in one file: category/item CRUD (`:303-416`), co-owner/invite management (`:45-120` + `:587-680` JSX), Spotify playlist import (`:122-238` + `:682-852` JSX), plus the form shell.
- `src/pages/dashboard/create/SongItemCard.tsx:30-32` and `CategoryColumn.tsx:32-34` — `createEffect(() => setLocal…(props.…))` mirrors props into local signals via effects (CLAUDE.md rule #6 violation); these re-run on every parent rebuild.

## Suggested fix

1. Replace the signal with `createStore<Category[]>` and use path updates, e.g. `setCategories(catIndex, "items", itemIndex, "songUrl", url)` — fine-grained, no full-array clones (see the `solid-patterns` skill for store path syntax).
2. Remove the prop-mirroring effects: initialize local edit state once per item/category identity (keyed by `<For>`), or use `on(() => props.item.id, …)` so state re-seeds only on identity change.
3. Split the page: a `useRoomEditor` primitive (store + CRUD), a `<CoOwnerPanel>`, and a `<SpotifyImportPanel>`. Handlers already exist; this is mostly mechanical extraction.

## Acceptance criteria

- Typing in a song-title input updates only that card (no whole-board reconciliation).
- No `createEffect` that writes a signal derived from props remains in the create flow.
- `createRoom.tsx` shrinks to orchestration (~300 lines or less); `pnpm ts` / `lint` / `test` pass; create + edit + invite + playlist import still work.

_Sources: architecture audit findings #3, #7, #8 (2026-07-17)._
