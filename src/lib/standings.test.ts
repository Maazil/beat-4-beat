import { describe, expect, it } from "vitest";
import { computeStandings, totalOf } from "./standings";
import type { RoundScore, Score } from "../model/score";

// Each number is a round's point total, modelled as a single "Title" call.
const score = (teamName: string, roundTotals: number[]): Score => ({
  teamName,
  rounds: roundTotals.map((p): RoundScore => (p ? { Title: p } : {})),
});

describe("totalOf", () => {
  it("sums all round points", () => {
    expect(totalOf(score("A", [1, 0, 2, 3]))).toBe(6);
  });

  it("counts every call across rounds together", () => {
    expect(
      totalOf({
        teamName: "A",
        rounds: [{ Title: 1, Artist: 1 }, { Artist: 1 }],
      }),
    ).toBe(3);
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
