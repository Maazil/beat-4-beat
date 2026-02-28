import { Component, createSignal, For, Show } from "solid-js";
import type { Score } from "../model/score";

interface ScoreboardProps {
  scores: Score[];
  onUpdateScores: (scores: Score[]) => void;
}

const Scoreboard: Component<ScoreboardProps> = (props) => {
  const [newTeamName, setNewTeamName] = createSignal("");
  const [isAdding, setIsAdding] = createSignal(false);

  const handleAddTeam = () => {
    const name = newTeamName().trim();
    if (!name) return;

    const updated = [...props.scores, { teamName: name, points: 0 }];
    props.onUpdateScores(updated);
    setNewTeamName("");
    setIsAdding(false);
  };

  const handleIncrement = (index: number) => {
    const updated = props.scores.map((s, i) =>
      i === index ? { ...s, points: s.points + 1 } : s,
    );
    props.onUpdateScores(updated);
  };

  const handleDecrement = (index: number) => {
    const updated = props.scores.map((s, i) =>
      i === index ? { ...s, points: Math.max(0, s.points - 1) } : s,
    );
    props.onUpdateScores(updated);
  };

  const handleRemoveTeam = (index: number) => {
    const updated = props.scores.filter((_, i) => i !== index);
    props.onUpdateScores(updated);
  };

  return (
    <div class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-neutral-900">Poengstavle</h3>
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
            class="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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

      {/* Team list */}
      <Show
        when={props.scores.length > 0}
        fallback={
          <p class="py-4 text-center text-sm text-neutral-400">
            Ingen lag lagt til ennå
          </p>
        }
      >
        <div class="flex flex-col gap-2">
          <For each={props.scores}>
            {(score, index) => (
              <div class="flex items-center gap-3 rounded-lg bg-neutral-50 px-4 py-3">
                <span class="min-w-0 flex-1 truncate font-medium text-neutral-800">
                  {score.teamName}
                </span>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDecrement(index())}
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-700 transition hover:bg-red-200 active:scale-90"
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
                        stroke-width="2"
                        d="M20 12H4"
                      />
                    </svg>
                  </button>

                  <span class="w-10 text-center text-xl font-bold text-neutral-900">
                    {score.points}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleIncrement(index())}
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700 transition hover:bg-green-200 active:scale-90"
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
                        stroke-width="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveTeam(index())}
                  class="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 transition hover:bg-red-100 hover:text-red-600"
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
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

export default Scoreboard;
