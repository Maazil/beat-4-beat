# Landing redesign — “Stage Night”

Design spec for the new landing page (`/`, `src/pages/App.tsx`). The chosen direction is
**demo A “Stage Night”** — a dark, Vite-inspired landing with an interactive game-board
canvas in the hero. `demo-a-stage-night.html` in this folder is the approved, self-contained
reference implementation (open it in a browser; fonts are embedded as data URIs).

Live artifact (same content): https://claude.ai/code/artifact/67c34072-213a-4056-93b3-1812dc2003dd

Two other palette directions were explored and rejected: “Midnight Velvet” (dark purples)
and “Prom Daylight” (light lavender, scrapped).

## Palette

| Token | Hex | Role |
| --- | --- | --- |
| `bg` | `#02182B` | Page ground (deep navy) |
| `surface` | `#062741` | Cards, sim frame |
| `surface-2` | `#0A314F` | Board tiles |
| `text` | `#FEF9FF` | Headings, body on dark |
| `peri` | `#C6D8FF` | Muted text (used at ~.78 alpha), borders at ~.15 |
| `gold` | `#EAC435` | Primary accent: CTAs, spotlight, tile values |
| `magenta` | `#820263` | Secondary accent: CTA band fill |
| `magenta-hot` | `#C2158F` | Derived brighter magenta for gradient text / team color |

Note: this is a committed dark theme for the landing page only — it does not replace the
light “gig poster” system (`src/theme/palette.ts`) used inside the app.

## Typography

- Display: **Bricolage Grotesque 800** (already the app’s display face)
- Mono/labels/numbers: **Spline Sans Mono 500** (already in the app)
- Body: system-ui stack

## Page structure (top to bottom)

1. **Nav** — wordmark with gold tick, links (How it plays / Features / Marketplace), Sign in pill.
2. **Hero (centered)** — badge pill (“NEW · a marketplace of public boards”), H1
   “Guess the track. / Beat the room.” with gold→magenta gradient on line 2, sub copy,
   gold CTA “Start a game” + ghost CTA “Explore public boards”, mono footnote.
3. **Sim frame** — window-chrome card containing the interactive board canvas (below).
4. **How a round works** — 4 numbered step cards (build board → pick tile → shout it out → reveal).
5. **Features** — 6 cards, 3×2 (playlists, live rooms, marketplace, title+artist scoring,
   hidden standings, host controls).
6. **CTA band** — magenta gradient, centered repeat CTAs.
7. **Footer.**

## Hero canvas: interactive board sim

The canvas demos the real game loop and rules:

- 5 categories × 4 levels (100–400); 3 fictional teams shown as chips above the board.
- State machine: `idle → spot (850ms) → play (2500ms, equalizer in tile) → award (1050ms,
  point chips fly to a team) → idle`, until the board is cleared → `reveal (5200ms)` → reset.
- **Interactive**: clicking an unrevealed tile starts that round (hover = lift + gold outline
  + pointer cursor). Idle for 4200ms → the board auto-picks so it never sits static.
  Clicks are accepted during `idle` and `award`.
- **Rules encoded**: title point to the winning team; ~35% of rounds a second team steals
  the artist point; team totals stay masked as `•••` until the final reveal (hidden-standings
  rule); reveal sorts teams with animated bars + confetti.
- A hint line in the frame’s title bar narrates state (“your pick — click any tile” /
  “listening… title + artist on the line” / “N tiles left”).

### Implementation notes for the Solid port

- Make the canvas a `SimBoard.tsx` component: init in `onMount`, cancel rAF +
  disconnect observers in `onCleanup`. The sim is self-contained imperative canvas code —
  keep it out of Solid’s reactivity; no signals needed inside the loop.
- Keep the guards from the reference implementation:
  - DPR-aware sizing via `ResizeObserver` (cap DPR at 2).
  - Pause when offscreen (`IntersectionObserver`) and on `visibilitychange`.
  - `prefers-reduced-motion`: no animation loop; clicks resolve rounds instantly and
    re-render a static frame.
  - Don’t gate startup on `document.fonts.ready` (the rAF loop self-corrects); do a single
    repaint on fonts-ready in the reduced-motion path.
  - Clamp all phase-elapsed easings to `[0,1]` — pointer handlers and rAF run on slightly
    different clocks.
- Wire real navigation: “Start a game” → `/login`, “Explore public boards” → `/market`.
- Existing tailwind theme vars (`--color-ink`, `--color-beat`, …) belong to the light app
  theme; scope the landing’s dark tokens locally rather than overriding globals.
