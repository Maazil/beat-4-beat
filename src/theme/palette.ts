/**
 * Screen-print ink palette — flat poster colors that sit on cream paper.
 * Every category color in the app (game board, create page) draws from
 * this set so the whole product reads as one printed piece.
 */
export interface PosterInk {
  name: string;
  /** Solid print color: headers, borders, hard offset shadows. */
  ink: string;
  /** Darker press of the same ink: text on tints, hover states. */
  deep: string;
  /** Light wash: tile fills. */
  tint: string;
  tintHover: string;
}

export const POSTER_INKS: PosterInk[] = [
  { name: "coral", ink: "#e8264a", deep: "#a51330", tint: "#fbdde3", tintHover: "#f8ccd6" },
  { name: "marigold", ink: "#d98a0f", deep: "#7c5204", tint: "#f9e9c8", tintHover: "#f5dfae" },
  { name: "teal", ink: "#11857a", deep: "#0b5c54", tint: "#d8efe9", tintHover: "#c3e8df" },
  { name: "cobalt", ink: "#2e5bc7", deep: "#1e3d8c", tint: "#dee5f9", tintHover: "#cdd9f5" },
  { name: "plum", ink: "#a23b8f", deep: "#722762", tint: "#f3def0", tintHover: "#eccbe7" },
  { name: "forest", ink: "#4c8a3c", deep: "#33632a", tint: "#e2efda", tintHover: "#d2e6c6" },
];

export const posterInk = (index: number): PosterInk => POSTER_INKS[index % POSTER_INKS.length];
