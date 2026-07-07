import type { Score } from "../model/score";

/** A team's revealed scoreboard position. */
export interface Standing {
  order: number; // 0-based display position after sorting by total
  rank: number; // 1-based rank; tied totals share a rank
  total: number;
}

/** Sum of every point award a team has received. */
export const totalOf = (score: Score) => score.roundPoints.reduce((sum, p) => sum + p, 0);

/**
 * name → revealed position and rank. Teams sort by total (descending);
 * ties share a rank and are broken by insertion order for display position.
 */
export function computeStandings(scores: Score[]): Map<string, Standing> {
  const entries = scores.map((s, i) => ({ name: s.teamName, total: totalOf(s), i }));
  entries.sort((a, b) => b.total - a.total || a.i - b.i);
  const map = new Map<string, Standing>();
  entries.forEach((entry, idx) => {
    const prev = idx > 0 ? map.get(entries[idx - 1].name) : undefined;
    const rank = prev && prev.total === entry.total ? prev.rank : idx + 1;
    map.set(entry.name, { order: idx, rank, total: entry.total });
  });
  return map;
}
