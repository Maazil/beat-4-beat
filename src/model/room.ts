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
}

export interface CreateRoomData {
  name: string;                 // Name of the game room (set by host)
  hostId: string;               // Firebase user ID of the creator
  categories: Category[];       // Categories created by the host
  isActive?: boolean;           // Optional - starts false
}