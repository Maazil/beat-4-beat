/**
 * A team's points on a single round, keyed by scoring-call name (the calls
 * the host defines live on the scoreboard, e.g. "Title", "Artist",
 * "Performance"). A missing key means no points for that call this round.
 */
export type RoundScore = Record<string, number>;

export interface Score {
  teamName: string;
  rounds: RoundScore[]; // one entry per round played, in play order
}

export const emptyRound = (): RoundScore => ({});

/** Points a team scored on one round — the sum across every call. */
export const roundTotal = (round: RoundScore | undefined) =>
  round ? Object.values(round).reduce((sum, n) => sum + (n || 0), 0) : 0;

/** Keep only the numeric entries of a stored round map. */
const numericEntries = (obj: Record<string, unknown>): RoundScore => {
  const out: RoundScore = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "number") out[key] = value;
  }
  return out;
};

/**
 * Coerce a stored score of any past shape into the current model. Games are
 * live-only (wiped on new game), so this only matters for a mid-game refresh,
 * but it keeps totals intact across format changes:
 *   - legacy `{ points: number }`        → no rounds
 *   - legacy `{ roundPoints: number[] }` → each round's points land on "Title"
 *   - current `{ rounds: RoundScore[] }` → numeric entries kept as-is
 */
export const migrateScore = (raw: Record<string, unknown>): Score => {
  const teamName = typeof raw.teamName === "string" ? raw.teamName : "Team";
  if (Array.isArray(raw.rounds)) {
    return {
      teamName,
      rounds: raw.rounds.map((r) =>
        r && typeof r === "object" ? numericEntries(r as Record<string, unknown>) : {},
      ),
    };
  }
  if (Array.isArray(raw.roundPoints)) {
    return {
      teamName,
      rounds: (raw.roundPoints as number[]).map(
        (p): RoundScore => (typeof p === "number" && p ? { Title: p } : {}),
      ),
    };
  }
  return { teamName, rounds: [] };
};

export const defaultScore = (overrides?: Partial<Score>): Score => ({
  teamName: "Team Blue",
  rounds: [],
  ...overrides,
});

export const demoScores: Score[] = [
  {
    teamName: "Team Red",
    rounds: [{ Title: 1 }, {}, { Title: 1, Artist: 1 }, { Title: 1 }],
  },
  {
    teamName: "Team Blue",
    rounds: [{}, { Title: 1, Artist: 1 }, { Artist: 1 }, { Title: 1, Artist: 1 }],
  },
];
