import { STAGE_COLORS, STAGE_INKS } from "../theme/palette";

/**
 * Bundled category-header presets so hosts without their own artwork still get
 * a polished board. Each preset renders as an on-brand SVG data URL — tiny
 * (~1 KB of text, well under the Firestore doc limit) and stored inline on the
 * room document exactly like an uploaded {@link fileToCategoryImage} result.
 *
 * These are generated placeholders in the Stage Night palette; swap in real
 * WebP artwork later by pointing `image` at the asset instead of the generator.
 */
export interface CategoryPreset {
  id: string;
  /** Label baked into the artwork, also used as the default category name. */
  label: string;
  /** Index into {@link STAGE_INKS} — drives the gradient hue. */
  inkIndex: number;
}

export const CATEGORY_PRESETS: CategoryPreset[] = [
  { id: "eighties", label: "80s", inkIndex: 2 },
  { id: "nineties", label: "90s", inkIndex: 5 },
  { id: "twothousands", label: "2000s", inkIndex: 3 },
  { id: "twentytens", label: "2010s", inkIndex: 4 },
  { id: "rock", label: "Rock", inkIndex: 4 },
  { id: "pop", label: "Pop", inkIndex: 1 },
  { id: "hiphop", label: "Hip-Hop", inkIndex: 0 },
  { id: "rnb", label: "R&B", inkIndex: 5 },
  { id: "country", label: "Country", inkIndex: 3 },
  { id: "electronic", label: "Electronic", inkIndex: 3 },
  { id: "indie", label: "Indie", inkIndex: 3 },
  { id: "latin", label: "Latin", inkIndex: 0 },
  { id: "kpop", label: "K-Pop", inkIndex: 2 },
  { id: "movies", label: "Movies", inkIndex: 5 },
  { id: "soundtracks", label: "Soundtracks", inkIndex: 1 },
  { id: "modern", label: "Modern", inkIndex: 1 },
  { id: "tiktok", label: "TikTok", inkIndex: 2 },
  { id: "y2k", label: "Y2K", inkIndex: 5 },
  { id: "hitsonhits", label: "Hits on Hits", inkIndex: 0 },
  { id: "viral", label: "Viral", inkIndex: 0 },
  { id: "memes", label: "Memes", inkIndex: 3 },
  { id: "brainrot", label: "Brainrot", inkIndex: 4 },
  { id: "onehitwonders", label: "One-Hit Wonders", inkIndex: 1 },
  { id: "partyanthems", label: "Party Anthems", inkIndex: 4 },
  { id: "throwback", label: "Throwback", inkIndex: 5 },
  { id: "guiltypleasures", label: "Guilty Pleasures", inkIndex: 2 },
];

// A fixed equalizer silhouette so each preset renders deterministically
// (no per-render randomness); rotated per preset for a little variety.
const BAR_HEIGHTS = [26, 44, 18, 58, 34, 70, 40, 52, 22, 48, 30, 62, 38, 24];

const rotate = <T>(arr: T[], by: number): T[] => arr.map((_, i) => arr[(i + by) % arr.length]);

/**
 * Build the preset's header artwork as an `image/svg+xml` data URL: a diagonal
 * gradient in the preset's hue, an equalizer motif, a legibility scrim, and the
 * label. Shape matches the category header's 2:1 crop (400×200).
 */
export function presetImage(preset: CategoryPreset): string {
  const ink = STAGE_INKS[preset.inkIndex % STAGE_INKS.length];
  const bars = rotate(BAR_HEIGHTS, preset.id.length);
  const barWidth = 400 / BAR_HEIGHTS.length;

  const barRects = bars
    .map(
      (h, i) =>
        `<rect x="${(i * barWidth).toFixed(1)}" y="${200 - h}" width="${(barWidth - 4).toFixed(
          1,
        )}" height="${h}" fill="${STAGE_COLORS.ink}" opacity="0.12" rx="2"/>`,
    )
    .join("");

  // Scale the type down for longer labels so nothing overflows the 400-wide
  // crop, then size the legibility scrim to the resulting text width.
  const fontSize = Math.min(40, Math.floor(560 / Math.max(preset.label.length, 7)));
  const textWidth = preset.label.length * fontSize * 0.6;
  const scrimWidth = Math.min(360, Math.round(textWidth) + 40);
  const scrimX = ((400 - scrimWidth) / 2).toFixed(1);

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${ink.ink}"/>` +
    `<stop offset="1" stop-color="${STAGE_COLORS.navy}"/>` +
    `</linearGradient></defs>` +
    `<rect width="400" height="200" fill="${STAGE_COLORS.navy}"/>` +
    `<rect width="400" height="200" fill="url(#g)"/>` +
    barRects +
    // Scrim keeps the label legible over light hues (gold/peri) too.
    `<rect x="${scrimX}" y="72" width="${scrimWidth}" height="56" rx="12" fill="${STAGE_COLORS.navy}" opacity="0.42"/>` +
    `<text x="200" y="112" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,sans-serif" ` +
    `font-weight="800" font-size="${fontSize}" letter-spacing="-1" fill="${STAGE_COLORS.ink}">${preset.label}</text>` +
    `</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
