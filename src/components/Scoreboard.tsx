import { Component, createMemo, createSignal, For, Show } from "solid-js";
import { useConfirm } from "../context/ConfirmContext";
import { computeStandings, isLeadingStanding, rankTeams, totalOf } from "../lib/standings";
import type { Score } from "../model/score";
import AddTeamForm from "./scoreboard/AddTeamForm";
import RoundBreakdown, { type RoundLabel } from "./scoreboard/RoundBreakdown";
import ScoreRow from "./scoreboard/ScoreRow";
import { createScoreboardFlip } from "./scoreboard/scoreboardFlip";

interface ScoreboardProps {
  scores: Score[];
  /** Index of the round (song) currently in play; awards land on this round. */
  currentRound?: number;
  /** Song info per round (indexed by round) shown in the revealed breakdown. */
  roundLabels?: RoundLabel[];
  onUpdateScores: (scores: Score[]) => void;
}

/**
 * Scoreboard for a shared screen. Rows keep a fixed order and totals stay
 * hidden while playing — several teams can score on the same round (e.g. a
 * title point and a stolen artist point). "Reveal standings" sorts the
 * teams with a FLIP animation and shows ranks and totals.
 */
const Scoreboard: Component<ScoreboardProps> = (props) => {
  const confirm = useConfirm();
  const [revealed, setRevealed] = createSignal(false);
  const flip = createScoreboardFlip();

  // Rounds played so far — the current round plus everything already scored
  const roundsPlayed = () =>
    Math.max(
      props.currentRound != null ? props.currentRound + 1 : 0,
      ...props.scores.map((s) => s.roundPoints.length),
      0,
    );

  // name → revealed position and rank (ties share a rank, insertion order breaks them)
  const standings = createMemo(() => computeStandings(props.scores));

  const isLeader = (name: string) => revealed() && isLeadingStanding(standings().get(name));

  // Teams ordered by rank for the revealed round-by-round breakdown
  const breakdownTeams = createMemo(() => rankTeams(props.scores, standings()));

  // Every round index played so far, oldest first
  const allRounds = () => Array.from({ length: roundsPlayed() }, (_, round) => round);

  // While playing, rows keep their insertion order; reveal sorts by total
  const orderOf = (name: string, insertionIndex: number) =>
    revealed() ? (standings().get(name)?.order ?? insertionIndex) : insertionIndex;

  const applyScores = (next: Score[]) => flip.withFlip(() => props.onUpdateScores(next));

  const uniqueName = (raw: string) => {
    const base = raw.trim();
    if (!props.scores.some((s) => s.teamName === base)) return base;
    let n = 2;
    while (props.scores.some((s) => s.teamName === `${base} ${n}`)) n++;
    return `${base} ${n}`;
  };

  const handleAdd = (name: string) => {
    applyScores([...props.scores, { teamName: uniqueName(name), roundPoints: [] }]);
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
    flip.popChip(team.teamName);
  };

  const handleRemoveTeam = async (index: number) => {
    const team = props.scores[index];
    if (
      totalOf(team) > 0 &&
      !(await confirm({
        title: "Remove team",
        message: `Remove "${team.teamName}" and their points?`,
        confirmLabel: "Remove",
        tone: "danger",
      }))
    ) {
      return;
    }
    // Re-resolve by name rather than reusing `index`: awaiting the dialog opens
    // a window in which a co-owner's edit can shift or drop rows (scores are
    // live-synced through gameState), and team names are unique.
    const remaining = props.scores.filter((s) => s.teamName !== team.teamName);
    if (remaining.length === props.scores.length) return;
    applyScores(remaining);
  };

  const handleRename = (index: number, name: string) => {
    applyScores(
      props.scores.map((s, i) => (i === index ? { ...s, teamName: uniqueName(name) } : s)),
    );
  };

  return (
    <section class="rounded-2xl border border-line bg-surface p-4 sm:p-5">
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
            <span class="rounded-full border border-beat/30 bg-beat-soft px-3 py-1 font-mono text-xs font-bold text-beat-bright">
              Round {props.currentRound! + 1}
            </span>
          </Show>
          <Show when={props.scores.length > 0}>
            <button
              type="button"
              onClick={() => flip.withFlip(() => setRevealed(!revealed()))}
              class={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition ${
                revealed()
                  ? "border-beat/30 bg-beat-soft text-beat-bright"
                  : "border-line text-ink hover:border-beat hover:bg-beat-soft"
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
          {(score, index) => (
            <ScoreRow
              score={score}
              order={orderOf(score.teamName, index())}
              revealed={revealed()}
              leader={isLeader(score.teamName)}
              rank={standings().get(score.teamName)?.rank}
              currentRound={props.currentRound}
              roundsPlayed={roundsPlayed()}
              onAward={(points) => handleAward(index(), points)}
              onRemove={() => handleRemoveTeam(index())}
              onRename={(name) => handleRename(index(), name)}
              registerRow={(el) => flip.registerRow(score.teamName, el)}
              registerChip={(el) => flip.registerChip(score.teamName, el)}
            />
          )}
        </For>

        {/* Add team — pinned below the standings */}
        <AddTeamForm hasTeams={props.scores.length > 0} onAdd={handleAdd} />
      </div>

      {/* Round-by-round breakdown — appears with the standings so awards can be verified */}
      <Show when={revealed() && roundsPlayed() > 0 && props.scores.length > 0}>
        <RoundBreakdown
          teams={breakdownTeams()}
          rounds={allRounds()}
          roundsPlayed={roundsPlayed()}
          roundLabels={props.roundLabels}
          isLeader={isLeader}
        />
      </Show>
    </section>
  );
};

export default Scoreboard;
