# Plan: Make the play page usable from a phone

Let a host run a full game — all categories present — from their phone alone.
Today the play page (`/rooms/:id/play`) is one tall column that works on a
laptop but fights a phone: the host scrolls **down** to the board to pick a
song, then **back up** to the scoreboard to award points, every single round.
On top of that scroll fatigue, a few controls are outright broken on touch.

This is **Option B — collapsible single scroll**: keep the one-column layout
(so the desktop experience is untouched), but on phones promote the board to
the primary focus and collapse the scoreboard into a **sticky summary strip**
that expands on tap for scoring. The mandatory touch/overflow fixes ("the
foundation") ship as Phase 1 and stand on their own.

Breakpoint: **`md` (768px)** is the phone/desktop boundary, matching the
breakpoint `GameBoard` already uses to switch its multi-category layout.

## What breaks on a phone today (verified)

- **Scoreboard — "Remove team" is unreachable.** The button is
  `opacity-0 … group-hover:opacity-100` (`Scoreboard.tsx:407`). Touch has no
  hover, so a team can never be removed on a phone. The rename pencil
  (`Scoreboard.tsx:273`) is the same — rename still works by tapping the name,
  but the affordance is invisible.
- **NowPlayingBar overflows narrow screens.** One row of six items —
  track info (`flex-1`), a text **Reveal** button, and skip-back / play /
  skip-forward — at `gap-4 px-6` (`NowPlayingBar.tsx:32`). On a ~360px phone
  the track info gets crushed and controls crowd.
- **Scroll round-trip.** Page order is Header → Scoreboard → TurnTracker →
  Board (`RoomPlay.tsx:110-184`); the board sits below a full scoreboard, so
  picking then scoring means scrolling both ways each round.
- **Minor:** `GuessTimer` is a fixed 112px ring at `right-6 bottom-24`
  (`GuessTimer.tsx:46`) that can sit over board content on a small screen
  (it is dismissable); the room title is `text-3xl` (`RoomPlayHeader.tsx:20`).

---

## Phase 1 — Foundation (touch + overflow fixes)

Independently shippable and required regardless of the flow. Goal: at
360–414px wide, every control is reachable and nothing scrolls the page body
sideways.

### 1. `src/components/Scoreboard.tsx` — touch-reachable controls

- Remove-team button (`:403-417`): make it always visible on mobile, keep the
  hover-reveal on desktop. Swap `opacity-0 … group-hover:opacity-100` for
  `opacity-100 md:opacity-0 md:group-hover:opacity-100`.
- Rename pencil svg (`:273-285`): same treatment so the affordance shows on
  touch.
- Sanity-check the row (`:242-418`) at 360px: name (`flex-1 min-w-0 truncate`),
  −/+ buttons, round-points chip, and the now-visible remove button should fit.
  If tight, drop `sm:` gaps a step on mobile; do **not** hide the score
  controls.

### 2. `src/components/NowPlayingBar.tsx` — control row that fits

Keep the full-width seek bar (`:24-30`) as-is. Restructure the control row
(`:32`) so it survives a narrow screen:

- Reduce spacing on mobile: `gap-2 px-3 py-2 sm:gap-4 sm:px-6 sm:py-3`.
- Make **Reveal** icon-only on mobile — wrap its label text
  (`:115 "Hide"/"Reveal"`) in `<span class="hidden sm:inline">`. The eye/eye-off
  icon already communicates the action.
- Give the transport buttons and Reveal `shrink-0` so the track-info block
  (`flex-1 min-w-0`) is the only thing that yields.
- Verify the three transport buttons + Reveal + track info fit at 360px; if
  not, drop the two ±10s skip buttons to `hidden xs`/reduce to icon size — but
  first confirm they don't fit, since the above usually suffices.

### 3. `src/pages/rooms/RoomPlay.tsx` — spacing for the fixed bar

- The container uses `pb-24` (`:94`) to clear the fixed bar. Confirm it still
  clears the bar at its mobile height after Phase 1; bump to `pb-28` on mobile
  if the last board row hides behind the bar.

### 4. Minor polish (optional, same phase)

- `GuessTimer.tsx`: shrink the ring on mobile (`h-20 w-20` under `md`) and/or
  move it to `left-4` so it doesn't cover the right edge of the board.
- `RoomPlayHeader.tsx:20`: `text-2xl sm:text-3xl` for the title.

**Acceptance (Phase 1):** on a 360px viewport — remove + rename reachable,
NowPlayingBar shows all controls without clipping, no horizontal page scroll,
board fully scrollable above the bar.

---

## Phase 2 — Collapsible scoreboard (the Option B layer)

On phones, replace the always-open inline scoreboard with a sticky summary
strip; the full scoreboard opens on demand for scoring. Desktop keeps the
inline scoreboard exactly as today.

### 1. New component: `src/components/ScoreStrip.tsx`

A compact, glanceable status bar. Props mirror what the strip needs to render
(no new state of its own):

```ts
interface ScoreStripProps {
  scores: Score[];
  currentRound?: number;
  expanded: boolean;
  onToggle: () => void;
}
```

- Renders each team as `name · total` (reuse `totalOf` from `lib/standings`),
  horizontally scrollable if it overflows, plus a chevron that rotates with
  `expanded`.
- When a round is active, show each team's current-round points (mirror the
  `roundValue` chip styling from `Scoreboard.tsx:378-390`) so the host sees
  awards land without expanding.
