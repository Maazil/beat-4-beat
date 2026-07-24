import { Component, createSignal, For, Show } from "solid-js";
import { totalOf } from "../../lib/standings";
import type { Score } from "../../model/score";

const MAX_HISTORY_CHIPS = 12;

interface ScoreRowProps {
  score: Score;
  /** Flex `order` for the row — insertion order while playing, rank once revealed. */
  order: number;
  revealed: boolean;
  leader: boolean;
  /** 1-based rank, shown only once standings are revealed. */
  rank?: number;
  /** Round currently in play; awards land here. `null` when nothing is playing. */
  currentRound?: number;
  /** Rounds played so far — drives the history strip. */
  roundsPlayed: number;
  onAward: (points: number) => void;
  onRemove: () => void;
  onRename: (name: string) => void;
  registerRow: (el: HTMLElement) => void;
  registerChip: (el: HTMLElement) => void;
}

/**
 * A single interactive scoreboard row: rename, +/- awards for the round in
 * play, this-round chip, and (once revealed) rank + total. Owns its own inline
 * rename state; every score mutation is delegated to the parent.
 */
const ScoreRow: Component<ScoreRowProps> = (props) => {
  const [editing, setEditing] = createSignal(false);
  const [draft, setDraft] = createSignal("");

  const roundValue = () =>
    props.currentRound != null ? (props.score.roundPoints[props.currentRound] ?? 0) : 0;

  /** Points per round for the history strip, capped to the most recent rounds. */
  const historyRounds = () => {
    const played = props.roundsPlayed;
    const start = Math.max(0, played - MAX_HISTORY_CHIPS);
    return Array.from({ length: played - start }, (_, offset) => {
      const round = start + offset;
      return {
        value: props.score.roundPoints[round] ?? 0,
        isCurrent: round === props.currentRound,
      };
    });
  };

  const startRename = () => {
    setDraft(props.score.teamName);
    setEditing(true);
  };

  const commitRename = () => {
    const name = draft().trim();
    setEditing(false);
    if (!name || name === props.score.teamName) return;
    props.onRename(name);
  };

  return (
    <div
      ref={(el) => props.registerRow(el)}
      style={{ order: props.order }}
      class={`group flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors sm:gap-3 sm:px-4 ${
        props.leader ? "border-beat/40 bg-beat-soft" : "border-line bg-night/70"
      }`}
    >
      {/* Rank — only once standings are revealed */}
      <Show when={props.revealed}>
        <span
          class={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold ${
            props.leader ? "bg-beat text-night" : "border border-line bg-surface text-muted"
          }`}
        >
          {props.rank}
        </span>
      </Show>

      <div class="min-w-0 flex-1">
        <Show
          when={editing()}
          fallback={
            <button
              type="button"
              onClick={startRename}
              title="Rename team"
              // The visible label is just the name; without this the button
              // announces as the team, giving no hint that it renames it.
              aria-label={`Rename ${props.score.teamName}`}
              class="flex max-w-full items-center gap-1.5 text-left"
            >
              <span class="truncate font-display text-sm font-bold text-ink">
                {props.score.teamName}
              </span>
              <svg
                aria-hidden="true"
                class="h-3 w-3 shrink-0 text-muted opacity-100 transition md:opacity-0 md:group-hover:opacity-100"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
          }
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              commitRename();
            }}
          >
            <input
              type="text"
              value={draft()}
              onInput={(e) => setDraft(e.currentTarget.value)}
              onBlur={commitRename}
              onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
              maxLength={24}
              class="w-full max-w-52 rounded-lg border border-beat bg-surface px-2 py-0.5 font-display text-sm font-bold text-ink outline-none"
              autofocus
            />
          </form>
        </Show>

        {/* Points per round, current round highlighted (revealed view uses the full table below) */}
        <Show when={props.roundsPlayed > 0 && !props.revealed}>
          <div class="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] leading-tight">
            <Show when={props.roundsPlayed > MAX_HISTORY_CHIPS}>
              <span class="text-muted">…</span>
            </Show>
            <For each={historyRounds()}>
              {(round) => (
                <span
                  class={
                    round.isCurrent
                      ? "font-bold text-beat-bright"
                      : round.value > 0
                        ? "text-ink"
                        : "text-muted/60"
                  }
                >
                  {round.value}
                </span>
              )}
            </For>
          </div>
        </Show>
      </div>

      {/* Point buttons — always target the round in play */}
      <div class="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => props.onAward(-1)}
          disabled={props.currentRound == null || roundValue() === 0}
          title={
            props.currentRound == null
              ? "Play a song to start a round"
              : "Take back a point this round"
          }
          aria-label={`Take back a point from ${props.score.teamName}`}
          class="flex h-7 w-7 items-center justify-center rounded-full border border-line text-muted transition hover:border-beat hover:text-beat disabled:cursor-default disabled:opacity-30 disabled:hover:border-line disabled:hover:text-muted"
        >
          <svg
            aria-hidden="true"
            class="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => props.onAward(1)}
          disabled={props.currentRound == null}
          title={
            props.currentRound == null ? "Play a song to start a round" : "+1 point this round"
          }
          aria-label={`Award a point to ${props.score.teamName}`}
          class="flex h-7 w-7 items-center justify-center rounded-full border border-line text-muted transition hover:border-beat hover:text-beat disabled:cursor-default disabled:opacity-30 disabled:hover:border-line disabled:hover:text-muted"
        >
          <svg
            aria-hidden="true"
            class="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      {/* This round's points — the host's feedback that an award landed */}
      <Show when={props.currentRound != null}>
        <span
          ref={(el) => props.registerChip(el)}
          title="Points this round"
          class={`flex h-8 min-w-9 shrink-0 items-center justify-center rounded-lg border px-1.5 font-mono text-sm font-bold tabular-nums ${
            roundValue() > 0
              ? "border-beat/40 bg-beat-soft text-beat-bright"
              : "border-line text-muted"
          }`}
        >
          {roundValue() > 0 ? `+${roundValue()}` : "0"}
        </span>
      </Show>

      {/* Total — hidden until standings are revealed */}
      <Show when={props.revealed}>
        <span
          class={`w-10 shrink-0 text-right font-mono text-2xl font-bold tabular-nums sm:w-12 ${
            props.leader ? "text-beat" : "text-ink"
          }`}
        >
          {totalOf(props.score)}
        </span>
      </Show>

      <button
        type="button"
        onClick={() => props.onRemove()}
        title="Remove team"
        aria-label={`Remove ${props.score.teamName}`}
        class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted opacity-100 transition hover:bg-beat-soft hover:text-beat md:opacity-0 md:group-hover:opacity-100"
      >
        <svg
          aria-hidden="true"
          class="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};

export default ScoreRow;
