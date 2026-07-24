import { createSignal } from "solid-js";
import { openSongUrl } from "../lib/externalUrl";
import { parseYouTubeUrl } from "../lib/youtube";
import {
  isSpotifyLoggedIn,
  getDevices,
  playOnDevice,
  pausePlayback,
  resumePlayback,
  seekPlayback,
  getPlaybackState,
  spotifyUrlToUri,
} from "../lib/spotify";
import type { SpotifyDevice } from "../lib/spotify";
import { usePlaybackProgress } from "./usePlaybackProgress";

/** An embedded YouTube video queued for the bottom-bar player. */
export interface YouTubeVideo {
  videoId: string;
  start: number;
}

const DEVICE_STORAGE_KEY = "spotify_selected_device";

/**
 * Playback control for a play session: Spotify Connect device selection
 * (persisted to sessionStorage), embedded YouTube state, and the
 * play/pause/resume/skip handlers. Song routing on play: Spotify Connect
 * → embedded YouTube → external tab.
 */
export function useRoomPlayback() {
  const progress = usePlaybackProgress();

  const [devices, setDevices] = createSignal<SpotifyDevice[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = createSignal(false);

  const storedDevice = sessionStorage.getItem(DEVICE_STORAGE_KEY);
  const [selectedDevice, setSelectedDevice] = createSignal<SpotifyDevice | null>(
    storedDevice ? (JSON.parse(storedDevice) as SpotifyDevice) : null,
  );

  // Embedded YouTube playback for songs without a Spotify link
  const [youtubeVideo, setYoutubeVideo] = createSignal<YouTubeVideo | null>(null);

  const spotifyConnected = () => isSpotifyLoggedIn();

  // Bumped on every play so a fire-and-forget cue check can tell whether the
  // song it was started for is still the one playing (see ensureCuePoint).
  let playGeneration = 0;

  // Some Spotify Connect devices ignore `position_ms` on the initial play call
  // (most often when that call also transfers playback to them) and start the
  // track at 0. Once playback is actually rolling, verify the reported position
  // and force the cue point with an explicit seek if the device dropped it. A
  // device that honored `position_ms` is already at/after the cue, so it's left
  // untouched — no rewind. The seek 404s until the track has loaded, so poll a
  // few times, staying within the seek-bar's start-position grace window.
  //
  // `getPlaybackState` reads the global player, not this specific song, so bail
  // the moment a newer play (or manual seek) supersedes us — otherwise a stale
  // check could yank a different, just-started song back to this cue point.
  const CUE_CHECK_ATTEMPTS = 6;
  const CUE_CHECK_INTERVAL_MS = 400;
  const CUE_TOLERANCE_MS = 3000;
  const ensureCuePoint = async (posMs: number, generation: number) => {
    for (let attempt = 0; attempt < CUE_CHECK_ATTEMPTS; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, CUE_CHECK_INTERVAL_MS));
      if (generation !== playGeneration) return; // superseded by a newer play
      const state = await getPlaybackState().catch(() => null);
      if (generation !== playGeneration) return;
      if (!state || !state.isPlaying) continue; // track not rolling yet
      if (state.positionMs >= posMs - CUE_TOLERANCE_MS) return; // cue honored
      try {
        await seekPlayback(posMs);
        return;
      } catch {
        // Track likely not fully loaded yet — retry on the next tick.
      }
    }
  };

  const fetchDevices = async () => {
    setIsLoadingDevices(true);
    try {
      const devs = await getDevices();
      setDevices(devs);
    } catch (err) {
      console.error("[useRoomPlayback] Failed to fetch devices:", err);
    } finally {
      setIsLoadingDevices(false);
    }
  };

  const selectDevice = (device: SpotifyDevice) => {
    setSelectedDevice(device);
    sessionStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(device));
  };

  const clearDevice = () => {
    setSelectedDevice(null);
    sessionStorage.removeItem(DEVICE_STORAGE_KEY);
    void fetchDevices();
  };

  /**
   * Play a song URL on the best available target for it. `durationMs` (the track
   * length captured on selection, when known) seeds the seek bar so its fill is
   * positioned at once rather than after the first reconcile.
   */
  const playSong = async (songUrl: string, startTime?: number, durationMs?: number) => {
    const generation = ++playGeneration; // cancels any in-flight cue check
    const device = selectedDevice();
    if (spotifyConnected() && device) {
      const uri = spotifyUrlToUri(songUrl);
      if (uri) {
        setYoutubeVideo(null); // switching to Spotify stops any YouTube playback
        try {
          const posMs = startTime != null && startTime > 0 ? startTime * 1000 : 0;
          await playOnDevice(uri, device.id, posMs);
          progress.setIsPlaying(true);
          progress.startPolling(posMs, durationMs);
          if (posMs > 0) void ensureCuePoint(posMs, generation);
        } catch (err) {
          console.error("[useRoomPlayback] Play failed:", err);
          openSongUrl(songUrl);
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
    openSongUrl(songUrl);
  };

  const pause = async () => {
    try {
      await pausePlayback();
      progress.setIsPlaying(false);
    } catch (err) {
      console.error("[useRoomPlayback] Pause failed:", err);
    }
  };

  const resume = async () => {
    try {
      await resumePlayback();
      progress.setIsPlaying(true);
    } catch (err) {
      console.error("[useRoomPlayback] Resume failed:", err);
    }
  };

  // Seek relative to the currently displayed position. Routing through
  // progress.seekTo (rather than a stateless API skip) updates the seek bar and
  // clock immediately, and reuses its clamping + stale-reconcile guard.
  const skip = async (deltaMs: number) => {
    playGeneration++; // a manual seek is a fresh intent; drop any cue check
    await progress.seekTo(progress.positionMs() + deltaMs);
  };

  const closeYouTube = () => setYoutubeVideo(null);

  return {
    progress,
    devices,
    isLoadingDevices,
    selectedDevice,
    spotifyConnected,
    fetchDevices,
    selectDevice,
    clearDevice,
    youtubeVideo,
    closeYouTube,
    playSong,
    pause,
    resume,
    skip,
  };
}
