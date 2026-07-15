/*
  Hand-drawn SVG art for the host guide.

  One visual language across every diagram, so the page can be scanned:
    dashed periwinkle line = picture (screen mirroring)
    solid gold line        = sound (where the music flows)
    dotted magenta line    = control (what you steer from)
  Everything here is decorative — the copy beside each diagram carries
  the full instructions.
*/
import type { Component, JSX } from "solid-js";

const LINE = "rgba(198, 216, 255, 0.55)";
const TILE_FILL = "rgba(198, 216, 255, 0.09)";
const TILE_STROKE = "rgba(198, 216, 255, 0.22)";
const SCREEN = "#041f36";
const SHELL = "#0a314f";
const GOLD = "var(--gold)";
const MAGENTA = "var(--magenta-hot)";
/* Brand colors, not Stage Night tokens: so the icons read as the actual apps. */
const SPOTIFY_GREEN = "#1db954";
const YOUTUBE_RED = "#ff0033";

/* ── Shared drawing helpers ────────────────────────────────── */

function tiles(
  x: number,
  y: number,
  cols: number,
  rows: number,
  w: number,
  h: number,
  gap: number,
  gold?: [number, number],
): JSX.Element {
  const out: JSX.Element[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const hot = gold !== undefined && gold[0] === c && gold[1] === r;
      out.push(
        <rect
          x={x + c * (w + gap)}
          y={y + r * (h + gap)}
          width={w}
          height={h}
          rx={2}
          fill={hot ? GOLD : TILE_FILL}
          stroke={hot ? "none" : TILE_STROKE}
        />,
      );
    }
  }
  return out;
}

function laptop(x: number, y: number, w: number, h: number, screen?: JSX.Element): JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} rx={3.5} fill={SCREEN} stroke={LINE} stroke-width={1.5} />
      {screen}
      <path
        d={`M-7 ${h + 2.5} H ${w + 7} L ${w + 1} ${h + 8.5} H -1 Z`}
        fill={SHELL}
        stroke={LINE}
        stroke-width={1.5}
        stroke-linejoin="round"
      />
    </g>
  );
}

function tv(x: number, y: number, w: number, h: number, screen?: JSX.Element): JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} rx={4} fill={SCREEN} stroke={LINE} stroke-width={1.5} />
      {screen}
      <line x1={w / 2} y1={h} x2={w / 2} y2={h + 7} stroke={LINE} stroke-width={1.5} />
      <line
        x1={w / 2 - 14}
        y1={h + 8}
        x2={w / 2 + 14}
        y2={h + 8}
        stroke={LINE}
        stroke-width={1.5}
        stroke-linecap="round"
      />
    </g>
  );
}

function phone(x: number, y: number, w: number, h: number): JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} rx={5.5} fill={SCREEN} stroke={LINE} stroke-width={1.5} />
      <line
        x1={w / 2 - 4}
        y1={h - 5.5}
        x2={w / 2 + 4}
        y2={h - 5.5}
        stroke={LINE}
        stroke-width={1.5}
        stroke-linecap="round"
      />
    </g>
  );
}

function speaker(x: number, y: number, w: number, h: number): JSX.Element {
  const s = Math.min(w / 28, h / 46);
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} rx={6} fill={SHELL} stroke={LINE} stroke-width={1.5} />
      <circle cx={w / 2} cy={h * 0.28} r={4 * s} fill="none" stroke={LINE} stroke-width={1.5} />
      <circle cx={w / 2} cy={h * 0.66} r={8.5 * s} fill="none" stroke={LINE} stroke-width={1.5} />
      <circle cx={w / 2} cy={h * 0.66} r={2 * s} fill={LINE} />
    </g>
  );
}

function waves(x: number, y: number, color: string = GOLD): JSX.Element {
  return (
    <g
      transform={`translate(${x} ${y})`}
      fill="none"
      stroke={color}
      stroke-width={1.6}
      stroke-linecap="round"
    >
      <path d="M0 -5 a7 7 0 0 1 0 10" />
      <path d="M4 -9 a12 12 0 0 1 0 18" />
      <path d="M8 -13 a17 17 0 0 1 0 26" />
    </g>
  );
}

