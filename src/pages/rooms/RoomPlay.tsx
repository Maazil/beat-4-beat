import { useParams } from "@solidjs/router";
import { Component, createSignal, For, Show } from "solid-js";
import { useRoom } from "../../hooks/useRoom";
import { usePlaybackProgress } from "../../hooks/usePlaybackProgress";
import {
  isSpotifyLoggedIn,
  getAccessToken,
  getDevices,
  playOnDevice,
  pausePlayback,
  resumePlayback,
  seekPlayback,
  spotifyUrlToUri,
} from "../../lib/spotify";
import type { SpotifyDevice } from "../../lib/spotify";
import DevicePicker, { deviceIcon } from "../../components/DevicePicker";
import NowPlayingBar from "../../components/NowPlayingBar";

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

/** Main room play page. */
const RoomPlayInner: Component = () => {
  const params = useParams();
  const { room: currentRoom, isLoading } = useRoom(() => params.id);

  // Device selection
  const [devices, setDevices] = createSignal<SpotifyDevice[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = createSignal(false);
  const [selectedDevice, setSelectedDevice] =
    createSignal<SpotifyDevice | null>(null);

  // Playback state
  const [revealedItems, setRevealedItems] = createSignal<Set<string>>(
    new Set(),
  );
  const [currentItemId, setCurrentItemId] = createSignal<string | null>(null);
  const [showTrackInfo, setShowTrackInfo] = createSignal(false);

  // Playback progress hook
  const playback = usePlaybackProgress();

  const spotifyConnected = isSpotifyLoggedIn();

  const fetchDevices = async () => {
    setIsLoadingDevices(true);
    try {
      const devs = await getDevices();
      setDevices(devs);
    } catch (err) {
      console.error("[RoomPlay] Failed to fetch devices:", err);
    } finally {
      setIsLoadingDevices(false);
    }
  };

  const handleSelectDevice = (device: SpotifyDevice) => {
    setSelectedDevice(device);
  };

  const handleItemClick = async (
    itemId: string,
    songUrl?: string,
    startTime?: number,
  ) => {
    setRevealedItems((prev) => new Set(prev).add(itemId));
    setCurrentItemId(itemId);
    setShowTrackInfo(false);

    if (!songUrl) return;

    const device = selectedDevice();
    if (spotifyConnected && device) {
      const uri = spotifyUrlToUri(songUrl);
      if (uri) {
        try {
          const posMs =
            startTime != null && startTime > 0 ? startTime * 1000 : 0;
          await playOnDevice(uri, device.id, posMs);
          playback.setIsPlaying(true);
          playback.startPolling(posMs);
        } catch (err) {
          console.error("[RoomPlay] Play failed:", err);
          window.open(songUrl, "_blank");
        }
        return;
      }
    }

    // Fallback: open externally if no device or not a Spotify URL
    window.open(songUrl, "_blank");
  };

  const handlePause = async () => {
    try {
      await pausePlayback();
      playback.setIsPlaying(false);
    } catch (err) {
      console.error("[RoomPlay] Pause failed:", err);
    }
  };

  const handleResume = async () => {
    try {
      await resumePlayback();
      playback.setIsPlaying(true);
    } catch (err) {
      console.error("[RoomPlay] Resume failed:", err);
    }
  };

  const handleSkipForward = async () => {
    try {
      const token = await getAccessToken();
      const res = await fetch("https://api.spotify.com/v1/me/player", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        await seekPlayback(data.progress_ms + 10_000);
      }
    } catch (err) {
      console.error("[RoomPlay] Skip forward failed:", err);
    }
  };

  const handleSkipBackward = async () => {
    try {
      const token = await getAccessToken();
      const res = await fetch("https://api.spotify.com/v1/me/player", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        await seekPlayback(Math.max(0, data.progress_ms - 10_000));
      }
    } catch (err) {
      console.error("[RoomPlay] Skip backward failed:", err);
    }
  };

  // Find the currently playing item's stored info
  const currentItemInfo = () => {
    const id = currentItemId();
    if (!id) return null;
    const room = currentRoom();
    if (!room) return null;
    for (const cat of room.categories) {
      for (const item of cat.items) {
        if (item.id === id) return item;
      }
    }
    return null;
  };

  return (
    <div class="min-h-screen bg-[#f4f6f8] p-6 pb-24">
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

              {/* Spotify connection status */}
              <Show when={!spotifyConnected}>
                <div class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
                  Spotify er ikke tilkoblet. Koble til Spotify fra dashbordet
                  for å spille sanger direkte.
                </div>
              </Show>
            </div>

            {/* Device picker — shown until a device is selected */}
            <Show when={spotifyConnected && !selectedDevice()}>
              <div class="mx-auto w-full max-w-lg">
                <Show
                  when={devices().length > 0 || isLoadingDevices()}
                  fallback={
                    <div class="text-center">
                      <p class="mb-4 text-neutral-600">
                        Koble til en Spotify-enhet for å spille sanger
                      </p>
                      <button
                        type="button"
                        onClick={fetchDevices}
                        class="rounded-lg bg-[#1DB954] px-6 py-2.5 font-semibold text-white transition hover:bg-[#1aa34a]"
                      >
                        Finn enheter
                      </button>
                    </div>
                  }
                >
                  <DevicePicker
                    devices={devices()}
                    isLoading={isLoadingDevices()}
                    onSelect={handleSelectDevice}
                    onRefresh={fetchDevices}
                  />
                </Show>
              </div>
            </Show>

            {/* Selected device indicator */}
            <Show when={selectedDevice()}>
              {(device) => (
                <div class="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-2">
                  <span class="text-green-600">
                    {deviceIcon(device().type)}
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-green-900">
                      Spiller på: {device().name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDevice(null);
                      fetchDevices();
                    }}
                    class="text-xs text-green-700 underline transition hover:text-green-900"
                  >
                    Bytt enhet
                  </button>
                </div>
              )}
            </Show>

            {/* Game board */}
            <Show when={selectedDevice() || !spotifyConnected}>
              <div>
                <p class="mb-4 text-neutral-600">
                  Klikk på en rute for å spille sang
                </p>
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
                                    handleItemClick(
                                      item.id,
                                      item.songUrl,
                                      item.startTime,
                                    )
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
        </Show>
      </div>

      {/* Bottom control bar — shown when a song is playing */}
      <Show when={currentItemId()}>
        <NowPlayingBar
          positionMs={playback.positionMs()}
          durationMs={playback.durationMs()}
          isPlaying={playback.isPlaying()}
          trackTitle={currentItemInfo()?.title}
          trackArtist={currentItemInfo()?.artist}
          showTrackInfo={showTrackInfo()}
          onToggleTrackInfo={() => setShowTrackInfo(!showTrackInfo())}
          onPause={handlePause}
          onResume={handleResume}
          onSkipForward={handleSkipForward}
          onSkipBackward={handleSkipBackward}
          onSeek={(ms) => playback.seekTo(ms)}
        />
      </Show>
    </div>
  );
};

/** Top-level component — no longer needs SpotifyPlayerProvider. */
const Play: Component = () => {
  return <RoomPlayInner />;
};

export default Play;
