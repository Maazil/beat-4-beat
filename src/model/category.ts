import { SongItem } from "./songItem";

export interface Category {
  id: string;             // Random or auto-generated
  name: string;           // e.g. "Pop", "Rock", "Norske Hits"
  items: SongItem[];      // List of songs in this category
}

export const defaultCategory = (overrides?: Partial<Category>): Category => ({
  id: crypto.randomUUID(),
  name: "Genre",
  items: [],
  ...overrides,
});

export const demoCategories: Category[] = [
  {
    id: "category-001",
    name: "Pop Hits",
    items: [
      { id: "song-001", level: 1, isRevealed: false },
      { id: "song-002", level: 2, isRevealed: false },
      { id: "song-003", level: 3, isRevealed: false },
    ],
  },
  {
    id: "category-002",
    name: "Rock Classics",
    items: [
      { id: "song-101", level: 1, isRevealed: false },
      { id: "song-102", level: 2, isRevealed: false },
      { id: "song-103", level: 3, isRevealed: false },
    ],
  },
];