function arrow(x: number, y: number, angle: number, color: string): JSX.Element {
  return (
    <path
      transform={`translate(${x} ${y}) rotate(${angle})`}
      d="M1.5 0 L-6 -3.6 L-6 3.6 Z"
      fill={color}
    />
  );
}

function label(x: number, y: number, text: string, gold = false, small = false): JSX.Element {
  return (
    <text
      class={`ga-t${gold ? " ga-t-gold" : ""}${small ? " ga-t-sm" : ""}`}
      x={x}
      y={y}
      text-anchor="middle"
    >
      {text}
    </text>
  );
}

/* ── Flow strip: setup to playing at a glance ──────────────── */

const FlowIconBoard: Component = () => (
  <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
    <rect x="1.5" y="1.5" width="6" height="6" rx="1.5" />
    <rect x="10.5" y="1.5" width="6" height="6" rx="1.5" />
    <rect x="1.5" y="10.5" width="6" height="6" rx="1.5" />
    <rect x="10.5" y="10.5" width="6" height="6" rx="1.5" />
  </svg>
);

const FlowIconNote: Component = () => (
  <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
    <circle cx="5.5" cy="13" r="2.8" />
    <path d="M8.3 13 V 3.5 q 4.5 0.5 5.5 4.5" stroke-linecap="round" />
  </svg>
);

const FlowIconScreen: Component = () => (
  <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
    <rect x="1.5" y="3" width="15" height="10" rx="1.5" />
    <line x1="6" y1="15.5" x2="12" y2="15.5" stroke-linecap="round" />
  </svg>
);

const FlowIconPlay: Component = () => (
  <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
    <path d="M6 4.5 L 13.5 9 L 6 13.5 Z" stroke-linejoin="round" />
  </svg>
);

export const FlowStrip: Component = () => (
  <ol class="flow-strip" aria-label="How a game night comes together">
    <li>
      <span class="flow-ic">
        <FlowIconBoard />
      </span>
      <span class="flow-num mono">01</span>
      <span class="flow-label">Build a board</span>
    </li>
    <li>
      <span class="flow-ic">
        <FlowIconNote />
      </span>
      <span class="flow-num mono">02</span>
      <span class="flow-label">Sort the music</span>
    </li>
    <li>
      <span class="flow-ic">
        <FlowIconScreen />
      </span>
      <span class="flow-num mono">03</span>
      <span class="flow-label">Hit the big screen</span>
    </li>
    <li>
      <span class="flow-ic">
        <FlowIconPlay />
      </span>
      <span class="flow-num mono">04</span>
      <span class="flow-label">Reveal and play</span>
    </li>
  </ol>
);

/* ── Prep card illustrations ───────────────────────────────── */

export const BoardArt: Component = () => {
  const cells: JSX.Element[] = [];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 4; c++) {
      const hot = c === 2 && r === 0;
      const tx = 16 + c * 48;
      const ty = 26 + r * 32;
      cells.push(
        <rect
          x={tx}
          y={ty}
          width={40}
          height={26}
          rx={4}
          fill={hot ? GOLD : TILE_FILL}
          stroke={hot ? "none" : TILE_STROKE}
        />,
      );
      if (hot) {
        cells.push(
          <g transform={`translate(${tx + 20} ${ty + 13})`}>
            <circle cx="-3" cy="4.5" r="3" fill="#02182b" />
            <path
              d="M0 4.5 V -5.5 q 4 0.5 5 4"
              stroke="#02182b"
              stroke-width="2"
              fill="none"
              stroke-linecap="round"
            />
          </g>,
        );
      } else {
        cells.push(
          <text class="ga-num" x={tx + 20} y={ty + 17.5} text-anchor="middle">
            {(r + 1) * 10}
          </text>,
        );
      }
    }
  }
  return (
    <svg class="step-art" viewBox="0 0 216 96" aria-hidden="true">
      {[0, 1, 2, 3].map((c) => (
        <rect
          x={16 + c * 48}
          y={13}
          width={40}
          height={5}
          rx={2.5}
          fill="rgba(198, 216, 255, 0.3)"
        />
      ))}
      {cells}
    </svg>
  );
};

