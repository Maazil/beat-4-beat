export interface Score {
  teamName: string;
  roundPoints: number[]; // history of point awards, in the order they were given
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
