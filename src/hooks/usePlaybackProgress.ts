import { createEffect, createSignal, onCleanup, untrack } from "solid-js";
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

// Advance the displayed position locally on a fast tick, and reconcile against
// the Spotify Web API on a much slower cadence. This keeps the seek bar smooth
// while cutting steady-state playback API calls ~5x versus polling every second.
const TICK_INTERVAL_MS = 250;
const RECONCILE_INTERVAL_MS = 5000;

/**
 * Tracks Spotify playback progress and exposes reactive signals for position,
 * duration, and playing state.
 *
 * Rather than polling the Web API every second, the position is interpolated
 * from a wall-clock anchor on a 250ms local tick and reconciled against the API
 * every 5s (plus once immediately on start/resume). The interpolation only runs
 * while polling has been requested, playback is playing, and the tab is visible
 * — no requests or ticks while paused or hidden.
 */
export function usePlaybackProgress(): UsePlaybackProgressResult {
  const [positionMs, setPositionMs] = createSignal(0);
  const [durationMs, setDurationMs] = createSignal(0);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [isSeeking, setIsSeeking] = createSignal(false);
  const [isPollingRequested, setIsPollingRequested] = createSignal(false);
  const [isTabVisible, setIsTabVisible] = createSignal(!document.hidden);

  // Wall-clock anchor for interpolation: position `anchorPositionMs` was current
  // at `anchorAt` (a performance.now() timestamp). Each tick adds the real time
  // elapsed since the anchor, so the seek bar advances without a network call.
  let anchorPositionMs = 0;
  let anchorAt = performance.now();

  const setAnchor = (posMs: number) => {
    anchorPositionMs = posMs;
    anchorAt = performance.now();
    setPositionMs(posMs);
  };

  const onVisibilityChange = () => setIsTabVisible(!document.hidden);
  document.addEventListener("visibilitychange", onVisibilityChange);
  onCleanup(() => document.removeEventListener("visibilitychange", onVisibilityChange));

  // Advance the displayed position by the real time elapsed since the anchor,
  // clamped to the track duration once it's known.
  const tick = () => {
    if (isSeeking()) return;
    const next = anchorPositionMs + (performance.now() - anchorAt);
    const dur = durationMs();
    setPositionMs(dur > 0 ? Math.min(next, dur) : next);
  };

  // Correct interpolation drift and pick up duration / external pause & track
  // changes from the real playback state, then re-anchor to it.
  const reconcile = async () => {
    if (isSeeking()) return;
    try {
      const state = await getPlaybackState();
      if (state) {
        setDurationMs(state.durationMs);
        setIsPlaying(state.isPlaying);
        setAnchor(state.positionMs);
      }
    } catch {
      // silently ignore reconcile errors
    }
  };

  createEffect(() => {
    if (!isPollingRequested() || !isPlaying() || !isTabVisible()) return;
    // Re-anchor to the currently displayed position so resuming after a pause
    // or tab-hide doesn't rewind the seek bar to the last reconciled position.
    setAnchor(untrack(positionMs));
    // Reconcile immediately as well — corrects the position and fills duration
    // (so the seek bar appears) without waiting a full interval.
    void reconcile();
    const tickId = setInterval(tick, TICK_INTERVAL_MS);
    const reconcileId = setInterval(() => void reconcile(), RECONCILE_INTERVAL_MS);
    onCleanup(() => {
      clearInterval(tickId);
      clearInterval(reconcileId);
    });
  });

  const startPolling = (initialPositionMs?: number) => {
    if (initialPositionMs != null) {
      setDurationMs(0);
      setAnchor(initialPositionMs);
    }
    setIsPollingRequested(true);
  };

  const stopPolling = () => setIsPollingRequested(false);

  const seekTo = async (ms: number) => {
    setIsSeeking(true);
    setAnchor(ms);
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
