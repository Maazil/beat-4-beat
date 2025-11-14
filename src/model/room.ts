import type { Category } from "./category";
import type { Score } from "./score";

export interface Room {
  id: string;             // Unique room ID (e.g. nanoid)
  name: string;           // Room/game name
  hostId: string;         // User ID of host
  hostName: string;      // Optional: Host display name
  categories: Category[]; // Music categories (Pop, 80s, etc.)
  scores?: Score[];       // Optional: team score tracking
  isActive: boolean;      // Game running state
  createdAt: number;      // Timestamp
  isPublic?: boolean;     // Optional: public visibility
}

export interface CreateRoomData {
  name: string;                 // Name of the game room (set by host)
  hostId: string;               // Firebase user ID of the creator
  categories: Category[];       // Categories created by the host
  isActive?: boolean;           // Optional - starts false
  isPublic?: boolean;           // Optional - starts false
}

export const defaultRoomData = (overrides?: Partial<CreateRoomData>): CreateRoomData => ({
  name: "My Beat Room",
  hostId: "Maazil",
  categories: [],
  isActive: false,
  isPublic: false,
  ...overrides,
});

export const demoRoom = {
  id: "demo-room-001",
  name: "Demo Beat Room",
  hostId: "demo-host-123",
  hostName: "DJ Demo",
  categories: [
    { id: "category-001", name: "Pop Hits", items: [
      { id: "song-001", level: 1, isRevealed: false },
      { id: "song-002", level: 2, isRevealed: false },
      { id: "song-003", level: 3, isRevealed: false },
    ] },
    { id: "category-002", name: "Rock Classics", items: [ 
      { id: "song-101", level: 1, isRevealed: false },
      { id: "song-102", level: 2, isRevealed: false },
      { id: "song-103", level: 3, isRevealed: false },
    ] },
    { id: "category-003", name: "Norske Hits", items: [
      { id: "song-201", level: 1, isRevealed: false },
      { id: "song-202", level: 2, isRevealed: false },
      { id: "song-203", level: 3, isRevealed: false },
    ] },
    { id: "category-004", name: "80s Favorites", items: [
      { id: "song-301", level: 1, isRevealed: false },
      { id: "song-302", level: 2, isRevealed: false },
      { id: "song-303", level: 3, isRevealed: false },
    ] },
    { id: "category-005", name: "Tiktok Trends", items: [
      { id: "song-401", level: 1, isRevealed: false },
      { id: "song-402", level: 2, isRevealed: false },
      { id: "song-403", level: 3, isRevealed: false },
    ] },
  ],
  isActive: true,
  createdAt: Date.now(),
  isPublic: true,
}

export const drakeRoom = {
  id: "marvins-room",
  name: "Drakes catalogue",
  hostId: "drizzy-drake",
  hostName: "Drizzy drake",
  categories: [
    { id: "category-001", name: "Take care", items: [
      { id: "song-001", level: 1, songUrl: "https://open.spotify.com/track/6LxSe8YmdPxy095Ux6znaQ?si=766830a755a4489f", isRevealed: false },
      { id: "song-002", level: 2, songUrl: "https://open.spotify.com/track/047fCsbO4NdmwCBn8pcUXl?si=497ac0becc7a4db5", isRevealed: false },
      { id: "song-003", level: 3, songUrl: "https://open.spotify.com/track/4Kz4RdRCceaA9VgTqBhBfa?si=1eafa1ac7c8041ed", isRevealed: false },
    ] },
    { id: "category-002", name: "Views", items: [ 
      { id: "song-101", level: 1, songUrl: "https://open.spotify.com/track/3O8NlPh2LByMU9lSRSHedm?si=9525aa2245844190", isRevealed: false },
      { id: "song-102", level: 2, songUrl: "https://open.spotify.com/track/1zi7xx7UVEFkmKfv06H8x0?si=c032cced255144f6", isRevealed: false },
      { id: "song-103", level: 3, songUrl: "https://open.spotify.com/track/5mPSyjLatqB00IkPqRlbTE?si=1bfdd9458468443a", isRevealed: false },
    ] },
    { id: "category-003", name: "$$$4U", items: [
      { id: "song-201", level: 1, songUrl: "https://open.spotify.com/track/4u43I0LP2Xf85OAS85eG0R?si=addb78f7d4a141dc", isRevealed: false },
      { id: "song-202", level: 2, songUrl: "https://open.spotify.com/track/2u9S9JJ6hTZS3Vf22HOZKg?si=9fc5736a116f499b", isRevealed: false },
      { id: "song-203", level: 3, songUrl: "https://open.spotify.com/track/0NUqi0ps17YpLUC3kgsZq0?si=c0c981c6bb444707", isRevealed: false },
    ] },
    { id: "category-004", name: "Certified Lover Boy", items: [
      { id: "song-301", level: 1, songUrl: "https://open.spotify.com/track/37Nqx7iavZpotJSDXZWbJ3?si=6e9b2d845e6c4419", isRevealed: false },
      { id: "song-302", level: 2, songUrl: "https://open.spotify.com/track/11pEKMLmavDu8fxOB5QjbQ?si=01a08c40c82b43de", isRevealed: false },
      { id: "song-303", level: 3, songUrl: "https://open.spotify.com/track/1PDP7mLiAMwhfmgIwzhOm2?si=2410ffa42f2d4646", isRevealed: false },
    ] },
    { id: "category-005", name: "Mix", items: [
      { id: "song-401", level: 1, songUrl: "https://open.spotify.com/track/6DCZcSspjsKoFjzjrWoCdn?si=281f5ccce86a40be", isRevealed: false },
      { id: "song-402", level: 2, songUrl: "https://open.spotify.com/track/4wVOKKEHUJxHCFFNUWDn0B?si=8e322b2e5de94c68", isRevealed: false },
      { id: "song-403", level: 3, songUrl: "https://open.spotify.com/track/3dgQqOiQ9fCKVhNOedd2lf?si=93797b66e3594a3d", isRevealed: false },
      { id: "song-404", level: 4, songUrl: "https://open.spotify.com/track/7JXZq0JgG2zTrSOAgY8VMC?si=bc4f592ad1924fef", isRevealed: false },
      { id: "song-405", level: 5, songUrl: "https://open.spotify.com/track/5mCPDVBb16L4XQwDdbRUpz?si=a5c060e15e544875", isRevealed: false },
    ] },
  ],
  isActive: true,
  createdAt: Date.now(),
  isPublic: true,
}