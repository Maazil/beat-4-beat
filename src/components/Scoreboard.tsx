import { Component, createSignal, For, Show } from "solid-js";
import type { Score } from "../model/score";

interface ScoreboardProps {
  scores: Score[];
  totalRounds: number;
  onUpdateScores: (scores: Score[]) => void;
}

const Scoreboard: Component<ScoreboardProps> = (props) => {
  const [newTeamName, setNewTeamName] = createSignal("");
  const [isAdding, setIsAdding] = createSignal(false);

  const handleAddTeam = () => {
    const name = newTeamName().trim();
    if (!name) return;

    const updated = [
      ...props.scores,
      { teamName: name, roundPoints: new Array(props.totalRounds).fill(0) },
    ];
    props.onUpdateScores(updated);
    setNewTeamName("");
    setIsAdding(false);
  };

  const handleRemoveTeam = (index: number) => {
    const team = props.scores[index];
    if (!confirm(`Are you sure you want to remove "${team.teamName}"?`)) return;
    const updated = props.scores.filter((_, i) => i !== index);
    props.onUpdateScores(updated);
  };

  const handleIncrement = (teamIndex: number, roundIndex: number) => {
    const updated = props.scores.map((s, i) => {
      if (i !== teamIndex) return s;
      const rp = [...s.roundPoints];
      // Ensure array is long enough
      while (rp.length <= roundIndex) rp.push(0);
      rp[roundIndex] = rp[roundIndex] + 1;
      return { ...s, roundPoints: rp };
    });
    props.onUpdateScores(updated);
  };

  const handleDecrement = (teamIndex: number, roundIndex: number) => {
    const updated = props.scores.map((s, i) => {
      if (i !== teamIndex) return s;
      const rp = [...s.roundPoints];
      while (rp.length <= roundIndex) rp.push(0);
      rp[roundIndex] = Math.max(0, rp[roundIndex] - 1);
      return { ...s, roundPoints: rp };
    });
    props.onUpdateScores(updated);
  };

  const totalPoints = (score: Score) => score.roundPoints.reduce((sum, p) => sum + p, 0);

  const roundValue = (score: Score, roundIndex: number) =>
    roundIndex < score.roundPoints.length ? score.roundPoints[roundIndex] : 0;

  return (
    <div class="rounded-2xl border border-line bg-paper p-4 shadow-sm">
      <div class="mb-6 flex items-center justify-between">
        <h3 class="font-display text-lg font-bold text-ink">Scoreboard</h3>
        <button
          type="button"
          onClick={() => setIsAdding(!isAdding())}
          class="rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-ink transition hover:border-beat hover:text-beat"
        >
          {isAdding() ? "Cancel" : "+ Add team"}
        </button>
      </div>

      {/* Add team form */}
      <Show when={isAdding()}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddTeam();
          }}
          class="mb-4 flex gap-2"
        >
          <input
            type="text"
            value={newTeamName()}
            onInput={(e) => setNewTeamName(e.currentTarget.value)}
            placeholder="Team name…"
            class="flex-1 rounded-xl border border-line bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-beat focus:ring-2 focus:ring-beat/20"
            autofocus
          />
          <button
            type="submit"
            disabled={!newTeamName().trim()}
            class="rounded-full bg-beat px-5 py-2 text-sm font-bold text-white transition hover:bg-beat-deep disabled:opacity-50"
          >
            Add
          </button>
        </form>
      </Show>

      {/* Scoreboard table */}
      <Show
        when={props.scores.length > 0}
        fallback={<p class="py-4 text-center text-sm text-muted">No teams added yet</p>}
      >
        <div class="overflow-x-auto">
          <table class="w-full text-sm" style="border-collapse: separate; border-spacing: 0;">
            <thead>
              <tr>
                <th
                  class="sticky left-0 z-10 border-b-2 border-ink/20 bg-paper px-3 pt-2 pr-4 pb-3 text-left font-semibold text-ink"
                  style="border-right: 3px solid var(--color-beat);"
                >
                  Team
                </th>
                <For each={Array.from({ length: props.totalRounds }, (_, i) => i)}>
                  {(roundIndex) => (
                    <th class="border-r border-b-2 border-ink/20 px-2 pt-2 pb-3 text-center font-mono font-semibold text-muted">
                      {roundIndex + 1}
                    </th>
                  )}
                </For>
                <th class="border-r border-b-2 border-ink/20 px-3 pt-2 pb-3 text-center font-semibold text-ink">
                  Total
                </th>
                <th class="w-8 border-b-2 border-ink/20" />
              </tr>
            </thead>
            <tbody>
              <For each={props.scores}>
                {(score, teamIndex) => (
                  <tr style="height: 3rem;">
                    <td
                      class="sticky left-0 z-10 border-b border-line bg-paper px-3 py-3 pr-4 font-semibold text-ink"
                      style="border-right: 3px solid var(--color-beat);"
                    >
                      {score.teamName}
                    </td>
                    <For each={Array.from({ length: props.totalRounds }, (_, i) => i)}>
                      {(roundIndex) => (
                        <td class="border-r border-b border-line px-3 py-3 text-center">
                          <div class="flex items-center justify-center gap-1">
                            <span class="w-6 text-center font-mono text-base font-bold text-ink">
                              {roundValue(score, roundIndex)}
                            </span>
                            <div class="flex flex-col gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleIncrement(teamIndex(), roundIndex)}
                                class="flex h-6 w-7 items-center justify-center rounded-t text-beat transition hover:bg-beat-soft active:scale-90"
                              >
                                <svg
                                  class="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="3"
                                    d="M5 15l7-7 7 7"
                                  />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDecrement(teamIndex(), roundIndex)}
                                class="flex h-6 w-7 items-center justify-center rounded-b text-muted transition hover:bg-sand active:scale-90"
                              >
                                <svg
                                  class="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="3"
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </td>
                      )}
                    </For>
                    <td class="border-r border-b border-line px-3 py-3 text-center font-mono text-lg font-bold text-beat">
                      {totalPoints(score)}
                    </td>
                    <td class="border-b border-line px-1 py-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveTeam(teamIndex())}
                        class="flex h-6 w-6 items-center justify-center rounded-full text-muted transition hover:bg-beat-soft hover:text-beat"
                      >
                        <svg
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
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Show>
    </div>
  );
};

export default Scoreboard;
