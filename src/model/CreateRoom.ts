import { Category } from "./Category";

export interface CreateRoomData {
  name: string;                 // Name of the game room (set by host)
  hostId: string;               // Firebase user ID of the creator
  categories: Category[];       // Categories created by the host
  isActive?: boolean;           // Optional - starts false
}
