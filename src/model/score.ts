export interface Score {
  teamName: string;
  roundPoints: number[]; // points earned per round (one entry per song item)
}

export const defaultScore = (overrides?: Partial<Score>): Score => ({
  teamName: "Team Blue",
  roundPoints: [],
  ...overrides,
});

export const demoScores: Score[] = [
  { teamName: "Team Red", roundPoints: [1, 0, 2, 1] },
  { teamName: "Team Blue", roundPoints: [0, 2, 1, 2] },
];
