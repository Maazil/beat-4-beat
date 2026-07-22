import { Component, For, Show } from "solid-js";
import { deviceIcon } from "../../components/DevicePicker";
import type { SpotifyDevice } from "../../lib/spotify";

interface RoomPlayHeaderProps {
  roomName?: string;
  hostNames: string[];
  selectedDevice: SpotifyDevice | null;
  spotifyConnected: boolean;
  gameStarted: boolean;
  onClearDevice: () => void;
  onNewGame: () => void;
  onFinishGame: () => void;
}

/** Play-page header: room title, hosts, selected device, and new-game. */
const RoomPlayHeader: Component<RoomPlayHeaderProps> = (props) => {
  return (
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <h1 class="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {props.roomName}
        </h1>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="flex flex-wrap items-center gap-2 text-sm font-medium text-muted">
            Hosted by
            <For each={props.hostNames}>
              {(name) => (
                <span class="inline-block rounded-full bg-beat px-4 py-1 text-sm font-bold tracking-wide text-night">
                  {name}
                </span>
              )}
            </For>
          </h2>

          {/* Selected Spotify device */}
          <Show when={props.selectedDevice}>
            {(device) => (
              <div class="flex items-center gap-3 rounded-xl border border-spotify/30 bg-spotify/10 px-3 py-1.5">
                <span class="text-spotify">{deviceIcon(device().type)}</span>
                <p class="text-sm font-semibold text-ink">Playing on: {device().name}</p>
                <button
                  type="button"
                  onClick={() => props.onClearDevice()}
                  class="text-xs text-muted underline transition hover:text-ink"
                >
                  Switch device
                </button>
              </div>
            )}
          </Show>

          <Show when={props.gameStarted}>
            <div class="flex items-center gap-2">
              <button
                type="button"
                onClick={() => props.onFinishGame()}
                class="rounded-full bg-beat px-3 py-1 text-xs font-bold text-night transition hover:brightness-110"
              >
                🏆 Finish game
              </button>
              <button
                type="button"
                onClick={() => props.onNewGame()}
                class="rounded-full border border-line px-3 py-1 text-xs font-bold text-ink transition hover:border-beat hover:bg-beat-soft"
              >
                New game
              </button>
            </div>
          </Show>
        </div>
      </div>

      {/* Spotify connection status */}
      <Show when={!props.spotifyConnected}>
        <div class="rounded-xl border border-line bg-surface-2 px-4 py-2 text-sm text-ink">
          Spotify is not connected. Connect Spotify from the dashboard to play songs directly.
        </div>
      </Show>
    </div>
  );
};

export default RoomPlayHeader;
