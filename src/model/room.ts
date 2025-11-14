import type { Category } from "./category";
import type { Score } from "./score";

export interface Room {
  id: string;             // Unique room ID (e.g. nanoid)
  name: string;           // Room/game name
  hostId: string;         // User ID of host
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