import { describe, expect, it } from "vitest";
import { STAGE_INKS } from "../theme/palette";
import { CATEGORY_PRESETS, presetImage } from "./categoryPresets";

describe("CATEGORY_PRESETS", () => {
  it("has unique ids and valid ink indices", () => {
    const ids = CATEGORY_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const preset of CATEGORY_PRESETS) {
      expect(preset.inkIndex).toBeGreaterThanOrEqual(0);
      expect(preset.inkIndex).toBeLessThan(STAGE_INKS.length);
      expect(preset.label.length).toBeGreaterThan(0);
    }
  });
});

describe("presetImage", () => {
  it("returns an svg+xml data URL", () => {
    const url = presetImage(CATEGORY_PRESETS[0]);
    expect(url.startsWith("data:image/svg+xml,")).toBe(true);
  });

  it("embeds the preset label and hue", () => {
    const preset = CATEGORY_PRESETS[0];
    const svg = decodeURIComponent(presetImage(preset).replace("data:image/svg+xml,", ""));
    expect(svg).toContain(`>${preset.label}</text>`);
    expect(svg).toContain(STAGE_INKS[preset.inkIndex].ink);
  });

  it("stays small enough to store inline", () => {
    for (const preset of CATEGORY_PRESETS) {
      // Comfortably under the categoryImage MAX_DATA_URL_CHARS (120k) cap.
      expect(presetImage(preset).length).toBeLessThan(4000);
    }
  });
});
