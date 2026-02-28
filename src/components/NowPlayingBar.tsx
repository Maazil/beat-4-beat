import { Component, Show } from "solid-js";
import SeekBar from "./SeekBar";

interface NowPlayingBarProps {
  positionMs: number;
  durationMs: number;
  isPlaying: boolean;
  trackTitle?: string;
  trackArtist?: string;
  showTrackInfo: boolean;
  onToggleTrackInfo: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkipForward: () => void;
  onSkipBackward: () => void;
  onSeek: (ms: number) => void;
}

const NowPlayingBar: Component<NowPlayingBarProps> = (props) => {
  return (
    <div class="fixed right-0 bottom-0 left-0 z-50 border-t border-neutral-200 bg-white shadow-lg">
      {/* Progress / seek bar */}
      <Show when={props.durationMs > 0}>
        <SeekBar
          positionMs={props.positionMs}
          durationMs={props.durationMs}
          onSeek={props.onSeek}
        />
      </Show>

      <div class="flex items-center gap-4 px-6 py-3">
        {/* Hidden track info with reveal toggle */}
        <div class="min-w-0 flex-1">
          <Show
            when={props.showTrackInfo && (props.trackTitle || props.trackArtist)}
            fallback={
              <div class="flex items-center gap-2">
                <div class="flex h-10 w-10 items-center justify-center rounded bg-neutral-100">
                  <svg
                    class="h-5 w-5 text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium text-neutral-900">
                    Sang spilles...
                  </p>
                  <p class="text-xs text-neutral-500">
                    Trykk avsløre for å vise
                  </p>
                </div>
              </div>
            }
          >
            <div class="flex items-center gap-2">
              <div class="flex h-10 w-10 items-center justify-center rounded bg-green-100">
                <svg
                  class="h-5 w-5 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                </svg>
              </div>
              <div>
                <p class="truncate text-sm font-medium text-neutral-900">
                  {props.trackTitle || "Ukjent sang"}
                </p>
                <p class="truncate text-xs text-neutral-500">
                  {props.trackArtist || "Ukjent artist"}
                </p>
              </div>
            </div>
          </Show>
        </div>

        {/* Reveal button */}
        <button
          type="button"
          onClick={() => props.onToggleTrackInfo()}
          class={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
            props.showTrackInfo
              ? "border-green-300 bg-green-50 text-green-700"
              : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
          }`}
        >
          <Show
            when={props.showTrackInfo}
            fallback={
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            }
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
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              />
            </svg>
          </Show>
          {props.showTrackInfo ? "Skjul" : "Avsløre"}
        </button>

        {/* Skip back 10s */}
        <button
          type="button"
          onClick={() => props.onSkipBackward()}
          class="flex h-8 w-8 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
          title="-10s"
        >
          <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.5 3C7.81 3 4.01 6.54 3.68 11H1l3.89 3.89.07.14L9 11H6.73c.32-3.12 2.97-5.5 6.27-5.5A6.5 6.5 0 0 1 19.5 12 6.5 6.5 0 0 1 13 18.5c-1.83 0-3.45-.75-4.63-1.96l-1.42 1.42A8.46 8.46 0 0 0 13 20.5a8.5 8.5 0 0 0 8.5-8.5A8.5 8.5 0 0 0 13 3.5h-.5V3z" />
            <text
              x="10"
              y="16"
              font-size="7"
              font-weight="bold"
              text-anchor="middle"
            >
              10
            </text>
          </svg>
        </button>

        {/* Play / Pause */}
        <button
          type="button"
          onClick={() => (props.isPlaying ? props.onPause() : props.onResume())}
          class="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white transition hover:bg-neutral-700"
        >
          <Show
            when={props.isPlaying}
            fallback={
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            }
          >
            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          </Show>
        </button>

        {/* Skip forward 10s */}
        <button
          type="button"
          onClick={() => props.onSkipForward()}
          class="flex h-8 w-8 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
          title="+10s"
        >
          <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.5 3v.5A8.5 8.5 0 0 0 3 12a8.5 8.5 0 0 0 8.5 8.5 8.46 8.46 0 0 0 6.05-2.54l-1.42-1.42A6.47 6.47 0 0 1 11.5 18.5 6.5 6.5 0 0 1 5 12a6.5 6.5 0 0 1 6.5-6.5c3.3 0 5.95 2.38 6.27 5.5H15l4.04 3.89.07-.14L23 11h-2.68c-.33-4.46-4.13-8-7.82-8z" />
            <text
              x="14"
              y="16"
              font-size="7"
              font-weight="bold"
              text-anchor="middle"
            >
              10
            </text>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default NowPlayingBar;
