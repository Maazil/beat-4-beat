import { SongItem } from "./songItem";

export interface Category {
  id: string;             // Random or auto-generated
  name: string;           // e.g. "Pop", "Rock", "Norske Hits"
  items: SongItem[];      // List of songs in this category
}
