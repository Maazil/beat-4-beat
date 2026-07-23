import { describe, expect, it } from "vitest";
import { clampCueSeconds, maxCueSeconds, parseCueSeconds } from "./cuePoint";

describe("maxCueSeconds", () => {
  it("floors a positive duration to whole seconds", () => {
    expect(maxCueSeconds(185_400)).toBe(185);
  });

  it("returns undefined for missing or non-positive durations", () => {
    expect(maxCueSeconds(undefined)).toBeUndefined();
    expect(maxCueSeconds(0)).toBeUndefined();
  });
});

describe("parseCueSeconds", () => {
  it("parses a non-negative integer of seconds", () => {
    expect(parseCueSeconds("30")).toBe(30);
    expect(parseCueSeconds(" 12 ")).toBe(12);
  });

  it("returns undefined for blank or invalid input", () => {
    expect(parseCueSeconds("")).toBeUndefined();
    expect(parseCueSeconds("   ")).toBeUndefined();
    expect(parseCueSeconds("-5")).toBeUndefined();
    expect(parseCueSeconds("abc")).toBeUndefined();
  });
});

describe("clampCueSeconds", () => {
  it("caps the cue point at the track length", () => {
    expect(clampCueSeconds(300, 185)).toBe(185);
  });

  it("leaves a cue point within range untouched", () => {
    expect(clampCueSeconds(60, 185)).toBe(60);
  });

  it("does not cap when the track length is unknown", () => {
    expect(clampCueSeconds(9999, undefined)).toBe(9999);
  });

  it("passes an undefined cue point through", () => {
    expect(clampCueSeconds(undefined, 185)).toBeUndefined();
    expect(clampCueSeconds(undefined, undefined)).toBeUndefined();
  });
});
