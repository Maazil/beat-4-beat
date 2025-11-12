export interface Score {
  teamName: string;
  points: number; // e.g., 0–3 depending on correct guesses/performance
}

export interface TeamScore {
  teamId: string; // Unique team identifier
  score: Score;
}

export interface LeaderBoardEntry {
  teamName: string;
  totalPoints: number;
}