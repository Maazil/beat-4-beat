import { useParams } from "@solidjs/router";
import { Component, createMemo, For, Show } from "solid-js";
import GameBoard from "../../components/GameBoard";
import WinnerOverlay from "../../components/WinnerOverlay";
import { useRoom } from "../../hooks/useRoom";
import { buildItemIndex } from "../../lib/boardLookup";
import { roomHostNames } from "../../lib/roomHosts";
import { computeStandings, isLeadingStanding, rankTeams, totalOf } from "../../lib/standings";
import { defaultGameState } from "../../model/gameState";

/**
 * Read-only spectator view of a room in play. Mirrors the host's live board
 * and scores straight from the room document's `gameState` (kept current by
 * the room subscription) — no controls, no playback, nothing writable. Meant
 * for a second screen or a shared link; a QR "join on your phone" flow can
 * build on this later.
 */
const AudienceViewInner: Component = () => {
  const params = useParams();
  const { room, isLoading } = useRoom(() => params.id);

  const hostNames = () => {
    const r = room();
    return r ? roomHostNames(r) : [];
  };

  // Live host state from the room doc — audience members aren't editors, so
  // this reads the shared gameState directly rather than useGameState's
  // per-user localStorage fallback.
  const game = () => room()?.gameState ?? defaultGameState();
  const playOrder = () => game().playOrder;
  const scores = () => game().scores;
  const currentItemId = () => game().currentItemId;

  const isItemRevealed = (id: string) => playOrder().includes(id);
  const itemIndex = createMemo(() => buildItemIndex(room()?.categories ?? []));
  const currentItem = () => {
    const id = currentItemId();
    return id ? (itemIndex().get(id)?.item ?? null) : null;
  };
  // Only unspoil the title/artist once the host has revealed it.
  const trackRevealed = () => game().revealTrackInfo;
  // Celebrate in step with the host when they end the game.
  const gameOver = () => game().gameOver;

  const standings = createMemo(() => computeStandings(scores()));
  const rankedTeams = createMemo(() => rankTeams(scores(), standings()));

  return (
    <div class="bg-stage min-h-screen p-4 sm:p-6">
      <div class="mx-auto max-w-7xl">
        <Show when={isLoading()}>
          <div class="flex items-center justify-center py-24">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-line border-t-beat" />
          </div>
        </Show>

        <Show when={!isLoading() && !room()}>
          <div class="rounded-2xl border border-beat/30 bg-beat-soft p-8 text-center">
            <p class="text-beat-bright">Room not found</p>
          </div>
        </Show>

        <Show when={!isLoading() && room()}>
          <div class="flex flex-col gap-8">
            <div class="flex flex-col gap-2">
              <div class="flex flex-wrap items-center gap-3">
                <h1 class="font-display text-3xl font-bold tracking-tight text-ink">
                  {room()?.roomName}
                </h1>
                <span class="inline-flex items-center gap-1.5 rounded-full border border-beat/30 bg-beat-soft px-3 py-1 font-mono text-xs font-bold text-beat-bright">
                  <span class="h-1.5 w-1.5 rounded-full bg-beat" />
                  Audience view
                </span>
              </div>
              <h2 class="flex flex-wrap items-center gap-2 font-medium text-muted">
                Hosted by
                <For each={hostNames()}>
                  {(name) => (
                    <span class="inline-block rounded-full bg-beat px-4 py-1 text-sm font-bold tracking-wide text-night">
                      {name}
                    </span>
                  )}
                </For>
              </h2>
            </div>

            {/* Now playing — title/artist for the song currently in play */}
            <div class="rounded-2xl border border-line bg-surface p-4 sm:p-5">
              <p class="mb-1 font-mono text-xs tracking-wide text-muted uppercase">Now playing</p>
              <Show
                when={currentItem()}
                fallback={<p class="text-lg text-muted">Waiting for the host…</p>}
              >
                {(item) => (
                  <Show
                    when={trackRevealed()}
                    fallback={
                      <p class="font-display text-xl font-bold text-ink">🎵 Guess the track!</p>
                    }
                  >
                    <div>
                      <p class="font-display text-xl font-bold text-ink">
                        {item().title ?? "Now playing"}
                      </p>
                      <Show when={item().artist}>
                        <p class="text-muted">{item().artist}</p>
                      </Show>
                    </div>
                  </Show>
                )}
              </Show>
            </div>

            {/* Standings — read-only, ranked by total */}
            <Show when={scores().length > 0}>
              <section class="rounded-2xl border border-line bg-surface p-4 sm:p-5">
                <h3 class="mb-4 font-display text-lg font-bold text-ink">Standings</h3>
                <div class="flex flex-col gap-2">
                  <For each={rankedTeams()}>
                    {(team) => {
                      const standing = () => standings().get(team.teamName);
                      const isLeader = () => isLeadingStanding(standing());
                      return (
                        <div
                          class={`flex items-center gap-3 rounded-xl border px-3 py-2.5 sm:px-4 ${
                            isLeader() ? "border-beat/40 bg-beat-soft" : "border-line bg-night/70"
                          }`}
                        >
                          <span
                            class={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold ${
                              isLeader()
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
                              isLeader() ? "text-beat" : "text-ink"
                            }`}
                          >
                            {totalOf(team)}
                          </span>
                        </div>
                      );
                    }}
                  </For>
                </div>
              </section>
            </Show>

            {/* Board — reuses the play board, made non-interactive for viewers:
                interactive={false} disables the tiles and drops them from the
                tab order (no dead focus stops for keyboard/AT users). */}
            <div class="py-4">
              <GameBoard
                categories={room()?.categories ?? []}
                isItemRevealed={isItemRevealed}
                onItemClick={() => {}}
                interactive={false}
              />
            </div>
          </div>
        </Show>
      </div>

      {/* End-of-game celebration — mirrors the host's winner moment, read-only */}
      <Show when={gameOver()}>
        <WinnerOverlay scores={scores()} />
      </Show>
    </div>
  );
};

const AudienceView: Component = () => <AudienceViewInner />;

export default AudienceView;
