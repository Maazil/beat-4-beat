import type { Score } from "../model/score";
import { computeStandings, totalOf } from "./standings";

/**
 * Names of the team(s) in first place with a positive total. More than one
 * name means a tie for the lead; an empty array means nobody has scored yet
 * (the game ended without any points awarded).
 */
export function winningTeams(scores: Score[]): string[] {
  const standings = computeStandings(scores);
  return scores
    .filter((s) => standings.get(s.teamName)?.rank === 1 && totalOf(s) > 0)
    .map((s) => s.teamName);
}
