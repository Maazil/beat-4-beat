import { useParams } from "@solidjs/router";
import { Component, createSignal, For, Show } from "solid-js";
import { useRoom } from "../../hooks/useRoom";
import {
  isSpotifyLoggedIn,
  SpotifyPlayerProvider,
  useSpotifyPlayback,
  spotifyUrlToUri,
} from "../../lib/spotify";
import type { CurrentTrack, PlaybackState } from "../../lib/spotify";

const categoryColors = [
  {
    titleBg: "bg-gradient-to-r from-blue-600 to-blue-700",
    itemBg: "bg-blue-500/10",
    border: "border-blue-200",
    titleText: "text-white",
    itemText: "text-blue-700",
    shadow: "shadow-sm",
  },
  {
    titleBg: "bg-gradient-to-r from-purple-600 to-purple-700",
    itemBg: "bg-purple-500/10",
    border: "border-purple-200",
    titleText: "text-white",
    itemText: "text-purple-700",
    shadow: "shadow-sm",
  },
  {
    titleBg: "bg-gradient-to-r from-green-600 to-green-700",
    itemBg: "bg-green-500/10",
    border: "border-green-200",
    titleText: "text-white",
    itemText: "text-green-700",
    shadow: "shadow-sm",
  },
  {
    titleBg: "bg-gradient-to-r from-orange-600 to-orange-700",
    itemBg: "bg-orange-500/10",
    border: "border-orange-200",
    titleText: "text-white",
    itemText: "text-orange-700",
    shadow: "shadow-sm",
  },
  {
    titleBg: "bg-gradient-to-r from-pink-600 to-pink-700",
    itemBg: "bg-pink-500/10",
    border: "border-pink-200",
    titleText: "text-white",
    itemText: "text-pink-700",
    shadow: "shadow-sm",
  },
  {
    titleBg: "bg-gradient-to-r from-teal-600 to-teal-700",
    itemBg: "bg-teal-500/10",
    border: "border-teal-200",
    titleText: "text-white",
    itemText: "text-teal-700",
    shadow: "shadow-sm",
  },
];

