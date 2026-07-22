import { Component, For, Show } from "solid-js";
import type { Score } from "../model/score";

interface ScoreStripProps {
  scores: Score[];
  /** Round currently in play; enables the per-team round-points chip. */
  currentRound?: number;
  expanded: boolean;
  onToggle: () => void;
}

/**
 * Compact scoreboard summary for phones. Pins under the header while the board
 * scrolls; tap to open the full scoreboard for scoring. Mobile-only — the full
 * scoreboard is always inline on md+. Mirrors the scoreboard's rule of keeping
 * totals hidden during play, so it shows names and this round's awards only.
 */
const ScoreStrip: Component<ScoreStripProps> = (props) => {
  const roundValue = (score: Score) =>
    props.currentRound != null ? (score.roundPoints[props.currentRound] ?? 0) : 0;

  return (
    <button
      type="button"
      onClick={() => props.onToggle()}
      class="sticky top-0 z-40 flex w-full items-center gap-3 rounded-xl border border-line bg-surface/95 px-3 py-2.5 text-left backdrop-blur md:hidden"
    >
      <div class="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto">
        <Show
          when={props.scores.length > 0}
          fallback={<span class="text-sm font-semibold text-muted">Tap to add teams</span>}
        >
          <For each={props.scores}>
            {(score) => (
              <span class="flex shrink-0 items-baseline gap-1.5">
                <span class="max-w-28 truncate font-display text-sm font-bold text-ink">
                  {score.teamName}
                </span>
                <Show when={roundValue(score) > 0}>
                  <span class="font-mono text-xs font-bold text-beat-bright">
                    +{roundValue(score)}
                  </span>
                </Show>
              </span>
            )}
          </For>
        </Show>
      </div>

      <span class="flex shrink-0 items-center gap-1 text-xs font-bold text-muted">
        {props.expanded ? "Close" : "Scores"}
        <svg
          class={`h-4 w-4 transition-transform ${props.expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </span>
    </button>
  );
};

export default ScoreStrip;
