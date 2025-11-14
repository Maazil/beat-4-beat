export interface SongItem {
  id: string;             // Unique per song
  level: number;          // 1–6 (difficulty or position)
  title: string;          // Song title
  artist: string;         // Artist name
  spotifyUrl?: string;    // Optional Spotify link
  youtubeUrl?: string;    // Optional YouTube link
  startTime?: number;     // Optional cue point (seconds)
  isRevealed: boolean;    // True if already chosen
}
