import { POSTER_INKS } from "../../../theme/palette";

export interface CategoryColorScheme {
  // Computed style values
  titleBg: string;
  titleBgHover: string;
  itemBg: string;
  itemBgHover: string;
  border: string;
  textDark: string;
}

// Store assigned ink indices to avoid duplicates
const assignedInks: Map<string, number> = new Map();
let nextInkIndex = 0;

/**
 * Get or assign a poster ink for a category. Each new category gets the
 * next ink from the shared palette, matching the order used on the play
 * board, so a room looks the same while editing and while playing.
 */
function getInkForCategory(categoryId: string): number {
  if (assignedInks.has(categoryId)) {
    return assignedInks.get(categoryId)!;
  }

  const index = nextInkIndex % POSTER_INKS.length;
  assignedInks.set(categoryId, index);
  nextInkIndex++;

  return index;
}

/**
 * Clear a category's assigned ink when it's deleted.
 * This doesn't reassign inks — the deleted category's ink stays "used"
 * to maintain color stability for remaining categories.
 */
export function clearCategoryHue(categoryId: string): void {
  assignedInks.delete(categoryId);
}

/**
 * Reset all ink assignments (useful for testing or creating a new room).
 */
export function resetHueAssignments(): void {
  assignedInks.clear();
  nextInkIndex = 0;
}

/**
 * Generate a color scheme for a category based on its unique ID.
 * All values come from the shared screen-print palette.
 */
export function generateColorScheme(categoryId: string): CategoryColorScheme {
  const ink = POSTER_INKS[getInkForCategory(categoryId)];

  return {
    titleBg: ink.ink,
    titleBgHover: ink.deep,
    itemBg: ink.tint,
    itemBgHover: ink.tintHover,
    border: ink.ink,
    textDark: ink.deep,
  };
}

export const MAX_CATEGORIES = 6;
export const MAX_ITEMS_CREATE = 8;
export const MAX_ITEMS_DB = 10;
