import type { Category } from "../model/category";

/**
 * Category header images are data URLs of 5–15 KB each. Kept on the room
 * document they dominate every read of that room — including the dashboard
 * and marketplace grids, which only show a name, a count and a date. So they
 * live in a doc of their own (`rooms/{roomId}/assets/categoryImages`, a
 * categoryId → data URL map) that only the board views and the editor fetch.
 *
 * `Category.imageUrl` still exists in memory: the service layer splits images
 * out on write and callers that need them merge them back in on read. Rooms
 * saved before the split still carry the field inline, and both helpers here
 * treat that as the fallback, so no migration is needed — a room moves to the
 * new shape the next time it's saved.
 */

/** categoryId → data URL, the shape of the `categoryImages` asset document. */
export type CategoryImageMap = Record<string, string>;

export interface SplitCategories {
  /** Categories with `imageUrl` dropped — what the room document stores. */
  categories: Category[];
  /** The extracted images. Empty when no category has one. */
  images: CategoryImageMap;
}

/**
 * Pull the header images out of a board, ready for a two-document write.
 *
 * The key is deleted rather than set to `undefined`, because Firestore
 * rejects `undefined` field values outright.
 */
export const splitCategoryImages = (categories: Category[]): SplitCategories => {
  const images: CategoryImageMap = {};

  const stripped = categories.map((category) => {
    if (!category.imageUrl) return category;
    images[category.id] = category.imageUrl;
    const { imageUrl: _imageUrl, ...rest } = category;
    return rest;
  });

  return { categories: stripped, images };
};

/**
 * Put the images back on a board for code that reads `category.imageUrl`
 * (the editor's draft store). A category keeps whatever it already had when
 * the map has nothing for it, which is what carries un-split rooms through.
 *
 * Returns the original array untouched when there's nothing to apply, so a
 * board with no images keeps its object identities.
 */
export const mergeCategoryImages = (
  categories: Category[],
  images: CategoryImageMap | null | undefined,
): Category[] => {
  if (!images || Object.keys(images).length === 0) return categories;

  return categories.map((category) => {
    const imageUrl = images[category.id];
    return imageUrl ? { ...category, imageUrl } : category;
  });
};
