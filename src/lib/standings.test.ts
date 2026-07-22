import { describe, expect, it } from "vitest";
import { computeStandings, normalizeScores, totalOf } from "./standings";
import type { Score } from "../model/score";

const score = (teamName: string, roundPoints: number[]): Score => ({ teamName, roundPoints });

describe("totalOf", () => {
  it("sums all round points", () => {
    expect(totalOf(score("A", [1, 0, 2, 3]))).toBe(6);
  });

  it("is 0 for a team with no rounds", () => {
    expect(totalOf(score("A", []))).toBe(0);
  });
});

describe("computeStandings", () => {
  it("returns an empty map for no teams", () => {
    expect(computeStandings([]).size).toBe(0);
  });

  it("orders teams by total, descending", () => {
    const standings = computeStandings([
      score("Low", [1]),
      score("High", [2, 3]),
      score("Mid", [2]),
    ]);
    expect(standings.get("High")).toEqual({ order: 0, rank: 1, total: 5 });
    expect(standings.get("Mid")).toEqual({ order: 1, rank: 2, total: 2 });
    expect(standings.get("Low")).toEqual({ order: 2, rank: 3, total: 1 });
  });

  it("gives tied totals the same rank", () => {
    const standings = computeStandings([score("A", [2]), score("B", [1, 1]), score("C", [1])]);
    expect(standings.get("A")?.rank).toBe(1);
    expect(standings.get("B")?.rank).toBe(1);
    expect(standings.get("C")?.rank).toBe(3); // rank skips past the tie
  });

  it("breaks display-order ties by insertion order", () => {
    const standings = computeStandings([score("First", [1]), score("Second", [1])]);
    expect(standings.get("First")?.order).toBe(0);
    expect(standings.get("Second")?.order).toBe(1);
  });

  it("treats all-zero teams as tied for first", () => {
    const standings = computeStandings([score("A", []), score("B", [])]);
    expect(standings.get("A")?.rank).toBe(1);
    expect(standings.get("B")?.rank).toBe(1);
  });
});

describe("normalizeScores", () => {
  it("returns undefined when the input is not an array", () => {
    expect(normalizeScores(undefined)).toBeUndefined();
    expect(normalizeScores(null)).toBeUndefined();
  });

  it("passes through well-formed scores unchanged", () => {
    const scores = [score("A", [1, 2]), score("B", [])];
    expect(normalizeScores(scores)).toEqual(scores);
  });

  it("gives an entry with a missing roundPoints an empty array", () => {
    // A partially written / legacy entry that would crash totalOf.
    expect(normalizeScores([{ teamName: "A" }])).toEqual([{ teamName: "A", roundPoints: [] }]);
  });

  it("coerces a non-array roundPoints to an empty array", () => {
    expect(normalizeScores([{ teamName: "A", roundPoints: null }])).toEqual([
      { teamName: "A", roundPoints: [] },
    ]);
  });

  it("migrates the legacy { points } shape", () => {
    expect(normalizeScores([{ teamName: "A", points: 5 }])).toEqual([
      { teamName: "A", roundPoints: [] },
    ]);
  });

  it("keeps the result safe for totalOf", () => {
    const normalized = normalizeScores([{ teamName: "A" }])!;
    expect(totalOf(normalized[0])).toBe(0);
  });
});