export const MusicArt: Component = () => (
  <svg class="step-art" viewBox="0 0 216 96" aria-hidden="true">
    <rect
      x={14}
      y={18}
      width={86}
      height={60}
      rx={10}
      fill="rgba(6, 39, 65, 0.9)"
      stroke={TILE_STROKE}
    />
    <circle cx={57} cy={40} r={11} fill="none" stroke={SPOTIFY_GREEN} stroke-width={1.6} />
    <g fill="none" stroke={SPOTIFY_GREEN} stroke-width={1.6} stroke-linecap="round">
      <path d="M51.5 36.5 q 5.5 -2.2 11 0" />
      <path d="M52.5 40.5 q 4.5 -1.8 9 0" />
      <path d="M53.5 44.5 q 3.5 -1.4 7 0" />
    </g>
    {label(57, 68, "SPOTIFY PREMIUM", false, true)}
    {label(108, 51, "OR")}
    <rect
      x={116}
      y={18}
      width={86}
      height={60}
      rx={10}
      fill="rgba(6, 39, 65, 0.9)"
      stroke={TILE_STROKE}
    />
    <rect x={145} y={31} width={28} height={19} rx={6} fill={YOUTUBE_RED} />
    <path d="M156 36.5 l 7 4 -7 4 z" fill="#fef9ff" />
    {label(159, 68, "YOUTUBE LINKS", false, true)}
  </svg>
);

export const ScreenArt: Component = () => (
  <svg class="step-art" viewBox="0 0 216 96" aria-hidden="true">
    {laptop(20, 40, 52, 33, tiles(6, 6, 3, 2, 12, 9, 3, [1, 0]))}
    {tv(126, 14, 76, 46, tiles(7, 7, 3, 2, 19, 13, 3.5, [1, 0]))}
    <path
      d="M76 34 C 88 20, 106 18, 122 27"
      fill="none"
      stroke={LINE}
      stroke-width={1.5}
      stroke-dasharray="5 4"
    />
    {arrow(123, 27.5, 30, LINE)}
    {label(99, 12, "MIRROR")}
  </svg>
);

export const SoundArt: Component = () => (
  <svg class="step-art" viewBox="0 0 216 96" aria-hidden="true">
    {laptop(18, 20, 44, 28)}
    {phone(34, 62, 18, 30)}
    {speaker(130, 22, 32, 54)}
    <path d="M70 36 C 96 36, 104 42, 126 44" fill="none" stroke={GOLD} stroke-width={2} />
    {arrow(127, 44, 4, GOLD)}
    <path d="M56 77 C 92 77, 102 62, 126 58" fill="none" stroke={GOLD} stroke-width={2} />
    {arrow(127, 58, -10, GOLD)}
    {waves(170, 49)}
  </svg>
);

/* ── Setup wiring diagrams ─────────────────────────────────── */

export const SetupLegend: Component = () => (
  <div class="setup-legend" aria-hidden="true">
    <span class="leg">
      <svg viewBox="0 0 26 8" aria-hidden="true">
        <line x1="1" y1="4" x2="25" y2="4" stroke={LINE} stroke-width="2" stroke-dasharray="5 4" />
      </svg>
      Picture
    </span>
    <span class="leg">
      <svg viewBox="0 0 26 8" aria-hidden="true">
        <line x1="1" y1="4" x2="25" y2="4" stroke={GOLD} stroke-width="2.5" />
      </svg>
      Sound
    </span>
    <span class="leg">
      <svg viewBox="0 0 26 8" aria-hidden="true">
        <line
          x1="2"
          y1="4"
          x2="25"
          y2="4"
          stroke={MAGENTA}
          stroke-width="2.5"
          stroke-dasharray="0.1 5.5"
          stroke-linecap="round"
        />
      </svg>
      Control
    </span>
  </div>
);

