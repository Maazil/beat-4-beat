import { beforeEach, describe, expect, test } from "vitest";
import { STAGE_INKS } from "../../../theme/palette";
import { generateColorScheme, resetHueAssignments } from "./categoryColors";

describe("generateColorScheme", () => {
  beforeEach(() => resetHueAssignments());

  test("uses an explicit preset inkIndex as the hue", () => {
    const ink = STAGE_INKS[2];
    const scheme = generateColorScheme("cat-a", 2);
    expect(scheme.border).toBe(ink.ink);
    expect(scheme.titleBg).toBe(ink.ink);
    expect(scheme.itemBg).toBe(ink.tint);
  });

  test("wraps an out-of-range inkIndex around the palette", () => {
    const wrapped = STAGE_INKS[2 % STAGE_INKS.length];
    expect(generateColorScheme("cat-a", STAGE_INKS.length + 2).border).toBe(wrapped.ink);
  });

  test("falls back to round-robin auto-assignment when no inkIndex is given", () => {
    expect(generateColorScheme("cat-a").border).toBe(STAGE_INKS[0].ink);
    expect(generateColorScheme("cat-b").border).toBe(STAGE_INKS[1].ink);
    // Same category id is stable across calls.
    expect(generateColorScheme("cat-a").border).toBe(STAGE_INKS[0].ink);
  });

  test("a preset category does not consume a round-robin slot", () => {
    generateColorScheme("preset-cat", 3); // explicit hue, no auto-assignment
    expect(generateColorScheme("auto-cat").border).toBe(STAGE_INKS[0].ink);
  });
});
