export interface Score {
  teamName: string;
  points: number;         // e.g., 0–3 depending on correct guesses/performance
}

export const defaultScore = (overrides?: Partial<Score>): Score => ({
  teamName: "Team Blue",
  points: 0,
  ...overrides,
});

export const demoScores: Score[] = [
  { teamName: "Team Red", points: 2 },
  { teamName: "Team Blue", points: 3 },
];