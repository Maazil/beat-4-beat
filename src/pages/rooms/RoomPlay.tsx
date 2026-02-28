import { useParams } from "@solidjs/router";
import { Component, createSignal, For, Show, onCleanup } from "solid-js";
import { useRoom } from "../../hooks/useRoom";
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

/** Icon for device types */
const deviceIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "smartphone":
      return (
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
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      );
    case "computer":
      return (
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
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      );
    case "speaker":
      return (
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
            d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-4-4m4 4l4-4M5.636 5.636a9 9 0 1012.728 0"
          />
        </svg>
      );
    default:
      return (
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
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"
          />
        </svg>
      );
  }
};

/** Device picker shown before the game starts. */
const DevicePicker: Component<{
  devices: SpotifyDevice[];
  isLoading: boolean;
  onSelect: (device: SpotifyDevice) => void;
  onRefresh: () => void;
}> = (props) => {
  return (
    <div class="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-neutral-900">
            Velg avspillingsenhet
          </h3>
          <p class="text-sm text-neutral-500">
            Sang spilles av på valgt enhet (telefon, PC, høyttaler)
          </p>
        </div>
        <button
          type="button"
          onClick={() => props.onRefresh()}
          disabled={props.isLoading}
          class="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50"
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
          Oppdater
        </button>
      </div>

      <Show
        when={!props.isLoading}
        fallback={
          <div class="flex items-center justify-center py-8">
            <div class="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
          </div>
        }
      >
        <Show
          when={props.devices.length > 0}
          fallback={
            <div class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-700">
              Ingen enheter funnet. Åpne Spotify-appen på telefonen eller
              datamaskinen og prøv igjen.
            </div>
          }
        >
          <div class="flex flex-col gap-2">
            <For each={props.devices}>
              {(device) => (
                <button
                  type="button"
                  onClick={() => props.onSelect(device)}
                  class={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition hover:border-neutral-400 hover:bg-neutral-50 ${
                    device.is_active
                      ? "border-green-300 bg-green-50"
                      : "border-neutral-200"
                  }`}
                >
                  <span
                    class={
                      device.is_active ? "text-green-600" : "text-neutral-400"
                    }
                  >
                    {deviceIcon(device.type)}
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-neutral-900">
                      {device.name}
                    </p>
                    <p class="text-xs text-neutral-500">
                      {device.type}
                      {device.is_active && (
                        <span class="ml-1.5 text-green-600">• Aktiv</span>
                      )}
                    </p>
                  </div>
                  <svg
                    class="h-4 w-4 text-neutral-400"
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
    new Set()
  );
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [currentItemId, setCurrentItemId] = createSignal<string | null>(null);
  const [showTrackInfo, setShowTrackInfo] = createSignal(false);

  // Progress bar state
  const [positionMs, setPositionMs] = createSignal(0);
  const [durationMs, setDurationMs] = createSignal(0);
  const [isSeeking, setIsSeeking] = createSignal(false);

  const progressPct = () => {
    const d = durationMs();
    return d > 0 ? (positionMs() / d) * 100 : 0;
  };

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  // Poll Spotify for playback progress
  let pollInterval: ReturnType<typeof setInterval> | undefined;

  const startPolling = () => {
    stopPolling();
    pollInterval = setInterval(async () => {
      if (isSeeking()) return;
      try {
        const token = await getAccessToken();
        const res = await fetch("https://api.spotify.com/v1/me/player", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPositionMs(data.progress_ms ?? 0);
          setDurationMs(data.item?.duration_ms ?? 0);
          setIsPlaying(data.is_playing ?? false);
        }
      } catch {
        // silently ignore poll errors
      }
    }, 1000);
  };

  const stopPolling = () => {
    if (pollInterval != null) {
      clearInterval(pollInterval);
      pollInterval = undefined;
    }
  };

  onCleanup(stopPolling);

  const handleSeekBar = async (e: MouseEvent) => {
    const bar = e.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const seekMs = Math.round(pct * durationMs());
    setIsSeeking(true);
    setPositionMs(seekMs);
    try {
      await seekPlayback(seekMs);
    } catch (err) {
      console.error("[RoomPlay] Seek failed:", err);
    } finally {
      setIsSeeking(false);
    }
  };

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
    startTime?: number
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
          setIsPlaying(true);
          setPositionMs(posMs);
          setDurationMs(0);
          startPolling();
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
      setIsPlaying(false);
    } catch (err) {
      console.error("[RoomPlay] Pause failed:", err);
    }
  };

  const handleResume = async () => {
    try {
      await resumePlayback();
      setIsPlaying(true);
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
                                      item.startTime
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
        <div class="fixed right-0 bottom-0 left-0 z-50 border-t border-neutral-200 bg-white shadow-lg">
          {/* Progress / seek bar */}
          <Show when={durationMs() > 0}>
            <div class="flex items-center gap-2 px-6 pt-3">
              <span class="w-10 text-right text-xs tabular-nums text-neutral-500">
                {formatTime(positionMs())}
              </span>
              <div
                class="group relative h-1.5 flex-1 cursor-pointer rounded-full bg-neutral-200"
                onClick={handleSeekBar}
              >
                <div
                  class="absolute top-0 left-0 h-full rounded-full bg-neutral-900 transition-[width] duration-200"
                  style={{ width: `${progressPct()}%` }}
                />
                <div
                  class="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-neutral-900 opacity-0 shadow transition group-hover:opacity-100"
                  style={{ left: `${progressPct()}%` }}
                />
              </div>
              <span class="w-10 text-xs tabular-nums text-neutral-500">
                {formatTime(durationMs())}
              </span>
            </div>
          </Show>
          <div class="flex items-center gap-4 px-6 py-3">
            {/* Hidden track info with reveal toggle */}
            <div class="min-w-0 flex-1">
              <Show
                when={showTrackInfo() && currentItemInfo()}
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
                      {currentItemInfo()?.title || "Ukjent sang"}
                    </p>
                    <p class="truncate text-xs text-neutral-500">
                      {currentItemInfo()?.artist || "Ukjent artist"}
                    </p>
                  </div>
                </div>
              </Show>
            </div>

            {/* Reveal button */}
            <button
              type="button"
              onClick={() => setShowTrackInfo(!showTrackInfo())}
              class={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                showTrackInfo()
                  ? "border-green-300 bg-green-50 text-green-700"
                  : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Show
                when={showTrackInfo()}
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
              {showTrackInfo() ? "Skjul" : "Avsløre"}
            </button>

            {/* Skip back 10s */}
            <button
              type="button"
              onClick={handleSkipBackward}
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
              onClick={() => (isPlaying() ? handlePause() : handleResume())}
              class="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white transition hover:bg-neutral-700"
            >
              <Show
                when={isPlaying()}
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
              onClick={handleSkipForward}
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
      </Show>
    </div>
  );
};

/** Top-level component — no longer needs SpotifyPlayerProvider. */
const Play: Component = () => {
  return <RoomPlayInner />;
};

export default Play;
