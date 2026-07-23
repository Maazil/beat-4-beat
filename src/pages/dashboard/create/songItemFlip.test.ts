import { describe, expect, it } from "vitest";
import { tileFrame } from "./songItemFlip";

// Minimal DOMRect stand-in — tileFrame only reads left/top/width/height.
const rect = (left: number, top: number, width: number, height: number): DOMRect =>
  ({ left, top, width, height }) as DOMRect;

describe("tileFrame", () => {
  it("translates by the delta between rect and modal centers", () => {
    // Tile centered at (60, 60), modal centered at (250, 250) → delta (-190, -190).
    const frame = tileFrame(rect(50, 50, 20, 20), rect(200, 200, 100, 100));
    expect(frame.transform).toContain("translate(-190px, -190px)");
  });

  it("scales the modal down to the tile's dimensions", () => {
    // Tile 20×40 against a 100×100 modal → scale (0.2, 0.4).
    const frame = tileFrame(rect(0, 0, 20, 40), rect(0, 0, 100, 100));
    expect(frame.transform).toContain("scale(0.2, 0.4)");
  });

  it("is fully transparent with the tile's border radius", () => {
    const frame = tileFrame(rect(0, 0, 10, 10), rect(0, 0, 100, 100));
    expect(frame.opacity).toBe(0);
    expect(frame.borderRadius).toBe("0.5rem");
  });

  it("is a no-op transform when the tile already matches the modal", () => {
    const frame = tileFrame(rect(10, 10, 100, 100), rect(10, 10, 100, 100));
    expect(frame.transform).toBe("translate(0px, 0px) scale(1, 1)");
  });
});
