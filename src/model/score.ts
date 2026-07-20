/** Points a team earned on a single round. Every song is two calls — title
 * and artist — scored separately, so a rival can steal the one you miss. */
export interface RoundScore {
  title: number;
  artist: number;
}

export interface Score {
  teamName: string;
  rounds: RoundScore[]; // one entry per round played, in play order
}

export const emptyRound = (): RoundScore => ({ title: 0, artist: 0 });

/** Points a team scored on one round — title plus artist. */
export const roundTotal = (round: RoundScore | undefined) =>
  round ? round.title + round.artist : 0;

/**
 * Coerce a stored score of any past shape into the current model. Games are
 * live-only (wiped on new game), so this only matters for a mid-game refresh,
 * but it keeps totals intact across the format change:
 *   - legacy `{ points: number }`        → no rounds
 *   - legacy `{ roundPoints: number[] }` → each round's points land on title
 *   - current `{ rounds: RoundScore[] }` → passed through
 */
export const migrateScore = (raw: Record<string, unknown>): Score => {
  const teamName = typeof raw.teamName === "string" ? raw.teamName : "Team";
  if (Array.isArray(raw.rounds)) {
    return {
      teamName,
      rounds: (raw.rounds as Record<string, unknown>[]).map((r) => ({
        title: typeof r.title === "number" ? r.title : 0,
        artist: typeof r.artist === "number" ? r.artist : 0,
      })),
    };
  }
  if (Array.isArray(raw.roundPoints)) {
    return {
      teamName,
      rounds: (raw.roundPoints as number[]).map((p) => ({ title: p, artist: 0 })),
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
    rounds: [
      { title: 1, artist: 0 },
      { title: 0, artist: 0 },
      { title: 1, artist: 1 },
      { title: 1, artist: 0 },
    ],
  },
  {
    teamName: "Team Blue",
    rounds: [
      { title: 0, artist: 0 },
      { title: 1, artist: 1 },
      { title: 0, artist: 1 },
      { title: 1, artist: 1 },
    ],
  },
];
