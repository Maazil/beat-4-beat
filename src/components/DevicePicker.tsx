import { Component, For, Show } from "solid-js";
import type { SpotifyDevice } from "../lib/spotify";

/** Icon for device types */
export const deviceIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "smartphone":
      return (
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      );
    case "computer":
      return (
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      );
    case "speaker":
      return (
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-4-4m4 4l4-4M5.636 5.636a9 9 0 1012.728 0"
          />
        </svg>
      );
    default:
      return (
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"
          />
        </svg>
      );
  }
};

interface DevicePickerProps {
  devices: SpotifyDevice[];
  isLoading: boolean;
  onSelect: (device: SpotifyDevice) => void;
  onRefresh: () => void;
}

/** Device picker shown before the game starts. */
const DevicePicker: Component<DevicePickerProps> = (props) => {
  return (
    <div class="rounded-2xl border border-line bg-surface p-6">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h3 class="font-display text-lg font-bold text-ink">Choose a playback device</h3>
          <p class="text-sm text-muted">Songs play on the selected device (phone, PC, speaker)</p>
        </div>
        <button
          type="button"
          onClick={() => props.onRefresh()}
          disabled={props.isLoading}
          class="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-muted transition hover:border-beat hover:text-beat disabled:opacity-50"
        >
          <svg
            class={`h-4 w-4 ${props.isLoading ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      <Show
        when={!props.isLoading}
        fallback={
          <div class="flex items-center justify-center py-8">
            <div class="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-beat" />
          </div>
        }
      >
        <Show
          when={props.devices.length > 0}
          fallback={
            <div class="rounded-xl border border-line bg-surface-2 p-4 text-center text-sm text-ink">
              No devices found. Open the Spotify app on your phone or computer and try again.
            </div>
          }
        >
          <div class="flex flex-col gap-2">
            <For each={props.devices}>
              {(device) => (
                <button
                  type="button"
                  onClick={() => props.onSelect(device)}
                  class={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-beat active:translate-y-0 ${
                    device.is_active
                      ? "border-spotify/40 bg-spotify/10"
                      : "border-line bg-surface-2"
                  }`}
                >
                  <span class={device.is_active ? "text-spotify" : "text-muted"}>
                    {deviceIcon(device.type)}
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-semibold text-ink">{device.name}</p>
                    <p class="text-xs text-muted">
                      {device.type}
                      {device.is_active && <span class="ml-1.5 text-spotify">• Active</span>}
                    </p>
                  </div>
                  <svg
                    class="h-4 w-4 text-muted"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  );
};

export default DevicePicker;
