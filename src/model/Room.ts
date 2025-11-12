import { Category } from "./Category";
import { Score } from "./score";

export interface Room {
  id: string;             // Unique room ID (e.g. nanoid)
  name: string;           // Room/game name
  hostId: string;         // User ID of host
  categories: Category[]; // Music categories (Pop, 80s, etc.)
  scores?: Score[];       // Optional: team score tracking
  isActive: boolean;      // Game running state
  createdAt: number;      // Timestamp
}
