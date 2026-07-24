/**
 * Hide-on-scroll logic for the dashboard header, kept out of the component so
 * the thresholds are testable.
 *
 * The header hides while you scroll *down* and comes back the moment you
 * scroll *up* — the usual behaviour. (An earlier version keyed off absolute
 * position alone, so once hidden it stayed hidden until you scrolled all the
 * way back to the top.)
 */

/** Scroll deltas smaller than this are sub-pixel drift or rubber-band, not intent. */
const JITTER_PX = 6;

/** Near the top the header always shows, so a short page can't hide it. */
const TOP_ZONE_PX = 64;

export interface HeaderScrollState {
  /** Last scroll position we acted on. */
  y: number;
  hidden: boolean;
}

export const initialHeaderState = (y = 0): HeaderScrollState => ({
  y: Math.max(0, y),
  hidden: false,
});

/**
 * Next header state for a scroll position. Returns `prev` unchanged when the
 * move is below the jitter threshold, so small scrolls accumulate rather than
 * flickering the header — and so a signal set to the result is a no-op.
 */
export const nextHeaderState = (prev: HeaderScrollState, y: number): HeaderScrollState => {
  // iOS overscroll reports negative positions; treat them as the top.
  const clamped = Math.max(0, y);

  if (clamped <= TOP_ZONE_PX) {
    return prev.hidden || prev.y !== clamped ? { y: clamped, hidden: false } : prev;
  }

  const delta = clamped - prev.y;
  if (Math.abs(delta) < JITTER_PX) return prev;

  return { y: clamped, hidden: delta > 0 };
};
