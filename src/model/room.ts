import type { Category } from "./category";
import type { Score } from "./score";

export interface Room {
  id: string; // Unique room ID (e.g. nanoid)
  roomName: string; // Room/game name
  hostId: string; // User ID of host
  hostName: string; // Optional: Host display name
  categories: Category[]; // Music categories (Pop, 80s, etc.)
  showCategories?: boolean; // Optional: whether categories are shown
  scores?: Score[]; // Optional: team score tracking
  isActive: boolean; // Game running state
  createdAt: Date | number; // Timestamp
  isPublic: boolean;
}

export interface CreateRoomData {
  roomName: string; // Name of the game room (set by host)
  hostName: string; // Host display name
  categories: Category[]; // Categories created by the host
  showCategories?: boolean; // Optional - defaults to true
  isActive?: boolean; // Optional - starts false
  isPublic: boolean;
  createdAt: Date | number; // Timestamp
}

