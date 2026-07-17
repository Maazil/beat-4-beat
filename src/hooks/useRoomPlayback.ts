import { createSignal } from "solid-js";
import { openSongUrl } from "../lib/externalUrl";
import { parseYouTubeUrl } from "../lib/youtube";
import {
  isSpotifyLoggedIn,
  getDevices,
  playOnDevice,
  pausePlayback,
  resumePlayback,
  skipRelative,
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

  /** Play a song URL on the best available target for it. */
  const playSong = async (songUrl: string, startTime?: number) => {
    const device = selectedDevice();
    if (spotifyConnected() && device) {
      const uri = spotifyUrlToUri(songUrl);
      if (uri) {
        setYoutubeVideo(null); // switching to Spotify stops any YouTube playback
        try {
          const posMs = startTime != null && startTime > 0 ? startTime * 1000 : 0;
          await playOnDevice(uri, device.id, posMs);
          progress.setIsPlaying(true);
          progress.startPolling(posMs);
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

  const skip = async (deltaMs: number) => {
    try {
      await skipRelative(deltaMs);
    } catch (err) {
      console.error("[useRoomPlayback] Skip failed:", err);
    }
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
