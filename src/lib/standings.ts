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
 * Coerce a raw scores array (as stored in Firestore) into valid Score objects.
 * Handles the legacy `{ points }` shape and, crucially, any entry whose
 * `roundPoints` is missing or not an array — either would make `totalOf` throw
 * on `undefined.reduce`. Returns undefined when there is no array to normalize
 * (so callers can distinguish "absent" from "empty").
 */
export function normalizeScores(raw: unknown): Score[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((entry) => {
    const s = entry as Record<string, unknown>;
    return Array.isArray(s.roundPoints)
      ? (s as unknown as Score)
      : { teamName: s.teamName as string, roundPoints: [] };
  });
}

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

/**
 * Teams ordered by their revealed standing (leaders first), keeping the input
 * array untouched. Pass a precomputed standings map to avoid recomputing it.
 */
export function rankTeams(scores: Score[], standings?: Map<string, Standing>): Score[] {
  const order = standings ?? computeStandings(scores);
  return [...scores].sort(
    (a, b) => (order.get(a.teamName)?.order ?? 0) - (order.get(b.teamName)?.order ?? 0),
  );
}

/** A team leads when it ranks first and someone has actually scored. */
export const isLeadingStanding = (standing: Standing | undefined): boolean =>
  standing != null && standing.rank === 1 && standing.total > 0;
