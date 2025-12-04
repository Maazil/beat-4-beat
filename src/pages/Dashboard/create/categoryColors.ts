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

/**
 * Generate a unique hue (0-360) based on a category ID.
 * Uses a simple hash function to distribute colors across the spectrum.
 */
function hashToHue(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Use golden ratio to spread hues evenly
  const goldenRatio = 0.618033988749895;
  const hue = ((Math.abs(hash) * goldenRatio) % 1) * 360;
  return Math.round(hue);
}

/**
 * Generate a color scheme for a category based on its unique ID.
 * All colors share the same saturation and lightness for visual consistency.
 */
export function generateColorScheme(categoryId: string): CategoryColorScheme {
  const hue = hashToHue(categoryId);

  return {
    hue,
    // Title background: saturated, medium-dark
    titleBg: `hsl(${hue}, 65%, 45%)`,
    titleBgHover: `hsl(${hue}, 65%, 40%)`,
    // Item background: very light tint
    itemBg: `hsla(${hue}, 60%, 50%, 0.1)`,
    itemBgHover: `hsla(${hue}, 60%, 50%, 0.2)`,
    // Border: light version
    border: `hsl(${hue}, 50%, 80%)`,
    // Text: dark version for readability
    textDark: `hsl(${hue}, 60%, 35%)`,
  };
}

export const MAX_CATEGORIES = 6;
