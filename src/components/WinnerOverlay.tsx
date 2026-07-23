import { Component, createMemo, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { computeStandings, isLeadingStanding, rankTeams, totalOf } from "../lib/standings";
import { winningTeams } from "../lib/winner";
import type { Score } from "../model/score";

interface WinnerOverlayProps {
  scores: Score[];
  /** Host actions — omitted on the read-only audience view. */
  onNewGame?: () => void;
  onClose?: () => void;
}

const CONFETTI_COLORS = [
  "var(--color-beat)",
  "var(--color-beat-bright)",
  "var(--color-magenta-hot)",
  "var(--color-peri)",
  "var(--color-spotify)",
];

// Built once when the overlay mounts — a fixed spray of confetti pieces with
// varied lanes, colors, sizes, and timing. Not reactive; the moment is a
// one-shot celebration.
const confetti = Array.from({ length: 42 }, (_, i) => ({
  left: Math.random() * 100,
  delay: Math.random() * 2.5,
  duration: 2.8 + Math.random() * 2.6,
  size: 6 + Math.random() * 8,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  rounded: Math.random() > 0.6,
}));

/**
 * Celebratory end-of-game overlay: confetti, the winning team(s), and the
 * final standings. Rendered on the play page (with New-game / Back-to-board
 * actions) and mirrored on the audience view (read-only, no actions) whenever
 * the shared `gameState.gameOver` flag is set.
 */
const WinnerOverlay: Component<WinnerOverlayProps> = (props) => {
  const standings = createMemo(() => computeStandings(props.scores));
  const ranked = createMemo(() => rankTeams(props.scores, standings()));
  const winners = createMemo(() => winningTeams(props.scores));

  return (
    <Portal>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="winner-title"
      >
        <div class="absolute inset-0 bg-night/85 backdrop-blur-sm" />

        {/* Confetti — decorative, hidden from assistive tech */}
        <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <For each={confetti}>
            {(piece) => (
              <span
                class="confetti-piece"
                style={{
                  left: `${piece.left}%`,
                  width: `${piece.size}px`,
                  height: `${piece.size * 0.4}px`,
                  "background-color": piece.color,
                  "border-radius": piece.rounded ? "9999px" : "1px",
                  "animation-delay": `${piece.delay}s`,
                  "animation-duration": `${piece.duration}s`,
                }}
              />
            )}
          </For>
        </div>

        <div class="animate-rise-in relative w-full max-w-lg rounded-3xl border border-beat/40 bg-surface p-8 text-center shadow-2xl">
          <div class="mb-2 text-6xl" aria-hidden="true">
            🏆
          </div>

          <Show
            when={winners().length > 0}
            fallback={
              <h2 id="winner-title" class="font-display text-3xl font-bold text-ink">
                Game over
              </h2>
            }
          >
            <Show
              when={winners().length === 1}
              fallback={
                <div id="winner-title">
                  <p class="font-display text-2xl font-bold text-ink">It's a tie!</p>
                  <p class="mt-1 font-display text-3xl font-bold text-beat">
                    {winners().join(" & ")}
                  </p>
                </div>
              }
            >
              <h2 id="winner-title" class="font-display text-4xl font-bold text-beat">
                {winners()[0]}
                <span class="mt-1 block text-xl font-bold text-ink">wins!</span>
              </h2>
            </Show>
          </Show>

          {/* Final standings */}
          <Show when={props.scores.length > 0}>
            <div class="mt-6 flex flex-col gap-2 text-left">
              <For each={ranked()}>
                {(team) => {
                  const standing = () => standings().get(team.teamName);
                  const isTop = () => isLeadingStanding(standing());
                  return (
                    <div
                      class={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${
                        isTop() ? "border-beat/40 bg-beat-soft" : "border-line bg-night/70"
                      }`}
                    >
                      <span
                        class={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold ${
                          isTop()
                            ? "bg-beat text-night"
                            : "border border-line bg-surface text-muted"
                        }`}
                      >
                        {standing()?.rank}
                      </span>
                      <span class="min-w-0 flex-1 truncate font-display text-base font-bold text-ink">
                        {team.teamName}
                      </span>
                      <span
                        class={`shrink-0 font-mono text-2xl font-bold tabular-nums ${
                          isTop() ? "text-beat" : "text-ink"
                        }`}
                      >
                        {totalOf(team)}
                      </span>
                    </div>
                  );
                }}
              </For>
            </div>
          </Show>

          {/* Host actions — absent on the audience view */}
          <Show when={props.onNewGame || props.onClose}>
            <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Show when={props.onNewGame}>
                <button
                  type="button"
                  onClick={() => props.onNewGame?.()}
                  class="rounded-full bg-beat px-6 py-2.5 font-bold text-night transition hover:brightness-110"
                >
                  New game
                </button>
              </Show>
              <Show when={props.onClose}>
                <button
                  type="button"
                  onClick={() => props.onClose?.()}
                  class="rounded-full border border-line px-6 py-2.5 font-bold text-ink transition hover:border-beat hover:bg-beat-soft"
                >
                  Back to board
                </button>
              </Show>
            </div>
          </Show>
        </div>
      </div>
    </Portal>
  );
};

export default WinnerOverlay;
