import { Component, createSignal, For, Show } from "solid-js";

interface TurnTrackerProps {
  /** Teams in scoreboard order. */
  teamNames: string[];
  /** Rounds started so far (play-order length) — drives whose turn it is. */
  roundsStarted: number;
}

/**
 * Shows which team picks the current round and who is up next, rotating
 * through the teams in scoreboard order as rounds are played. The rotation
 * is derived, not stored: team for round r is teams[r % teams.length],
 * plus a local offset so the host can hand the next pick to any team by
 * clicking them.
 */
const TurnTracker: Component<TurnTrackerProps> = (props) => {
  const [offset, setOffset] = createSignal(0);

  const count = () => props.teamNames.length;
  const mod = (v: number) => ((v % count()) + count()) % count();

  // Team answering the round in play (none before the first song)
  const nowIndex = () => (props.roundsStarted > 0 ? mod(props.roundsStarted - 1 + offset()) : null);
  // Team that picks the next song
  const nextIndex = () => mod(props.roundsStarted + offset());

  const makeNext = (index: number) => setOffset(offset() + index - nextIndex());

  return (
    <Show when={count() >= 2}>
      <section class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line bg-surface px-4 py-3">
        <h3 class="font-display text-sm font-bold tracking-wide text-ink uppercase">Turn</h3>

        <div class="flex flex-wrap items-center gap-2">
          <For each={props.teamNames}>
            {(name, index) => (
              <button
                type="button"
                title={index() === nextIndex() ? undefined : `Give ${name} the next pick`}
                onClick={() => makeNext(index())}
                class={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition ${
                  index() === nowIndex()
                    ? "border-beat bg-beat text-night"
                    : index() === nextIndex()
                      ? "border-beat/40 bg-beat-soft text-beat-bright"
                      : "border-line text-muted hover:border-beat hover:text-ink"
                }`}
              >
                <Show when={index() === nowIndex()}>
                  {/* Microphone — this team is answering the current round */}
                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </Show>
                {name}
              </button>
            )}
          </For>
        </div>

        <p class="font-mono text-xs text-muted">
          <Show
            when={nowIndex() != null}
            fallback={<>first pick: {props.teamNames[nextIndex()]}</>}
          >
            on the mic: {props.teamNames[nowIndex()!]} · next: {props.teamNames[nextIndex()]}
          </Show>
        </p>
      </section>
    </Show>
  );
};

export default TurnTracker;
