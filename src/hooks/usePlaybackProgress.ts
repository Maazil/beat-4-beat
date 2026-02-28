import { createSignal, onCleanup } from "solid-js";
import { getAccessToken, seekPlayback } from "../lib/spotify";

export interface UsePlaybackProgressResult {
  positionMs: () => number;
  durationMs: () => number;
  isPlaying: () => boolean;
  setIsPlaying: (v: boolean) => void;
  startPolling: (initialPositionMs?: number) => void;
  stopPolling: () => void;
  seekTo: (ms: number) => Promise<void>;
}

/**
 * Polls the Spotify Web API for playback progress and exposes
 * reactive signals for position, duration, and playing state.
 */
export function usePlaybackProgress(): UsePlaybackProgressResult {
  const [positionMs, setPositionMs] = createSignal(0);
  const [durationMs, setDurationMs] = createSignal(0);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [isSeeking, setIsSeeking] = createSignal(false);

  let pollInterval: ReturnType<typeof setInterval> | undefined;

  const stopPolling = () => {
    if (pollInterval != null) {
      clearInterval(pollInterval);
      pollInterval = undefined;
    }
  };

  const startPolling = (initialPositionMs?: number) => {
    stopPolling();
    if (initialPositionMs != null) {
      setPositionMs(initialPositionMs);
      setDurationMs(0);
    }
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

  const seekTo = async (ms: number) => {
    setIsSeeking(true);
    setPositionMs(ms);
    try {
      await seekPlayback(ms);
    } catch (err) {
      console.error("[usePlaybackProgress] Seek failed:", err);
    } finally {
      setIsSeeking(false);
    }
  };

  onCleanup(stopPolling);

  return {
    positionMs,
    durationMs,
    isPlaying,
    setIsPlaying,
    startPolling,
    stopPolling,
    seekTo,
  };
}
