import { useParams } from "@solidjs/router";
import { Component, createSignal, For, Show } from "solid-js";
import { useRoom } from "../../hooks/useRoom";
import { useGameState } from "../../hooks/useGameState";
import { usePlaybackProgress } from "../../hooks/usePlaybackProgress";
import { roomHostNames } from "../../lib/roomHosts";
import { parseYouTubeUrl } from "../../lib/youtube";
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
import GuessTimer from "../../components/GuessTimer";
import NowPlayingBar from "../../components/NowPlayingBar";
import Scoreboard from "../../components/Scoreboard";
import TurnTracker from "../../components/TurnTracker";
import YouTubePlayer from "../../components/YouTubePlayer";
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

  const hostNames = () => {
    const room = currentRoom();
    return room ? roomHostNames(room) : [];
  };

  // Device selection (restore from sessionStorage)
  const [devices, setDevices] = createSignal<SpotifyDevice[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = createSignal(false);

  const storedDevice = sessionStorage.getItem("spotify_selected_device");
  const [selectedDevice, setSelectedDevice] = createSignal<SpotifyDevice | null>(
    storedDevice ? (JSON.parse(storedDevice) as SpotifyDevice) : null,
  );

  // Game state — synced to the room doc for hosts/co-owners, localStorage otherwise
  const { game, updateGame } = useGameState(() => params.id, currentRoom);
  const scores = () => game().scores;
  const playOrder = () => game().playOrder;
  const currentItemId = () => game().currentItemId;
  const isItemRevealed = (id: string) => playOrder().includes(id);

  const [showTrackInfo, setShowTrackInfo] = createSignal(false);

  // Embedded YouTube playback for songs without a Spotify link
  const [youtubeVideo, setYoutubeVideo] = createSignal<{
    videoId: string;
    start: number;
  } | null>(null);

  // Guess timer — 0 = off; duration persists across sessions
  const TIMER_CHOICES = [0, 15, 30, 45, 60];
  const storedTimerSec = Number(localStorage.getItem("b4b_guess_timer_sec"));
  const [timerSec, setTimerSec] = createSignal(
    TIMER_CHOICES.includes(storedTimerSec) ? storedTimerSec : 0,
  );
  const [timerRunId, setTimerRunId] = createSignal(0);

  const chooseTimer = (sec: number) => {
    setTimerSec(sec);
    localStorage.setItem("b4b_guess_timer_sec", String(sec));
    if (sec === 0) setTimerRunId(0);
  };

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
    const order = playOrder();
    updateGame({
      playOrder: order.includes(itemId) ? order : [...order, itemId],
      currentItemId: itemId,
    });
    setShowTrackInfo(false);
    if (timerSec() > 0) setTimerRunId((n) => n + 1);

    if (!songUrl) return;

    const device = selectedDevice();
    if (spotifyConnected() && device) {
      const uri = spotifyUrlToUri(songUrl);
      if (uri) {
        setYoutubeVideo(null); // switching to Spotify stops any YouTube playback
        try {
          const posMs = startTime != null && startTime > 0 ? startTime * 1000 : 0;
          await playOnDevice(uri, device.id, posMs);
          playback.setIsPlaying(true);
          playback.startPolling(posMs);
        } catch (err) {
          console.error("[RoomPlay] Play failed:", err);
          window.open(songUrl, "_blank", "noopener");
        }
        return;
      }
    }

    // YouTube links play in the embedded bottom-bar player instead of a new tab.
    // The item's cue point wins over any t= param in the URL itself.
    const youtube = parseYouTubeUrl(songUrl);
    if (youtube) {
      const start = startTime != null && startTime > 0 ? startTime : (youtube.startSeconds ?? 0);
      setYoutubeVideo(null); // remount the iframe even when replaying the same video
      setYoutubeVideo({ videoId: youtube.videoId, start });
      return;
    }

    // Fallback: open externally if no device or not a recognized URL
    window.open(songUrl, "_blank", "noopener");
  };

  // Anything on the board or scoreboard worth resetting?
  const gameStarted = () =>
    playOrder().length > 0 || scores().some((s) => s.roundPoints.length > 0);

  /** Reset the board and zero all scores, keeping the teams. */
  const handleNewGame = () => {
    if (!confirm("Start a new game? The board resets and scores go back to zero.")) return;
    updateGame({
      playOrder: [],
      currentItemId: null,
      scores: scores().map((s) => ({ ...s, roundPoints: [] })),
    });
    setShowTrackInfo(false);
    if (playback.isPlaying()) void handlePause();
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

  // Look up a song and its category by id across all categories
  const locateItem = (id: string) => {
    const room = currentRoom();
    if (!room) return undefined;
    for (const category of room.categories) {
      for (const item of category.items) {
        if (item.id === id) return { item, category };
      }
    }
    return undefined;
  };

  // Look up a song by id across all categories
  const itemById = (id: string) => locateItem(id)?.item;

  // Find the currently playing item's stored info
  const currentItemInfo = () => {
    const id = currentItemId();
    return id ? (itemById(id) ?? null) : null;
  };

  // Song played on each round (by play order) — labels the revealed breakdown.
  // Carries category/level/link so URL-only songs (no title) stay identifiable.
  const roundLabels = () =>
    playOrder().map((id) => {
      const found = locateItem(id);
      const item = found?.item;
      return {
        title: item?.title,
        artist: item?.artist,
        category: found?.category.name,
        level: item?.level,
        songUrl: item?.songUrl,
      };
    });

  return (
    <div class="bg-stage min-h-screen p-4 pb-24 sm:p-6 sm:pb-24">
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
                <h2 class="flex flex-wrap items-center gap-2 font-medium text-muted">
                  Hosted by
                  <For each={hostNames()}>
                    {(name) => (
                      <span class="inline-block rounded-full bg-beat px-4 py-1 text-sm font-bold tracking-wide text-white shadow-md">
                        {name}
                      </span>
                    )}
                  </For>
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

            {/* Scoreboard — synced via the room doc for hosts, local otherwise */}
            <Scoreboard
              scores={scores()}
              currentRound={currentRound()}
              roundLabels={roundLabels()}
              onUpdateScores={(next) => updateGame({ scores: next })}
            />

            {/* Whose turn — rotates with the rounds, click a team to override */}
            <TurnTracker
              teamNames={scores().map((s) => s.teamName)}
              roundsStarted={playOrder().length}
            />

            {/* Game board */}
            <Show when={selectedDevice() || !spotifyConnected()}>
              <div class="py-4 pb-16">
                <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <p class="text-muted">Click a tile to play a song</p>
                  <div class="flex flex-wrap items-center gap-3">
                    {/* Guess timer setting — countdown starts on each tile click */}
                    <div class="flex items-center gap-1.5">
                      <span class="mr-1 font-mono text-xs tracking-wide text-muted uppercase">
                        Timer
                      </span>
                      <For each={TIMER_CHOICES}>
                        {(sec) => (
                          <button
                            type="button"
                            onClick={() => chooseTimer(sec)}
                            class={`rounded-full border-2 px-2.5 py-0.5 font-mono text-xs font-bold transition ${
                              timerSec() === sec
                                ? "border-ink bg-ink text-cream shadow-[2px_2px_0_var(--color-beat)]"
                                : "border-line text-muted hover:border-ink hover:text-ink"
                            }`}
                          >
                            {sec === 0 ? "Off" : `${sec}s`}
                          </button>
                        )}
                      </For>
                    </div>
                    <Show when={gameStarted()}>
                      <button
                        type="button"
                        onClick={handleNewGame}
                        class="rounded-full border-2 border-ink px-3 py-1 text-xs font-bold text-ink shadow-[2px_2px_0_var(--color-ink)] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--color-ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                      >
                        New game
                      </button>
                    </Show>
                  </div>
                </div>
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
                              isItemRevealed(item.id)
                                ? "border-2 border-dashed border-line bg-sand/50"
                                : "press-card"
                            }`}
                            style={isItemRevealed(item.id) ? undefined : pressVars(ink)}
                            onClick={() => handleItemClick(item.id, item.songUrl, item.startTime)}
                          >
                            <span
                              class="font-mono text-2xl font-bold"
                              style={{
                                color: isItemRevealed(item.id) ? "var(--color-muted)" : ink.deep,
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
                  {/* Phones: horizontally scrollable snap columns (equal-width
                      columns would crush with 4+ categories). md+: the grid. */}
                  <div
                    class="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:gap-6 md:overflow-x-visible md:px-0 md:pb-0"
                    style={`grid-template-columns: repeat(${currentRoom()?.categories.length ?? 1}, minmax(0, 1fr))`}
                  >
                    <For each={currentRoom()?.categories}>
                      {(category, index) => {
                        const ink = () => posterInk(index());
                        return (
                          <div class="flex w-40 shrink-0 snap-start flex-col gap-4 md:w-auto md:shrink">
                            <Show
                              when={category.imageUrl}
                              fallback={
                                <div
                                  class="rounded-lg px-4 py-3 text-center shadow-[3px_3px_0_rgba(26,20,24,0.85)]"
                                  style={{ background: ink().ink }}
                                >
                                  <h2 class="font-display text-lg font-bold tracking-tight text-white">
                                    {category.name}
                                  </h2>
                                </div>
                              }
                            >
                              <img
                                src={category.imageUrl}
                                alt={category.name}
                                class="h-20 w-full rounded-lg object-cover shadow-[3px_3px_0_rgba(26,20,24,0.85)]"
                              />
                            </Show>

                            <div class="flex flex-col gap-3">
                              <For each={category.items}>
                                {(item) => (
                                  <button
                                    type="button"
                                    class={`flex h-16 w-full cursor-pointer items-center justify-center rounded-lg ${
                                      isItemRevealed(item.id)
                                        ? "border-2 border-dashed border-line bg-sand/50"
                                        : "press-card"
                                    }`}
                                    style={isItemRevealed(item.id) ? undefined : pressVars(ink())}
                                    onClick={() =>
                                      handleItemClick(item.id, item.songUrl, item.startTime)
                                    }
                                  >
                                    <span
                                      class="font-mono text-2xl font-bold"
                                      style={{
                                        color: isItemRevealed(item.id)
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

      {/* Guess countdown — floats above the control bar while a round runs */}
      <Show when={timerSec() > 0}>
        <GuessTimer durationSec={timerSec()} runId={timerRunId()} />
      </Show>

      {/* Embedded YouTube player — replaces the Spotify bar for YouTube songs */}
      <Show when={youtubeVideo()}>
        {(video) => (
          <YouTubePlayer
            videoId={video().videoId}
            startSeconds={video().start}
            onClose={() => setYoutubeVideo(null)}
          />
        )}
      </Show>

      {/* Bottom control bar — shown when a song is playing */}
      <Show when={currentItemId() && !youtubeVideo()}>
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
