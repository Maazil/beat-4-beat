# Optimization: `--color-youtube` token + shared canvas/SVG color constants

**Area:** design system · **Impact:** low (drift prevention) · **Effort:** low

## Problem

YouTube red is a first-class product color (YouTube playback is a core feature) but has no design token — unlike Spotify green (`--color-spotify`). Canvas and SVG art re-declare Stage Night token values as raw hexes in three files, which will silently drift if a token ever changes.

## Evidence

- YouTube red `#ff0033` hardcoded in `src/pages/App.tsx:238` and `src/pages/host-guide/guide-art.tsx:22` — no token exists.
- `src/components/landing/SimBoard.tsx:12-16` re-declares `GOLD`/`PERI`/`MAG`/`TEXT`/`NAVY`; `:278/:282` use ad-hoc shades (`#0E3A5D`, `#0A314F` — the latter duplicates `--color-surface-2`).
- `src/pages/host-guide/guide-art.tsx:13-22` re-declares `--color-line` values; `src/pages/App.tsx:125-238` inline SVG strokes restate `#1DB954`, `#C2158F`, `#C6D8FF`, `#EAC435`.

(Otherwise token discipline is excellent — a full grep found zero generic Tailwind palette classes anywhere.)

## Suggested fix

1. Add `--color-youtube: #ff0033;` to the `@theme` block in `src/index.css`, parallel to `--color-spotify`.
2. Canvas needs literal values, so export shared JS color constants from `src/theme/palette.ts` (or read the CSS custom properties at runtime) and have `SimBoard`, `guide-art`, and `App` import them instead of re-declaring hexes.

## Acceptance criteria

- One definition per product color; no raw Stage Night hexes re-declared in TSX.
- Visuals unchanged; `pnpm ts` / `lint` / `test` pass.

_Sources: design audit finding P3 (2026-07-17)._
