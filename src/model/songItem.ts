export interface SongItem {
  id: string;             // Unique per song
  level: number;          // 1–6 (difficulty or position)
  // title: string;          // Song title
  // artist: string;         // Artist name
  songUrl?: string;    // Optional Spotify / Youtube link
  startTime?: number;     // Optional cue point (seconds)
  isRevealed: boolean;    // True if already chosen
}

export const defaultSongItem = (overrides?: Partial<SongItem>): SongItem => ({
  id: crypto.randomUUID(),
  level: 1,
  isRevealed: false,
  ...overrides,
});

export const demoSongItems: SongItem[] = [
  {
    id: "song-001",
    level: 1,
    songUrl: "https://open.spotify.com/track/5CtI0qwDJkDQGwXD1H1cLb?si=d378916995b3457d",
    startTime: 30,
    isRevealed: false,
  },
  {
    id: "song-002",
    level: 2,
    songUrl: "hhttps://open.spotify.com/track/7CSQp9T3JtkjQGPmpR1vTb?si=4f65da5f08cd4756",
    isRevealed: false,
  },
  {
    id: "song-003",
    level : 3,
    songUrl: "https://open.spotify.com/track/7rcbwjIaZ5jEgyFk35Bqfj?si=1555eda05cc749dd",
    startTime: 45,
    isRevealed: false,
  },
];