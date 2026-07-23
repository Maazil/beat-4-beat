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

// After a play/resume command, Spotify Connect can take a beat to report
// `is_playing: true` (the device is still handing off / buffering the track).
// For this long after we optimistically mark playback as playing, a reconcile
// that still reports "not playing" is treated as stale and ignored, so the
// play/pause button and tick loop don't flip off under a just-started song.
// Must stay below RECONCILE_INTERVAL_MS so a genuine later pause is honored.
const PLAY_INTENT_GRACE_MS = 2500;

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
  const [isPlaying, setIsPlayingSignal] = createSignal(false);
  const [isSeeking, setIsSeeking] = createSignal(false);
  const [isPollingRequested, setIsPollingRequested] = createSignal(false);
  const [isTabVisible, setIsTabVisible] = createSignal(!document.hidden);

  // Wall-clock anchor for interpolation: position `anchorPositionMs` was current
  // at `anchorAt` (a performance.now() timestamp). Each tick adds the real time
  // elapsed since the anchor, so the seek bar advances without a network call.
  let anchorPositionMs = 0;
  let anchorAt = performance.now();

  // True only while an effect run owns the interval loop. A reconcile request
  // still in flight when the tab hides or playback pauses must not write stale
  // state after the loop has torn down.
  let isInterpolating = false;

  // Bumped on every seek. A reconcile that was in flight when a seek began (and
  // resolves after it) carries a stale position, so it must not re-anchor.
  let seekGeneration = 0;

  // performance.now() of the last time we optimistically marked playback as
  // playing (a user-driven play/resume). Used to gate reconcile so Spotify's
  // brief post-command "not playing" reports don't flip the state back off.
  let playIntentAt = Number.NEGATIVE_INFINITY;

  // Record play intent whenever we transition to playing; leave it untouched on
  // pause so an explicit pause is honored immediately.
  const setIsPlaying = (v: boolean) => {
    if (v) playIntentAt = performance.now();
    setIsPlayingSignal(v);
  };

  const setAnchor = (posMs: number) => {
    const dur = untrack(durationMs);
    const clamped = dur > 0 ? Math.min(Math.max(posMs, 0), dur) : Math.max(posMs, 0);
    anchorPositionMs = clamped;
    anchorAt = performance.now();
    setPositionMs(clamped);
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
    const requestedAt = performance.now();
    const seekGen = seekGeneration;
    try {
      const state = await getPlaybackState();
      // Bail if the loop tore down (tab hidden / paused), or a seek started
      // while the request was in flight — a stale position must not clobber the
      // seek target, even once the seek itself has finished.
      if (!isInterpolating || isSeeking() || seekGen !== seekGeneration) return;
      if (state) {
        // Spotify hasn't caught up to a just-issued play yet: keep the
        // optimistic playing state and local anchor rather than snapping to a
        // stale "paused" / previous-track sample.
        if (!state.isPlaying && performance.now() - playIntentAt < PLAY_INTENT_GRACE_MS) {
          return;
        }
        setDurationMs(state.durationMs);
        setIsPlaying(state.isPlaying);
        // The reported position was sampled server-side before the response
        // arrived. If still playing, advance it by ~half the round-trip so the
        // bar doesn't visibly rewind by network latency on every reconcile.
        const latencyMs = state.isPlaying ? (performance.now() - requestedAt) / 2 : 0;
        setAnchor(state.positionMs + latencyMs);
      }
    } catch {
      // silently ignore reconcile errors
    }
  };

  createEffect(() => {
    if (!isPollingRequested() || !isPlaying() || !isTabVisible()) return;
    isInterpolating = true;
    // Re-anchor to the currently displayed position so resuming after a pause
    // or tab-hide doesn't rewind the seek bar to the last reconciled position.
    setAnchor(untrack(positionMs));
    // Reconcile immediately as well — corrects the position and fills duration
    // (so the seek bar appears) without waiting a full interval. Untracked so
    // its synchronous `isSeeking()` read doesn't make the loop depend on it and
    // rebuild the intervals on every seek.
    void untrack(reconcile);
    const tickId = setInterval(tick, TICK_INTERVAL_MS);
    const reconcileId = setInterval(() => void reconcile(), RECONCILE_INTERVAL_MS);
    onCleanup(() => {
      isInterpolating = false;
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
    seekGeneration++;
    setIsSeeking(true);
    setAnchor(ms);
    try {
      await seekPlayback(ms);
    } catch (err) {
      console.error("[usePlaybackProgress] Seek failed:", err);
    } finally {
      // Re-anchor to the target so the elapsed request time isn't counted as
      // playback progress once ticking resumes.
      setAnchor(ms);
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