- The whole strip is a `<button>` calling `onToggle`; `sticky top-0 z-30` with
  a `bg-surface` backdrop so it pins under the header while the board scrolls.
- Stage Night tokens only (`bg-surface`, `border-line`, `text-beat-bright`
  for totals), matching the mockup.

### 2. `src/pages/rooms/RoomPlay.tsx` — wire the collapse

- Add `const [scoreExpanded, setScoreExpanded] = createSignal(false);`
- Keep a **single** `<Scoreboard>` instance (state lives in `useGameState`, so
  a second instance would be wasteful and could double-fire FLIP). Drive its
  placement with a responsive wrapper:
  - **Desktop (`md+`):** wrapper is static in the flow — inline scoreboard,
    unchanged from today.
  - **Mobile (`< md`):** wrapper is hidden unless `scoreExpanded()`; when
    expanded it becomes an overlay panel anchored under the sticky strip, over
    the board, with a tap-to-dismiss scrim. This preserves board scroll
    position (no inline layout shift).
  - Concretely: `class={"... md:static md:block " + (scoreExpanded() ? "<mobile overlay classes>" : "hidden md:block")}` plus a `<Show when={scoreExpanded()}>` scrim that is `md:hidden`.
- Render `<ScoreStrip>` with `class="md:hidden"` in the board's position at the
  top of the content, passing `expanded={scoreExpanded()}` and
  `onToggle={() => setScoreExpanded((v) => !v)}`.
- Mobile content order becomes: Header (compact) → DevicePicker (only while
  choosing a device) → **ScoreStrip (sticky)** → TurnTracker → **Board**.
  Desktop order is unchanged.
- Dismiss the panel on scrim tap and chevron tap. **Recommended:** also
  auto-collapse when a tile is played (in `handleItemClick`, `:54`) so picking
  the next song returns focus to the board. (Open decision below.)

### 3. FLIP check

`Scoreboard`'s reveal animation reads `getBoundingClientRect` (`:78-95`). It
works inside the overlay, but verify the "Reveal standings" re-order animates
correctly when the scoreboard is mounted as the mobile overlay.

**Acceptance (Phase 2):** on mobile the board is the primary above-the-fold
content; team totals (and live round points) are always visible in the strip;
awarding points is reachable in one tap and dismisses cleanly; the `md+`
desktop layout is pixel-identical to before.

---

## Phase 3 — Verify

- `pnpm ts`, `pnpm lint:fix`, `pnpm test` all green (per `CLAUDE.md`).
- Manual pass in Chrome responsive mode at 360 / 390 / 414px **and** at `md+`
  to confirm desktop is unchanged.
- Playtest a real multi-category room end to end on a phone: pick → play →
  reveal → score → next round, no page-body horizontal scroll, no control
  clipped by the fixed bar.
- No component/DOM tests exist in this repo (vitest is node-only, pure logic —
  `CLAUDE.md`). No new pure-logic module is introduced here, so no unit tests
  are expected; note this explicitly in the PR. If any formatting helper is
  extracted (e.g. strip summary), give it a `.test.ts`.

---

## Open decisions

1. **Auto-collapse on tile pick?** Recommended yes — after scoring, picking the
   next tile should snap focus back to the board. Trivial to toggle; call out
   in the PR so it can be reverted if it feels abrupt.
2. **Scoring from the strip itself?** Deliberately **out of scope** — putting
   ±buttons per team in the strip is the Option A direction and crowds the bar
   with many teams. B keeps the strip glanceable and expands for scoring.
3. **Overlay vs inline expansion.** Recommended overlay-under-strip with a
   scrim (no board layout shift). Inline push is simpler but jumps the board;
   avoid.

## Non-goals

- No change to game logic, `useGameState`, playback, or Firestore.
- No change to the desktop (`md+`) layout beyond the shared Phase 1 fixes.
- Not building the tabbed shell (Option A). Phase 1's shared pieces make A a
  smaller follow-up if B's expand-to-score tap proves too much friction in
  real play.
