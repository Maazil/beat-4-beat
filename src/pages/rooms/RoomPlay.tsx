import { useParams } from "@solidjs/router";
import { Component, createMemo, createSignal, For, Show } from "solid-js";
import { useRoom } from "../../hooks/useRoom";
import { useGameState } from "../../hooks/useGameState";
import { useRoomPlayback } from "../../hooks/useRoomPlayback";
import { buildItemIndex, buildRoundLabels } from "../../lib/boardLookup";
import { roomHostNames } from "../../lib/roomHosts";
import RoomPlayHeader from "./RoomPlayHeader";
import DevicePicker from "../../components/DevicePicker";
import GameBoard from "../../components/GameBoard";
import GuessTimer from "../../components/GuessTimer";
import NowPlayingBar from "../../components/NowPlayingBar";
import Scoreboard from "../../components/Scoreboard";
import TurnTracker from "../../components/TurnTracker";
import YouTubePlayer from "../../components/YouTubePlayer";

/** Main room play page. */
const RoomPlayInner: Component = () => {
  const params = useParams();
  const { room: currentRoom, isLoading } = useRoom(() => params.id);

  const hostNames = () => {
    const room = currentRoom();
    return room ? roomHostNames(room) : [];
  };

  // Device selection + Spotify/YouTube playback control
  const playback = useRoomPlayback();

  // Game state — synced to the room doc for hosts/co-owners, localStorage otherwise
  const { game, updateGame } = useGameState(() => params.id, currentRoom);
  const scores = () => game().scores;
  const playOrder = () => game().playOrder;
  const currentItemId = () => game().currentItemId;
  const isItemRevealed = (id: string) => playOrder().includes(id);

  const [showTrackInfo, setShowTrackInfo] = createSignal(false);

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

  const handleItemClick = (itemId: string, songUrl?: string, startTime?: number) => {
    const order = playOrder();
    updateGame({
      playOrder: order.includes(itemId) ? order : [...order, itemId],
      currentItemId: itemId,
    });
    setShowTrackInfo(false);
    if (timerSec() > 0) setTimerRunId((n) => n + 1);
    if (songUrl) void playback.playSong(songUrl, startTime);
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
    if (playback.progress.isPlaying()) void playback.pause();
  };

  // id → song + category index, rebuilt only when the board content changes
  const itemIndex = createMemo(() => buildItemIndex(currentRoom()?.categories ?? []));

  // Find the currently playing item's stored info
  const currentItemInfo = () => {
    const id = currentItemId();
    return id ? (itemIndex().get(id)?.item ?? null) : null;
  };

  // Song played on each round — labels the revealed scoreboard breakdown
  const roundLabels = createMemo(() => buildRoundLabels(playOrder(), itemIndex()));

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
            <p class="text-beat-bright">Room not found</p>
          </div>
        </Show>

        <Show when={!isLoading() && currentRoom()}>
          <div class="flex flex-col gap-8">
            <RoomPlayHeader
              roomName={currentRoom()?.roomName}
              hostNames={hostNames()}
              selectedDevice={playback.selectedDevice()}
              spotifyConnected={playback.spotifyConnected()}
              gameStarted={gameStarted()}
              onClearDevice={playback.clearDevice}
              onNewGame={handleNewGame}
            />

            {/* Device picker — shown until a device is selected */}
            <Show when={playback.spotifyConnected() && !playback.selectedDevice()}>
              <div class="mx-auto w-full max-w-lg">
                <Show
                  when={playback.devices().length > 0 || playback.isLoadingDevices()}
                  fallback={
                    <div class="text-center">
                      <p class="mb-4 text-muted">Connect a Spotify device to play songs</p>
                      <button
                        type="button"
                        onClick={() => void playback.fetchDevices()}
                        class="rounded-full bg-spotify px-6 py-2.5 font-bold text-ink transition hover:brightness-110"
                      >
                        Find devices
                      </button>
                    </div>
                  }
                >
                  <DevicePicker
                    devices={playback.devices()}
                    isLoading={playback.isLoadingDevices()}
                    onSelect={playback.selectDevice}
                    onRefresh={playback.fetchDevices}
                  />
                </Show>
              </div>
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
            <Show when={playback.selectedDevice() || !playback.spotifyConnected()}>
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
                            class={`rounded-full border px-2.5 py-0.5 font-mono text-xs font-bold transition ${
                              timerSec() === sec
                                ? "border-beat bg-beat-soft text-beat-bright"
                                : "border-line text-muted hover:border-beat"
                            }`}
                          >
                            {sec === 0 ? "Off" : `${sec}s`}
                          </button>
                        )}
                      </For>
                    </div>
                  </div>
                </div>
                <GameBoard
                  categories={currentRoom()?.categories ?? []}
                  isItemRevealed={isItemRevealed}
                  onItemClick={handleItemClick}
                />
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
      <Show when={playback.youtubeVideo()}>
        {(video) => (
          <YouTubePlayer
            videoId={video().videoId}
            startSeconds={video().start}
            onClose={playback.closeYouTube}
          />
        )}
      </Show>

      {/* Bottom control bar — shown when a song is playing */}
      <Show when={currentItemId() && !playback.youtubeVideo()}>
        <NowPlayingBar
          positionMs={playback.progress.positionMs()}
          durationMs={playback.progress.durationMs()}
          isPlaying={playback.progress.isPlaying()}
          trackTitle={currentItemInfo()?.title}
          trackArtist={currentItemInfo()?.artist}
          showTrackInfo={showTrackInfo()}
          onToggleTrackInfo={() => setShowTrackInfo(!showTrackInfo())}
          onPause={playback.pause}
          onResume={playback.resume}
          onSkipForward={() => playback.skip(10_000)}
          onSkipBackward={() => playback.skip(-10_000)}
          onSeek={(ms) => playback.progress.seekTo(ms)}
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
