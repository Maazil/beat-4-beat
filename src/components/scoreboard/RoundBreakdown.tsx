import { Component, For, Show } from "solid-js";
import { isSafeSongHref } from "../../lib/externalUrl";
import { totalOf } from "../../lib/standings";
import type { Score } from "../../model/score";

/** Song played on a given round, used to label the revealed breakdown. */
export interface RoundLabel {
  title?: string;
  artist?: string;
  /** Fallbacks for URL-only songs that have no title/artist set. */
  category?: string;
  level?: number;
  songUrl?: string;
}

interface RoundBreakdownProps {
  /** Teams ordered by rank (leaders first). */
  teams: Score[];
  /** Every round index played so far, oldest first. */
  rounds: number[];
  roundsPlayed: number;
  roundLabels?: RoundLabel[];
  isLeader: (name: string) => boolean;
}

/** Read-only round-by-round score table, shown alongside the revealed standings. */
const RoundBreakdown: Component<RoundBreakdownProps> = (props) => {
  return (
    <div class="mt-5 border-t border-line pt-4">
      <div class="mb-3 flex items-baseline justify-between gap-3">
        <h4 class="font-mono text-xs font-bold tracking-wide text-muted uppercase">
          Round-by-round
        </h4>
        <span class="font-mono text-[11px] text-muted">
          {props.roundsPlayed} {props.roundsPlayed === 1 ? "round" : "rounds"}
        </span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr>
              <th class="sticky left-0 z-10 bg-surface px-2 py-1.5 font-mono text-[11px] font-bold tracking-wide text-muted uppercase">
                Round
              </th>
              <For each={props.teams}>
                {(team) => (
                  <th class="px-2 py-1.5 text-center align-bottom">
                    <span class="block max-w-24 truncate font-display text-sm font-bold text-ink">
                      {team.teamName}
                    </span>
                  </th>
                )}
              </For>
            </tr>
          </thead>
          <tbody>
            <For each={props.rounds}>
              {(round) => {
                const label = () => props.roundLabels?.[round];
                // Tile descriptor for URL-only songs that carry no title
                const tileText = () => {
                  const l = label();
                  if (!l) return undefined;
                  const parts: string[] = [];
                  if (l.category) parts.push(l.category);
                  if (l.level != null) parts.push(`Level ${l.level}`);
                  return parts.length > 0 ? parts.join(" · ") : undefined;
                };
                return (
                  <tr class="border-t border-line/60">
                    <td class="sticky left-0 z-10 bg-surface px-2 py-1.5 align-top">
                      <div class="flex items-baseline gap-1.5">
                        <span class="shrink-0 font-mono text-xs font-bold text-beat-bright">
                          R{round + 1}
                        </span>
                        <Show
                          when={label()?.title}
                          fallback={
                            <Show when={tileText() || label()?.songUrl}>
                              {/* songUrl is host-provided — never link unsafe schemes */}
                              <Show
                                when={label()?.songUrl && isSafeSongHref(label()!.songUrl!)}
                                fallback={
                                  <span class="block max-w-44 truncate text-xs font-semibold text-ink">
                                    {tileText()}
                                  </span>
                                }
                              >
                                <a
                                  href={label()!.songUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  class="block max-w-44 truncate text-xs font-semibold text-beat-bright underline decoration-dotted underline-offset-2 transition hover:text-beat"
                                >
                                  {tileText() ?? "Open song"}
                                </a>
                              </Show>
                            </Show>
                          }
                        >
                          <span class="min-w-0">
                            <span class="block max-w-44 truncate text-xs font-semibold text-ink">
                              {label()!.title}
                            </span>
                            <Show when={label()?.artist}>
                              <span class="block max-w-44 truncate text-[10px] text-muted">
                                {label()!.artist}
                              </span>
                            </Show>
                          </span>
                        </Show>
                      </div>
                    </td>
                    <For each={props.teams}>
                      {(team) => {
                        const pts = () => team.roundPoints[round] ?? 0;
                        return (
                          <td class="px-2 py-1.5 text-center">
                            <span
                              class={`inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1 font-mono text-xs font-bold tabular-nums ${
                                pts() > 0 ? "bg-beat-soft text-beat-bright" : "text-muted/40"
                              }`}
                            >
                              {pts() > 0 ? `+${pts()}` : "·"}
                            </span>
                          </td>
                        );
                      }}
                    </For>
                  </tr>
                );
              }}
            </For>
          </tbody>
          <tfoot>
            <tr class="border-t-2 border-line">
              <td class="sticky left-0 z-10 bg-surface px-2 py-2 font-mono text-[11px] font-bold tracking-wide text-muted uppercase">
                Total
              </td>
              <For each={props.teams}>
                {(team) => (
                  <td
                    class={`px-2 py-2 text-center font-mono text-base font-bold tabular-nums ${
                      props.isLeader(team.teamName) ? "text-beat" : "text-ink"
                    }`}
                  >
                    {totalOf(team)}
                  </td>
                )}
              </For>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default RoundBreakdown;
