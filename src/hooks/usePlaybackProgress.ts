import { createEffect, createSignal, onCleanup } from "solid-js";
import { getPlaybackState, seekPlayback } from "../lib/spotify";

export interface UsePlaybackProgressResult {
  positionMs: () => number;
  durationMs: () => number;
  isPlaying: () => boolean;
  setIsPlaying: (v: boolean) => void;
  startPolling: (initialPositionMs?: number) => void;
  stopPolling: () => void;
  seekTo: (ms: number) => Promise<void>;
}

const POLL_INTERVAL_MS = 1000;

/**
 * Polls the Spotify Web API for playback progress and exposes
 * reactive signals for position, duration, and playing state.
 *
 * The poll only runs while polling has been requested, playback is
 * playing, and the tab is visible — no requests while paused or hidden.
 */
export function usePlaybackProgress(): UsePlaybackProgressResult {
  const [positionMs, setPositionMs] = createSignal(0);
  const [durationMs, setDurationMs] = createSignal(0);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [isSeeking, setIsSeeking] = createSignal(false);
  const [isPollingRequested, setIsPollingRequested] = createSignal(false);
  const [isTabVisible, setIsTabVisible] = createSignal(!document.hidden);

  const onVisibilityChange = () => setIsTabVisible(!document.hidden);
  document.addEventListener("visibilitychange", onVisibilityChange);
  onCleanup(() => document.removeEventListener("visibilitychange", onVisibilityChange));

  const poll = async () => {
    if (isSeeking()) return;
    try {
      const state = await getPlaybackState();
      if (state) {
        setPositionMs(state.positionMs);
        setDurationMs(state.durationMs);
        setIsPlaying(state.isPlaying);
      }
    } catch {
      // silently ignore poll errors
    }
  };

  createEffect(() => {
    if (!isPollingRequested() || !isPlaying() || !isTabVisible()) return;
    const interval = setInterval(() => void poll(), POLL_INTERVAL_MS);
    onCleanup(() => clearInterval(interval));
  });

  const startPolling = (initialPositionMs?: number) => {
    if (initialPositionMs != null) {
      setPositionMs(initialPositionMs);
      setDurationMs(0);
    }
    setIsPollingRequested(true);
  };

  const stopPolling = () => setIsPollingRequested(false);

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
