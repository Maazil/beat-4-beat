# Optimization: Shared Button component + focus-visible recipe

**Area:** design system · **Impact:** high leverage, low risk · **Effort:** low-medium

## Problem

There is no shared Button component: the primary gold pill is hand-rolled in at least 7 places with drifting padding/weight/shadow — and the "canonical" recipe in UIPreview doesn't match what the app actually uses. Custom buttons also have no `focus-visible` treatment, so keyboard focus is easy to lose on the navy background.

## Evidence

- Canonical recipe `src/pages/ui-preview/UIPreview.tsx:67-91` uses `font-semibold`, **no** shadow — but every real usage uses `font-bold` + `shadow-[0_8px_30px_rgba(234,196,53,0.28)]`:
  - `src/pages/dashboard/Dashboard.tsx:55` (+ hover lift), `src/pages/auth/Login.tsx:71`, `src/pages/dashboard/create/createRoom.tsx:555`, `src/pages/notfound/NotFound.tsx:22`, `src/pages/rooms/RoomView.tsx:103`, `src/components/NowPlayingBar.tsx:136` (icon variant).
- Secondary/ghost (`border border-line … hover:border-beat hover:bg-beat-soft`) and Spotify-green buttons are likewise duplicated.
- `focus-visible` styles exist only in `stage-night.css` (landing). In the app, only `src/components/forms/Input.tsx:50-53` has a focus treatment; gold pills, tile buttons (`RoomPlay.tsx:426,489`), and timer chips (`RoomPlay.tsx:403`) rely on the UA default outline.

## Suggested fix

1. Add `src/components/forms/Button.tsx` with `variant` (`primary` / `secondary` / `destructive` / `spotify`) and `size`, matching the real-world `font-bold` + shadow usage. Include a shared focus recipe: `focus-visible:ring-2 focus-visible:ring-beat focus-visible:ring-offset-2 focus-visible:ring-offset-night`.
2. Replace the ~7 inline copies; update UIPreview to render the component so the style guide stays truthful.
3. Add the focus recipe to the RoomPlay tile buttons; consider a global `:focus-visible` fallback in `index.css`.

## Acceptance criteria

- One source of truth for button styles; UIPreview renders `<Button>`.
- Tabbing through Dashboard/RoomPlay shows a visible gold focus ring on every control.
- No visual regression on the pages touched; `pnpm ts` / `lint` / `test` pass.

_Sources: design audit findings P1 (button), P2 (focus-visible) (2026-07-17)._