/** Inner component that has access to the SpotifyPlayerProvider context. */
const RoomPlayInner: Component = () => {
  const params = useParams();
  const { room: currentRoom, isLoading } = useRoom(() => params.id);
  const [revealedItems, setRevealedItems] = createSignal<Set<string>>(
    new Set()
  );

  const spotifyConnected = isSpotifyLoggedIn();
  // Only call useSpotifyPlayback when we know the provider is above us
  const playback = spotifyConnected ? useSpotifyPlayback() : null;

  const handleItemClick = async (itemId: string, songUrl?: string, startTime?: number) => {
    setRevealedItems((prev) => new Set(prev).add(itemId));

    if (!songUrl) return;

    if (playback) {
      const uri = spotifyUrlToUri(songUrl);
      if (uri) {
        await playback.playSong(uri);
        if (startTime != null && startTime > 0) {
          // Small delay to let playback start before seeking
          setTimeout(() => playback.seek(startTime * 1000), 400);
        }
        return;
      }
    }

    // Fallback: open externally if no SDK or not a Spotify URL
    window.open(songUrl, "_blank");
  };

  return (
    <div class="min-h-screen bg-[#f4f6f8] p-6">
      <div class="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() => window.history.back()}
          class="mb-6 flex items-center gap-2 text-neutral-600 transition hover:text-neutral-900"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span class="font-medium">Tilbake</span>
        </button>

        <Show when={isLoading()}>
          <div class="flex items-center justify-center py-24">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-900" />
          </div>
        </Show>

        <Show when={!isLoading() && !currentRoom()}>
          <div class="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
            <p class="text-red-700">Rom ikke funnet</p>
          </div>
        </Show>

        <Show when={!isLoading() && currentRoom()}>
          <div class="flex flex-col gap-8">
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-2">
                <h1 class="text-3xl font-bold text-neutral-900">
                  {currentRoom()?.roomName}
                </h1>
                <h2 class="font-medium">
                  Laget av{" "}
                  <span class="rounded-full border bg-yellow-200 px-3 py-0.5 text-sm text-neutral-700">
                    {currentRoom()?.hostName}
                  </span>
                </h2>
              </div>
              <p class="text-neutral-600">Klikk på en rute for å velge sang</p>

              {/* Spotify connection status */}
              <Show when={!spotifyConnected}>
                <div class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
                  Spotify er ikke tilkoblet. Koble til Spotify fra dashbordet for å spille sanger direkte i nettleseren.
                </div>
              </Show>
            </div>

            <div class="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              <For each={currentRoom()?.categories}>
                {(category, index) => {
                  const colorScheme = () =>
                    categoryColors[index() % categoryColors.length];
                  return (
                    <div class="flex flex-col gap-4">
                      <div
                        class={`rounded-lg ${colorScheme().titleBg} border ${colorScheme().border} px-4 py-3 text-center ${colorScheme().shadow}`}
                      >
                        <h2
                          class={`text-lg font-semibold ${colorScheme().titleText} tracking-tight`}
                        >
                          {category.name}
                        </h2>
                      </div>

                      <div class="flex flex-col gap-3">
                        <For each={category.items}>
                          {(item) => (
                            <button
                              type="button"
                              class={`group flex h-16 w-full cursor-pointer items-center justify-center rounded-lg border-2 transition hover:scale-105 hover:shadow-lg active:scale-95 sm:h-20 ${
                                revealedItems().has(item.id)
                                  ? "border-dashed border-neutral-300 bg-neutral-100/50"
                                  : `${colorScheme().border} ${colorScheme().itemBg}`
                              }`}
                              onClick={() =>
                                handleItemClick(item.id, item.songUrl, item.startTime)
                              }
                            >
                              <span
                                class={`text-2xl font-bold ${
                                  revealedItems().has(item.id)
                                    ? "text-neutral-400"
                                    : colorScheme().itemText
                                } transition group-hover:scale-110`}
                              >
                                {item.level}
                              </span>
                            </button>
                          )}
                        </For>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        </Show>
      </div>

      {/* Now Playing bar */}
      <Show when={playback}>
        {(pb) => <NowPlayingBar currentTrack={pb().currentTrack()} playbackState={pb().playbackState()} onPause={() => pb().pause()} onResume={() => pb().resume()} />}
      </Show>
    </div>
  );
};

/** Minimal Now Playing bar fixed at the bottom of the screen. */
const NowPlayingBar: Component<{
  currentTrack: CurrentTrack | null;
  playbackState: PlaybackState;
  onPause: () => void;
  onResume: () => void;
}> = (props) => {
  return (
    <Show when={props.currentTrack}>
      {(track) => (
        <div class="fixed right-0 bottom-0 left-0 z-50 flex items-center gap-4 border-t border-neutral-200 bg-white px-6 py-3 shadow-lg">
          <Show when={track().albumArt}>
            <img
              src={track().albumArt}
              alt=""
              class="h-10 w-10 rounded"
            />
          </Show>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-neutral-900">
              {track().name}
            </p>
            <p class="truncate text-xs text-neutral-500">{track().artist}</p>
          </div>
          <button
            type="button"
            onClick={() =>
              props.playbackState.isPlaying ? props.onPause() : props.onResume()
            }
            class="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-white transition hover:bg-neutral-700"
          >
            <Show
              when={props.playbackState.isPlaying}
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
        </div>
      )}
    </Show>
  );
};

/** Top-level component that conditionally wraps with SpotifyPlayerProvider. */
const Play: Component = () => {
  return (
    <Show
      when={isSpotifyLoggedIn()}
      fallback={<RoomPlayInner />}
    >
      <SpotifyPlayerProvider>
        <RoomPlayInner />
      </SpotifyPlayerProvider>
    </Show>
  );
};

export default Play;
