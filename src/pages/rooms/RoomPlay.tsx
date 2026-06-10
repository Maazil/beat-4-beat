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
import Scoreboard from "../../components/Scoreboard";
import type { Score } from "../../model/score";
import { posterInk } from "../../theme/palette";
import type { PosterInk } from "../../theme/palette";

/** Tile CSS vars for the screen-print press treatment. */
const pressVars = (ink: PosterInk) => ({
  "--press-ink": ink.ink,
  "--press-tint": ink.tint,
  "--press-tint-hover": ink.tintHover,
});

/** Main room play page. */
const RoomPlayInner: Component = () => {
  const params = useParams();
  const { room: currentRoom, isLoading } = useRoom(() => params.id);

  // Device selection (restore from sessionStorage)
  const [devices, setDevices] = createSignal<SpotifyDevice[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = createSignal(false);

  const storedDevice = sessionStorage.getItem("spotify_selected_device");
  const [selectedDevice, setSelectedDevice] = createSignal<SpotifyDevice | null>(
    storedDevice ? (JSON.parse(storedDevice) as SpotifyDevice) : null,
  );

  // Local scores — per-session, not shared across users
  const [scores, setScores] = createSignal<Score[]>([]);

  // Playback state
  const [revealedItems, setRevealedItems] = createSignal<Set<string>>(new Set());
  const [currentItemId, setCurrentItemId] = createSignal<string | null>(null);
  const [showTrackInfo, setShowTrackInfo] = createSignal(false);

  // Songs in the order they were played — each one is a scoring round
  const [playOrder, setPlayOrder] = createSignal<string[]>([]);

  const currentRound = () => {
    const id = currentItemId();
    if (!id) return undefined;
    const round = playOrder().indexOf(id);
    return round >= 0 ? round : undefined;
  };

  // Playback progress hook
  const playback = usePlaybackProgress();

  const spotifyConnected = () => isSpotifyLoggedIn();

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
    sessionStorage.setItem("spotify_selected_device", JSON.stringify(device));
  };

  const handleItemClick = async (itemId: string, songUrl?: string, startTime?: number) => {
    setRevealedItems((prev) => new Set(prev).add(itemId));
    setPlayOrder((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
    setCurrentItemId(itemId);
    setShowTrackInfo(false);

    if (!songUrl) return;

    const device = selectedDevice();
    if (spotifyConnected() && device) {
      const uri = spotifyUrlToUri(songUrl);
      if (uri) {
        try {
          const posMs = startTime != null && startTime > 0 ? startTime * 1000 : 0;
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
    <div class="bg-stage min-h-screen p-6 pb-24">
      <div class="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() => window.history.back()}
          class="mb-6 flex items-center gap-2 text-muted transition hover:text-beat"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span class="font-medium">Back</span>
        </button>

        <Show when={isLoading()}>
          <div class="flex items-center justify-center py-24">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-line border-t-beat" />
          </div>
        </Show>

        <Show when={!isLoading() && !currentRoom()}>
          <div class="rounded-2xl border border-beat/30 bg-beat-soft p-8 text-center">
            <p class="text-beat-deep">Room not found</p>
          </div>
        </Show>

        <Show when={!isLoading() && currentRoom()}>
          <div class="flex flex-col gap-8">
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-2">
                <h1 class="font-display text-3xl font-bold tracking-tight text-ink">
                  {currentRoom()?.roomName}
                </h1>
                <h2 class="flex items-center gap-2 font-medium text-muted">
                  Hosted by{" "}
                  <span class="inline-block rounded-full bg-beat px-4 py-1 text-sm font-bold tracking-wide text-white shadow-md">
                    {currentRoom()?.hostName}
                  </span>
                </h2>
              </div>

              {/* Spotify connection status */}
              <Show when={!spotifyConnected()}>
                <div class="rounded-xl border border-line bg-sand px-4 py-2 text-sm text-ink">
                  Spotify is not connected. Connect Spotify from the dashboard to play songs
                  directly.
                </div>
              </Show>
            </div>

            {/* Device picker — shown until a device is selected */}
            <Show when={spotifyConnected() && !selectedDevice()}>
              <div class="mx-auto w-full max-w-lg">
                <Show
                  when={devices().length > 0 || isLoadingDevices()}
                  fallback={
                    <div class="text-center">
                      <p class="mb-4 text-muted">Connect a Spotify device to play songs</p>
                      <button
                        type="button"
                        onClick={fetchDevices}
                        class="rounded-full bg-spotify px-6 py-2.5 font-bold text-white transition hover:brightness-110"
                      >
                        Find devices
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
                <div class="flex items-center gap-3 rounded-xl border border-spotify/30 bg-spotify/10 px-4 py-2">
                  <span class="text-spotify">{deviceIcon(device().type)}</span>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-semibold text-ink">Playing on: {device().name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDevice(null);
                      sessionStorage.removeItem("spotify_selected_device");
                      fetchDevices();
                    }}
                    class="text-xs text-muted underline transition hover:text-ink"
                  >
                    Switch device
                  </button>
                </div>
              )}
            </Show>

            {/* Scoreboard — local per session, not shared */}
            <Scoreboard
              scores={scores()}
              currentRound={currentRound()}
              onUpdateScores={setScores}
            />

            {/* Game board */}
            <Show when={selectedDevice() || !spotifyConnected()}>
              <div class="py-4 pb-16">
                <p class="mb-4 text-muted">Click a tile to play a song</p>
                {/* Single-category: full-width grid, one ink for the whole board */}
                <Show when={(currentRoom()?.categories.length ?? 0) === 1}>
                  <div class="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    <For each={currentRoom()?.categories[0]?.items}>
                      {(item) => {
                        const ink = posterInk(0);
                        return (
                          <button
                            type="button"
                            class={`flex h-20 w-full cursor-pointer items-center justify-center rounded-xl sm:h-24 ${
                              revealedItems().has(item.id)
                                ? "border-2 border-dashed border-line bg-sand/50"
                                : "press-card"
                            }`}
                            style={revealedItems().has(item.id) ? undefined : pressVars(ink)}
                            onClick={() => handleItemClick(item.id, item.songUrl, item.startTime)}
                          >
                            <span
                              class="font-mono text-2xl font-bold"
                              style={{
                                color: revealedItems().has(item.id)
                                  ? "var(--color-muted)"
                                  : ink.deep,
                              }}
                            >
                              {item.level}
                            </span>
                          </button>
                        );
                      }}
                    </For>
                  </div>
                </Show>

                {/* Multi-category: column grid with category headers */}
                <Show when={(currentRoom()?.categories.length ?? 0) > 1}>
                  <div
                    class="grid gap-6"
                    style={`grid-template-columns: repeat(${currentRoom()?.categories.length ?? 1}, minmax(0, 1fr))`}
                  >
                    <For each={currentRoom()?.categories}>
                      {(category, index) => {
                        const ink = () => posterInk(index());
                        return (
                          <div class="flex flex-col gap-4">
                            <div
                              class="rounded-lg px-4 py-3 text-center shadow-[3px_3px_0_rgba(26,20,24,0.85)]"
                              style={{ background: ink().ink }}
                            >
                              <h2 class="font-display text-lg font-bold tracking-tight text-white">
                                {category.name}
                              </h2>
                            </div>

                            <div class="flex flex-col gap-3">
                              <For each={category.items}>
                                {(item) => (
                                  <button
                                    type="button"
                                    class={`flex h-16 w-full cursor-pointer items-center justify-center rounded-lg ${
                                      revealedItems().has(item.id)
                                        ? "border-2 border-dashed border-line bg-sand/50"
                                        : "press-card"
                                    }`}
                                    style={
                                      revealedItems().has(item.id) ? undefined : pressVars(ink())
                                    }
                                    onClick={() =>
                                      handleItemClick(item.id, item.songUrl, item.startTime)
                                    }
                                  >
                                    <span
                                      class="font-mono text-2xl font-bold"
                                      style={{
                                        color: revealedItems().has(item.id)
                                          ? "var(--color-muted)"
                                          : ink().deep,
                                      }}
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
                </Show>
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
