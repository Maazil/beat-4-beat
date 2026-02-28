export interface CategoryColorScheme {
  hue: number;
  // Computed style values
  titleBg: string;
  titleBgHover: string;
  itemBg: string;
  itemBgHover: string;
  border: string;
  textDark: string;
}

// Store assigned hues to avoid duplicates
const assignedHues: Map<string, number> = new Map();
let nextHueIndex = 0;

// Base hues evenly distributed around the color wheel (360 / 6 = 60° apart)
// Starting positions chosen for visually distinct, appealing colors
const baseHues = [210, 270, 150, 45, 330, 180]; // blue, purple, green, orange, pink, teal

/**
 * Get or assign a unique hue for a category.
 * Each new category gets the next available hue from a predefined set,
 * ensuring maximum visual distinction between categories.
 */
function getHueForCategory(categoryId: string): number {
  // Return existing hue if already assigned
  if (assignedHues.has(categoryId)) {
    return assignedHues.get(categoryId)!;
  }

  // Assign next available hue
  const hue = baseHues[nextHueIndex % baseHues.length];

  // Add slight variation if we've cycled through all base hues
  const cycle = Math.floor(nextHueIndex / baseHues.length);
  const adjustedHue = (hue + cycle * 15) % 360; // Shift by 15° each cycle

  assignedHues.set(categoryId, adjustedHue);
  nextHueIndex++;

  return adjustedHue;
}

/**
 * Clear a category's assigned hue when it's deleted.
 * This doesn't reassign hues - deleted category's hue stays "used"
 * to maintain color stability for remaining categories.
 */
export function clearCategoryHue(categoryId: string): void {
  assignedHues.delete(categoryId);
}

/**
 * Reset all hue assignments (useful for testing or creating a new room).
 */
export function resetHueAssignments(): void {
  assignedHues.clear();
  nextHueIndex = 0;
}

/**
 * Generate a color scheme for a category based on its unique ID.
 * All colors share the same saturation and lightness for visual consistency.
 */
export function generateColorScheme(categoryId: string): CategoryColorScheme {
  const hue = getHueForCategory(categoryId);

  // Orange/warm hues (20-50) need higher saturation and lightness to not look brown
  const isWarmHue = hue >= 20 && hue <= 50;
  const saturation = isWarmHue ? 85 : 65;
  const lightness = isWarmHue ? 52 : 45;
  const lightnessHover = isWarmHue ? 47 : 40;

  return {
    hue,
    // Title background: saturated, medium-dark
    titleBg: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    titleBgHover: `hsl(${hue}, ${saturation}%, ${lightnessHover}%)`,
    // Item background: very light tint
    itemBg: `hsla(${hue}, ${saturation - 5}%, 50%, 0.1)`,
    itemBgHover: `hsla(${hue}, ${saturation - 5}%, 50%, 0.2)`,
    // Border: light version
    border: `hsl(${hue}, 50%, 80%)`,
    // Text: dark version for readability
    textDark: `hsl(${hue}, ${saturation - 5}%, 35%)`,
  };
}

export const MAX_CATEGORIES = 6;
export const MAX_ITEMS_CREATE = 5;
export const MAX_ITEMS_DB = 10;
