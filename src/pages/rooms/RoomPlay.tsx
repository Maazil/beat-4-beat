import { useParams } from "@solidjs/router";
import { Component, createMemo, Show } from "solid-js";
import { useConfirm } from "../../context/ConfirmContext";
import { useRoom } from "../../hooks/useRoom";
import { useGameState } from "../../hooks/useGameState";
import { useGuessTimer } from "../../hooks/useGuessTimer";
import { useRoomPlayback } from "../../hooks/useRoomPlayback";
import {
  buildItemIndex,
  buildRoundLabels,
  pickRandomUnplayed,
  unplayedItems,
} from "../../lib/boardLookup";
import { roomHostNames } from "../../lib/roomHosts";
import RoomPlayHeader from "./RoomPlayHeader";
import RoomPlayNav from "./RoomPlayNav";
import DevicePicker from "../../components/DevicePicker";
import GameBoard from "../../components/GameBoard";
import GuessTimer from "../../components/GuessTimer";
import GuessTimerPicker from "../../components/GuessTimerPicker";
import NowPlayingBar from "../../components/NowPlayingBar";
import Scoreboard from "../../components/Scoreboard";
import TurnTracker from "../../components/TurnTracker";
import WinnerOverlay from "../../components/WinnerOverlay";
import YouTubePlayer from "../../components/YouTubePlayer";

/** Main room play page. */
const RoomPlayInner: Component = () => {
  const params = useParams();
  const confirm = useConfirm();
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

  // Whether the current song's title/artist is revealed. Lives in the shared
  // game state so the audience view unspoils in step with the host.
  const showTrackInfo = () => game().revealTrackInfo;

  // Guess timer — 0 = off; duration persists across sessions
  const guessTimer = useGuessTimer();

  const currentRound = () => {
    const id = currentItemId();
    if (!id) return undefined;
    const round = playOrder().indexOf(id);
    return round >= 0 ? round : undefined;
  };

  const handleItemClick = (
    itemId: string,
    songUrl?: string,
    startTime?: number,
    durationMs?: number,
  ) => {
    const order = playOrder();
    updateGame({
      playOrder: order.includes(itemId) ? order : [...order, itemId],
      currentItemId: itemId,
      revealTrackInfo: false,
    });
    guessTimer.bump();
    if (songUrl) void playback.playSong(songUrl, startTime, durationMs);
  };

  // Unrevealed tiles left on the board — drives the lightning-round picker
  const remainingTiles = createMemo(() =>
    unplayedItems(currentRoom()?.categories ?? [], isItemRevealed),
  );

  /** Play a random unplayed tile — a shortcut for lightning rounds. */
  const playRandomTile = () => {
    const pick = pickRandomUnplayed(remainingTiles());
    if (!pick) return;
    handleItemClick(pick.id, pick.songUrl, pick.startTime, pick.durationMs);
  };

  // Anything on the board or scoreboard worth resetting?
  const gameStarted = () =>
    playOrder().length > 0 || scores().some((s) => s.roundPoints.length > 0);

  // Host has ended the game — shows the winner moment (shared via gameState).
  const gameOver = () => game().gameOver;

  /** Reset the board and zero all scores, keeping the teams. */
  const resetGame = () => {
    updateGame({
      playOrder: [],
      currentItemId: null,
      scores: scores().map((s) => ({ ...s, roundPoints: [] })),
      revealTrackInfo: false,
      gameOver: false,
    });
    if (playback.progress.isPlaying()) void playback.pause();
  };

  const handleNewGame = async () => {
    const confirmed = await confirm({
      title: "New game",
      message: "Start a new game? The board resets and scores go back to zero.",
      confirmLabel: "Start new game",
    });
    if (!confirmed) return;
    resetGame();
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
        <RoomPlayNav roomId={params.id} />

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
              onNewGame={() => void handleNewGame()}
              onFinishGame={() => updateGame({ gameOver: true })}
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

            {/* Scoreboard — synced via the room doc for hosts, local otherwise.
                Always inline; phones just scroll past it to reach the board. */}
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
                    <button
                      type="button"
                      onClick={playRandomTile}
                      disabled={remainingTiles().length === 0}
                      title="Play a random unplayed tile"
                      class="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-0.5 font-mono text-xs font-bold text-muted transition hover:border-beat hover:text-beat disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span aria-hidden="true">🎲</span> Random
                    </button>
                    <GuessTimerPicker
                      choices={guessTimer.choices}
                      selected={guessTimer.durationSec()}
                      onChoose={guessTimer.choose}
                    />
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
      <Show when={guessTimer.durationSec() > 0}>
        <GuessTimer durationSec={guessTimer.durationSec()} runId={guessTimer.runId()} />
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

      {/* End-of-game celebration — confetti, winner, final standings */}
      <Show when={gameOver()}>
        <WinnerOverlay
          scores={scores()}
          onNewGame={resetGame}
          onClose={() => updateGame({ gameOver: false })}
        />
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
          onToggleTrackInfo={() => updateGame({ revealTrackInfo: !showTrackInfo() })}
          onPause={playback.pause}
          onResume={playback.resume}
          onSkipForward={() => playback.skip(10_000)}
          onSkipBackward={() => playback.skip(-10_000)}
          onSeek={(ms) => void playback.seekTo(ms)}
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
