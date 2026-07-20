/**
 * Stage-light ink palette — bright hues that read on the deep navy stage.
 * Every category color in the app (game board, create page) draws from
 * this set so the whole product reads as one night under the lights.
 */
export interface StageInk {
  name: string;
  /** Full-strength hue: category headers, borders, tile numbers. */
  ink: string;
  /** Brighter lift of the same hue: text on tints, hover states. */
  bright: string;
  /** Translucent wash over the navy: tile fills. */
  tint: string;
  tintHover: string;
}

export const STAGE_INKS: StageInk[] = [
  {
    name: "gold",
    ink: "#eac435",
    bright: "#f2d157",
    tint: "rgba(234, 196, 53, 0.1)",
    tintHover: "rgba(234, 196, 53, 0.18)",
  },
  {
    name: "peri",
    ink: "#c6d8ff",
    bright: "#dde7ff",
    tint: "rgba(198, 216, 255, 0.1)",
    tintHover: "rgba(198, 216, 255, 0.18)",
  },
  {
    name: "magenta",
    ink: "#c2158f",
    bright: "#ea5ec4",
    tint: "rgba(194, 21, 143, 0.16)",
    tintHover: "rgba(194, 21, 143, 0.26)",
  },
  {
    name: "teal",
    ink: "#2ec4b6",
    bright: "#66dfd3",
    tint: "rgba(46, 196, 182, 0.12)",
    tintHover: "rgba(46, 196, 182, 0.2)",
  },
  {
    name: "coral",
    ink: "#ff5d73",
    bright: "#ff8b9b",
    tint: "rgba(255, 93, 115, 0.12)",
    tintHover: "rgba(255, 93, 115, 0.2)",
  },
  {
    name: "violet",
    ink: "#9d8cff",
    bright: "#bcb0ff",
    tint: "rgba(157, 140, 255, 0.12)",
    tintHover: "rgba(157, 140, 255, 0.2)",
  },
];

export const stageInk = (index: number): StageInk => STAGE_INKS[index % STAGE_INKS.length];

/**
 * Stage Night core colors as literal values, for canvas and SVG art that can't
 * reference the CSS custom properties. Mirror the `@theme` tokens in
 * `src/index.css` one-to-one — keep the two in sync if a token ever changes.
 */
export const STAGE_COLORS = {
  navy: "#02182b", // --color-night
  surface2: "#0a314f", // --color-surface-2
  gold: "#eac435", // --color-beat
  peri: "#c6d8ff", // --color-peri
  magentaHot: "#c2158f", // --color-magenta-hot
  ink: "#fef9ff", // --color-ink
  spotify: "#1db954", // --color-spotify
  youtube: "#ff0033", // --color-youtube
} as const;
