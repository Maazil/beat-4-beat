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
    if (!confirm(`Er du sikker på at du vil fjerne "${team.teamName}"?`)) return;
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

  const totalPoints = (score: Score) =>
    score.roundPoints.reduce((sum, p) => sum + p, 0);

  const roundValue = (score: Score, roundIndex: number) =>
    roundIndex < score.roundPoints.length ? score.roundPoints[roundIndex] : 0;

  return (
    <div class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div class="mb-6 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-neutral-900">Poeng tabell</h3>
        <button
          type="button"
          onClick={() => setIsAdding(!isAdding())}
          class="rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-200"
        >
          {isAdding() ? "Avbryt" : "+ Legg til lag"}
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
            placeholder="Lagnavn..."
            class="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            autofocus
          />
          <button
            type="submit"
            disabled={!newTeamName().trim()}
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            Legg til
          </button>
        </form>
      </Show>

      {/* Scoreboard table */}
      <Show
        when={props.scores.length > 0}
        fallback={
          <p class="py-4 text-center text-sm text-neutral-400">
            Ingen lag lagt til ennå
          </p>
        }
      >
        <div class="overflow-x-auto">
          <table class="w-full text-sm" style="border-collapse: separate; border-spacing: 0;">
            <thead>
              <tr>
                <th class="sticky left-0 z-10 border-b-2 border-neutral-400 bg-white px-3 pb-3 pt-2 pr-4 text-left font-semibold text-neutral-700" style="box-shadow: 4px 0 8px -2px rgba(59,130,246,0.3); border-right: 3px solid rgb(96,165,250);">
                  Lag
                </th>
                <For
                  each={Array.from({ length: props.totalRounds }, (_, i) => i)}
                >
                  {(roundIndex) => (
                    <th class="border-b-2 border-r border-neutral-400 px-2 pb-3 pt-2 text-center font-semibold text-neutral-500" style="border-right-color: rgb(229,231,235);">
                      {roundIndex + 1}
                    </th>
                  )}
                </For>
                <th class="border-b-2 border-r border-neutral-400 px-3 pb-3 pt-2 text-center font-semibold text-neutral-900" style="border-right-color: rgb(212,212,216);">
                  Totalt
                </th>
                <th class="w-8 border-b-2 border-neutral-400" />
              </tr>
            </thead>
            <tbody>
              <For each={props.scores}>
                {(score, teamIndex) => (
                  <tr style="height: 3rem;">
                    <td class="sticky left-0 z-10 border-b border-neutral-200 bg-white px-3 py-3 pr-4 font-medium text-neutral-800" style="box-shadow: 4px 0 8px -2px rgba(59,130,246,0.3); border-right: 3px solid rgb(96,165,250);">
                      {score.teamName}
                    </td>
                    <For
                      each={Array.from(
                        { length: props.totalRounds },
                        (_, i) => i,
                      )}
                    >
                      {(roundIndex) => (
                        <td class="border-b border-r border-neutral-200 px-3 py-3 text-center">
                          <div class="flex items-center justify-center gap-1">
                            <span class="w-6 text-center font-mono text-base font-bold text-neutral-800">
                              {roundValue(score, roundIndex)}
                            </span>
                            <div class="flex flex-col gap-0.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleIncrement(teamIndex(), roundIndex)
                                }
                                class="flex h-6 w-7 items-center justify-center rounded-t text-green-600 transition hover:bg-green-100 active:scale-90"
                              >
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 15l7-7 7 7" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDecrement(teamIndex(), roundIndex)
                                }
                                class="flex h-6 w-7 items-center justify-center rounded-b text-red-500 transition hover:bg-red-100 active:scale-90"
                              >
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </td>
                      )}
                    </For>
                    <td class="border-b border-r border-neutral-300 px-3 py-3 text-center text-lg font-bold text-neutral-900">
                      {totalPoints(score)}
                    </td>
                    <td class="border-b border-neutral-200 px-1 py-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveTeam(teamIndex())}
                        class="flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 transition hover:bg-red-100 hover:text-red-600"
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