export const SetupAArt: Component = () => (
  <svg class="setup-art" viewBox="0 0 300 172" aria-hidden="true">
    {tv(106, 8, 88, 52, tiles(10, 8, 3, 2, 22, 15, 4, [0, 1]))}
    {label(150, 86, "BIG SCREEN")}
    {laptop(36, 104, 56, 36, tiles(6, 6, 3, 2, 13, 10, 3, [0, 1]))}
    {label(64, 164, "GAME + MUSIC", true)}
    {speaker(232, 104, 30, 48)}
    {label(247, 166, "SPEAKER")}
    <path
      d="M70 100 C 80 84, 94 74, 108 68"
      fill="none"
      stroke={LINE}
      stroke-width={1.5}
      stroke-dasharray="5 4"
    />
    {arrow(109, 67.5, -25, LINE)}
    <path d="M104 130 C 150 136, 190 136, 226 128" fill="none" stroke={GOLD} stroke-width={2} />
    {arrow(227, 128, -10, GOLD)}
    {waves(270, 128)}
  </svg>
);

export const SetupBArt: Component = () => (
  <svg class="setup-art" viewBox="0 0 300 172" aria-hidden="true">
    {tv(106, 8, 88, 52, tiles(10, 8, 3, 2, 22, 15, 4, [2, 0]))}
    {label(150, 86, "BIG SCREEN")}
    {laptop(30, 104, 56, 36, tiles(6, 6, 3, 2, 13, 10, 3, [2, 0]))}
    {label(58, 164, "GAME + MUSIC")}
    {speaker(152, 108, 28, 46)}
    {label(166, 168, "SPEAKER")}
    {phone(254, 100, 24, 44)}
    {label(266, 160, "REMOTE", true)}
    <path
      d="M64 100 C 74 84, 92 74, 106 68"
      fill="none"
      stroke={LINE}
      stroke-width={1.5}
      stroke-dasharray="5 4"
    />
    {arrow(107, 67.5, -25, LINE)}
    <path d="M92 132 C 112 136, 128 136, 148 131" fill="none" stroke={GOLD} stroke-width={2} />
    {arrow(149, 131, -12, GOLD)}
    <path
      d="M250 128 C 214 154, 138 152, 96 140"
      fill="none"
      stroke={MAGENTA}
      stroke-width={2}
      stroke-dasharray="0.1 6"
      stroke-linecap="round"
    />
    {arrow(94, 139.5, 197, MAGENTA)}
  </svg>
);

export const SetupCArt: Component = () => (
  <svg class="setup-art" viewBox="0 0 300 172" aria-hidden="true">
    {tv(106, 8, 88, 52, tiles(10, 8, 3, 2, 22, 15, 4, [1, 1]))}
    {label(150, 86, "BIG SCREEN")}
    {laptop(28, 104, 56, 36, tiles(6, 6, 3, 2, 13, 10, 3, [1, 1]))}
    {label(56, 164, "GAME")}
    {phone(158, 100, 24, 44)}
    {label(170, 160, "MUSIC", true)}
    {speaker(244, 104, 28, 46)}
    {label(258, 166, "SPEAKER")}
    <path
      d="M62 100 C 72 84, 90 74, 104 68"
      fill="none"
      stroke={LINE}
      stroke-width={1.5}
      stroke-dasharray="5 4"
    />
    {arrow(105, 67.5, -25, LINE)}
    <path
      d="M92 130 C 116 138, 132 136, 154 127"
      fill="none"
      stroke={MAGENTA}
      stroke-width={2}
      stroke-dasharray="0.1 6"
      stroke-linecap="round"
    />
    {arrow(155, 126.5, -18, MAGENTA)}
    <path d="M186 120 C 208 120, 220 121, 240 124" fill="none" stroke={GOLD} stroke-width={2} />
    {arrow(241, 124, 8, GOLD)}
    {waves(280, 127)}
  </svg>
);
