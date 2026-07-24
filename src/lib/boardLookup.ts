import type { Category } from "../model/category";
import type { SongItem } from "../model/songItem";

/** A song together with the category it lives in. */
export interface LocatedItem {
  item: SongItem;
  category: Category;
}

/** Song played on a given round, used to label the revealed breakdown. */
export interface RoundLabel {
  title?: string;
  artist?: string;
  /** Fallbacks for URL-only songs that have no title/artist set. */
  category?: string;
  level?: number;
  songUrl?: string;
}

/**
 * id → song + category index — lookups during play stay O(1)
 * instead of scanning every category.
 */
export function buildItemIndex(categories: Category[]): Map<string, LocatedItem> {
  const index = new Map<string, LocatedItem>();
  for (const category of categories) {
    for (const item of category.items) {
      index.set(item.id, { item, category });
    }
  }
  return index;
}

/**
 * Songs still unplayed, in board order — the pool the lightning-round picker
 * draws from.
 */
export function unplayedItems(
  categories: Category[],
  isRevealed: (id: string) => boolean,
): SongItem[] {
  return categories.flatMap((c) => c.items).filter((item) => !isRevealed(item.id));
}

/**
 * Pick a random unplayed song, preferring ones that actually have a URL — on a
 * manual click the host chose that tile, but a random pick landing on a
 * URL-less song would reveal it and play nothing, reading as a bug. Falls back
 * to the URL-less songs once nothing playable is left, and returns null on an
 * exhausted board. `random` is injectable for tests.
 */
export function pickRandomUnplayed(items: SongItem[], random = Math.random): SongItem | null {
  const playable = items.filter((item) => item.songUrl);
  const pool = playable.length > 0 ? playable : items;
  if (pool.length === 0) return null;
  return pool[Math.floor(random() * pool.length)];
}

/**
 * Song played on each round (by play order) — labels the revealed breakdown.
 * Carries category/level/link so URL-only songs (no title) stay identifiable.
 */
export function buildRoundLabels(
  playOrder: string[],
  index: Map<string, LocatedItem>,
): RoundLabel[] {
  return playOrder.map((id) => {
    const found = index.get(id);
    const item = found?.item;
    return {
      title: item?.title,
      artist: item?.artist,
      category: found?.category.name,
      level: item?.level,
      songUrl: item?.songUrl,
    };
  });
}
