import { describe, expect, it } from "vitest";
import { winningTeams } from "./winner";
import type { Score } from "../model/score";

const score = (teamName: string, roundPoints: number[]): Score => ({ teamName, roundPoints });

describe("winningTeams", () => {
  it("is empty for no teams", () => {
    expect(winningTeams([])).toEqual([]);
  });

  it("returns the single highest-scoring team", () => {
    expect(winningTeams([score("A", [1]), score("B", [2, 1]), score("C", [1])])).toEqual(["B"]);
  });

  it("returns every team tied for the lead", () => {
    expect(winningTeams([score("A", [2]), score("B", [1, 1]), score("C", [1])])).toEqual([
      "A",
      "B",
    ]);
  });

  it("is empty when nobody has scored (all zero)", () => {
    expect(winningTeams([score("A", []), score("B", [0])])).toEqual([]);
  });

  it("ignores a leader whose total is negative", () => {
    expect(winningTeams([score("A", [-1]), score("B", [-2])])).toEqual([]);
  });
});
