import { Component, createMemo, createSignal, For, Show } from "solid-js";
import type { Score } from "../model/score";

interface ScoreboardProps {
  scores: Score[];
  /** Point value of the song currently in play — enables one-tap awarding. */
  pendingPoints?: number;
  /** Index of the round (song) currently in play; awards land on this round. */
  currentRound?: number;
  onUpdateScores: (scores: Score[]) => void;
}

const MAX_HISTORY_CHIPS = 12;

/**
 * Scoreboard for a shared screen. Rows keep a fixed order and totals stay
 * hidden while playing — several teams can score on the same round (e.g. a
 * title point and a stolen artist point). "Reveal standings" sorts the
 * teams with a FLIP animation and shows ranks and totals.
 */
const Scoreboard: Component<ScoreboardProps> = (props) => {
  const [isAdding, setIsAdding] = createSignal(false);
  const [newTeamName, setNewTeamName] = createSignal("");
  const [editingTeam, setEditingTeam] = createSignal<string | null>(null);
  const [editName, setEditName] = createSignal("");
  const [revealed, setRevealed] = createSignal(false);

  const rowEls = new Map<string, HTMLElement>();
  const chipEls = new Map<string, HTMLElement>();

  const totalOf = (score: Score) => score.roundPoints.reduce((sum, p) => sum + p, 0);

  const roundValue = (score: Score) =>
    props.currentRound != null ? (score.roundPoints[props.currentRound] ?? 0) : 0;

  // Rounds played so far — the current round plus everything already scored
  const roundsPlayed = () =>
    Math.max(
      props.currentRound != null ? props.currentRound + 1 : 0,
      ...props.scores.map((s) => s.roundPoints.length),
      0,
    );

  // name → revealed position and rank (ties share a rank, insertion order breaks them)
  const standings = createMemo(() => {
    const entries = props.scores.map((s, i) => ({ name: s.teamName, total: totalOf(s), i }));
    entries.sort((a, b) => b.total - a.total || a.i - b.i);
    const map = new Map<string, { order: number; rank: number; total: number }>();
    entries.forEach((entry, idx) => {
      const prev = idx > 0 ? map.get(entries[idx - 1].name) : undefined;
      const rank = prev && prev.total === entry.total ? prev.rank : idx + 1;
      map.set(entry.name, { order: idx, rank, total: entry.total });
    });
    return map;
  });

  const isLeader = (name: string) => {
    const standing = standings().get(name);
    return revealed() && standing != null && standing.rank === 1 && standing.total > 0;
  };

  // While playing, rows keep their insertion order; reveal sorts by total
  const orderOf = (name: string, insertionIndex: number) =>
    revealed() ? (standings().get(name)?.order ?? insertionIndex) : insertionIndex;

  // Run a state change and FLIP-animate any rows that move
  const withFlip = (mutate: () => void) => {
    const prevTops = new Map<string, number>();
    rowEls.forEach((el, name) => {
      if (el.isConnected) prevTops.set(name, el.getBoundingClientRect().top);
      else rowEls.delete(name);
    });
    mutate();
    rowEls.forEach((el, name) => {
      const prevTop = prevTops.get(name);
      if (prevTop == null || !el.isConnected) return;
      const delta = prevTop - el.getBoundingClientRect().top;
      if (Math.abs(delta) < 2) return;
      el.animate([{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }], {
        duration: 420,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      });
    });
  };

  const applyScores = (next: Score[]) => withFlip(() => props.onUpdateScores(next));

  const popChip = (name: string) => {
    chipEls
      .get(name)
      ?.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.35)", offset: 0.4 },
          { transform: "scale(1)" },
        ],
        { duration: 380, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
      );
  };

  const uniqueName = (raw: string) => {
    const base = raw.trim();
    if (!props.scores.some((s) => s.teamName === base)) return base;
    let n = 2;
    while (props.scores.some((s) => s.teamName === `${base} ${n}`)) n++;
    return `${base} ${n}`;
  };

  const handleAddTeam = () => {
    const name = newTeamName().trim();
    if (!name) return;
    applyScores([...props.scores, { teamName: uniqueName(name), roundPoints: [] }]);
    setNewTeamName("");
  };

  /** Add points to a team's score for the round currently in play. */
  const handleAward = (index: number, points: number) => {
    const round = props.currentRound;
    if (round == null) return;
    const team = props.scores[index];
    applyScores(
      props.scores.map((s, i) => {
        if (i !== index) return s;
        const rp = [...s.roundPoints];
        while (rp.length <= round) rp.push(0);
        rp[round] = Math.max(0, rp[round] + points);
        return { ...s, roundPoints: rp };
      }),
    );
    popChip(team.teamName);
  };

  const handleRemoveTeam = (index: number) => {
    const team = props.scores[index];
    if (totalOf(team) > 0 && !confirm(`Remove "${team.teamName}" and their points?`)) return;
    applyScores(props.scores.filter((_, i) => i !== index));
  };

  const startRename = (score: Score) => {
    setEditName(score.teamName);
    setEditingTeam(score.teamName);
  };

  const commitRename = (index: number) => {
    const name = editName().trim();
    const current = props.scores[index];
    setEditingTeam(null);
    if (!name || name === current.teamName) return;
    applyScores(
      props.scores.map((s, i) => (i === index ? { ...s, teamName: uniqueName(name) } : s)),
    );
  };

  /** Points per round for the history strip, capped to the most recent rounds. */
  const historyRounds = (score: Score) => {
    const played = roundsPlayed();
    const start = Math.max(0, played - MAX_HISTORY_CHIPS);
    return Array.from({ length: played - start }, (_, offset) => {
      const round = start + offset;
      return { value: score.roundPoints[round] ?? 0, isCurrent: round === props.currentRound };
    });
  };

  return (
    <section class="rounded-2xl border border-line bg-paper p-4 shadow-sm sm:p-5">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-baseline gap-3">
          <h3 class="font-display text-lg font-bold text-ink">Scoreboard</h3>
          <Show when={props.scores.length > 0}>
            <span class="font-mono text-xs tracking-wide text-muted uppercase">
              {props.scores.length} {props.scores.length === 1 ? "team" : "teams"}
            </span>
          </Show>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <Show when={props.currentRound != null && props.scores.length > 0}>
            <span class="rounded-full border border-beat/30 bg-beat-soft px-3 py-1 font-mono text-xs font-bold text-beat-deep">
              Round {props.currentRound! + 1}
              <Show when={props.pendingPoints != null}> · {props.pendingPoints} pts</Show>
            </span>
          </Show>
          <Show when={props.scores.length > 0}>
            <button
              type="button"
              onClick={() => withFlip(() => setRevealed(!revealed()))}
              class={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-bold transition ${
                revealed()
                  ? "border-beat/30 bg-beat-soft text-beat-deep"
                  : "border-ink text-ink shadow-[2px_2px_0_var(--color-ink)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--color-ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              }`}
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <Show
                  when={revealed()}
                  fallback={
                    <>
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </>
                  }
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </Show>
              </svg>
              {revealed() ? "Hide standings" : "Reveal standings"}
            </button>
          </Show>
        </div>
      </div>

      {/* Rows are ordered via flex `order` so DOM nodes stay stable for FLIP */}
      <div class="flex flex-col gap-2">
        <For each={props.scores}>
          {(score, index) => {
            const leader = () => isLeader(score.teamName);
            return (
              <div
                ref={(el) => rowEls.set(score.teamName, el)}
                style={{ order: orderOf(score.teamName, index()) }}
                class={`group flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors sm:gap-3 sm:px-4 ${
                  leader()
                    ? "border-beat bg-beat-soft/50 shadow-[3px_3px_0_var(--color-beat)]"
                    : "border-line bg-cream/70"
                }`}
              >
                {/* Rank — only once standings are revealed */}
                <Show when={revealed()}>
                  <span
                    class={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold ${
                      leader() ? "bg-beat text-white" : "border border-line bg-paper text-muted"
                    }`}
                  >
                    {standings().get(score.teamName)?.rank}
                  </span>
                </Show>

                <div class="min-w-0 flex-1">
                  <Show
                    when={editingTeam() === score.teamName}
                    fallback={
                      <button
                        type="button"
                        onClick={() => startRename(score)}
                        title="Rename team"
                        class="flex max-w-full items-center gap-1.5 text-left"
                      >
                        <span class="truncate font-display text-base font-bold text-ink">
                          {score.teamName}
                        </span>
                        <svg
                          class="h-3 w-3 shrink-0 text-muted opacity-0 transition group-hover:opacity-100"
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
                        commitRename(index());
                      }}
                    >
                      <input
                        type="text"
                        value={editName()}
                        onInput={(e) => setEditName(e.currentTarget.value)}
                        onBlur={() => commitRename(index())}
                        onKeyDown={(e) => e.key === "Escape" && setEditingTeam(null)}
                        maxLength={24}
                        class="w-full max-w-52 rounded-lg border border-beat bg-paper px-2 py-0.5 font-display text-base font-bold text-ink outline-none"
                        autofocus
                      />
                    </form>
                  </Show>

                  {/* Points per round, current round highlighted */}
                  <Show when={roundsPlayed() > 0}>
                    <div class="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] leading-tight">
                      <Show when={roundsPlayed() > MAX_HISTORY_CHIPS}>
                        <span class="text-muted">…</span>
                      </Show>
                      <For each={historyRounds(score)}>
                        {(round) => (
                          <span
                            class={
                              round.isCurrent
                                ? "font-bold text-beat-deep"
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

                {/* One-tap award for the song currently in play */}
                <Show when={props.pendingPoints != null && props.currentRound != null}>
                  <button
                    type="button"
                    onClick={() => handleAward(index(), props.pendingPoints!)}
                    title={`Award ${props.pendingPoints} points this round`}
                    class="shrink-0 rounded-full bg-beat px-3.5 py-1.5 font-mono text-sm font-bold text-white shadow-[2px_2px_0_var(--color-beat-deep)] transition hover:bg-beat-deep active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    +{props.pendingPoints}
                  </button>
                </Show>

                {/* Manual adjust — always targets the round in play */}
                <div class="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleAward(index(), -1)}
                    disabled={props.currentRound == null || roundValue(score) === 0}
                    title={
                      props.currentRound == null
                        ? "Play a song to start a round"
                        : "Take back a point this round"
                    }
                    class="flex h-7 w-7 items-center justify-center rounded-full border border-line text-muted transition hover:border-beat hover:text-beat disabled:cursor-default disabled:opacity-30 disabled:hover:border-line disabled:hover:text-muted"
                  >
                    <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2.5"
                        d="M20 12H4"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAward(index(), 1)}
                    disabled={props.currentRound == null}
                    title={
                      props.currentRound == null
                        ? "Play a song to start a round"
                        : "+1 point this round"
                    }
                    class="flex h-7 w-7 items-center justify-center rounded-full border border-line text-muted transition hover:border-beat hover:text-beat disabled:cursor-default disabled:opacity-30 disabled:hover:border-line disabled:hover:text-muted"
                  >
                    <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    ref={(el) => chipEls.set(score.teamName, el)}
                    title="Points this round"
                    class={`flex h-8 min-w-9 shrink-0 items-center justify-center rounded-lg border px-1.5 font-mono text-sm font-bold tabular-nums ${
                      roundValue(score) > 0
                        ? "border-beat/40 bg-beat-soft text-beat-deep"
                        : "border-line text-muted"
                    }`}
                  >
                    {roundValue(score) > 0 ? `+${roundValue(score)}` : "0"}
                  </span>
                </Show>

                {/* Total — hidden until standings are revealed */}
                <Show when={revealed()}>
                  <span
                    class={`w-10 shrink-0 text-right font-mono text-2xl font-bold tabular-nums sm:w-12 ${
                      leader() ? "text-beat" : "text-ink"
                    }`}
                  >
                    {totalOf(score)}
                  </span>
                </Show>

                <button
                  type="button"
                  onClick={() => handleRemoveTeam(index())}
                  title="Remove team"
                  class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted opacity-0 transition group-hover:opacity-100 hover:bg-beat-soft hover:text-beat"
                >
                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          }}
        </For>

        {/* Add team — pinned below the standings */}
        <div style={{ order: 9999 }}>
          <Show
            when={isAdding()}
            fallback={
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                class="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line px-3 py-2.5 text-sm font-semibold text-muted transition hover:border-beat hover:text-beat"
              >
                + {props.scores.length === 0 ? "Add your first team" : "Add team"}
              </button>
            }
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddTeam();
              }}
              class="flex gap-2"
            >
              <input
                type="text"
                value={newTeamName()}
                onInput={(e) => setNewTeamName(e.currentTarget.value)}
                onKeyDown={(e) => e.key === "Escape" && setIsAdding(false)}
                placeholder="Team name…"
                maxLength={24}
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
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewTeamName("");
                }}
                class="rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted transition hover:border-beat hover:text-beat"
              >
                Done
              </button>
            </form>
          </Show>
        </div>
      </div>
    </section>
  );
};

export default Scoreboard;
