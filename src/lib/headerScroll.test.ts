import { describe, expect, test } from "vitest";
import { initialHeaderState, nextHeaderState } from "./headerScroll";

describe("nextHeaderState", () => {
  test("stays visible inside the top zone", () => {
    expect(nextHeaderState(initialHeaderState(), 40)).toEqual({ y: 40, hidden: false });
  });

  test("hides on a downward scroll past the top zone", () => {
    expect(nextHeaderState({ y: 40, hidden: false }, 400)).toEqual({ y: 400, hidden: true });
  });

  test("comes back on the next upward scroll, without returning to the top", () => {
    const hidden = nextHeaderState({ y: 40, hidden: false }, 400);
    expect(nextHeaderState(hidden, 340)).toEqual({ y: 340, hidden: false });
  });

  test("reveals again when scrolling back into the top zone", () => {
    expect(nextHeaderState({ y: 400, hidden: true }, 10)).toEqual({ y: 10, hidden: false });
  });

  test("ignores jitter below the threshold, and accumulates it", () => {
    const start = { y: 400, hidden: false };
    // 3px is drift, not intent — same object back, so a signal set is a no-op.
    expect(nextHeaderState(start, 403)).toBe(start);
    // …but the drift isn't banked: 8px from the last acted-on position hides it.
    expect(nextHeaderState(start, 408)).toEqual({ y: 408, hidden: true });
  });

  test("treats iOS overscroll as the top", () => {
    expect(nextHeaderState({ y: 400, hidden: true }, -120)).toEqual({ y: 0, hidden: false });
  });

  test("no-ops when an in-top-zone position hasn't changed", () => {
    const state = { y: 20, hidden: false };
    expect(nextHeaderState(state, 20)).toBe(state);
  });
});
