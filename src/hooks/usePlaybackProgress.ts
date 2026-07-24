import { createEffect, createSignal, onCleanup, untrack } from "solid-js";
import { getPlaybackState, seekPlayback } from "../lib/spotify";

export interface UsePlaybackProgressResult {
  positionMs: () => number;
  durationMs: () => number;
  isPlaying: () => boolean;
  setIsPlaying: (v: boolean) => void;
  startPolling: (initialPositionMs?: number, knownDurationMs?: number) => void;
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

// When a song starts at a cue point we play with `position_ms` and optimistically
// anchor the bar there, but some Spotify Connect devices briefly report the track
// still near 0 before applying the seek. For this long after such a start, a
// reconcile whose reported position is more than START_POSITION_TOLERANCE_MS below
// the intended start is treated as that not-yet-applied sample and ignored, so the
// bar keeps ticking from the cue point instead of snapping backward to 0.
const START_POSITION_GRACE_MS = 3000;
const START_POSITION_TOLERANCE_MS = 3000;

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

  // The cue point a song was just started at, and when. Used to ignore a
  // reconcile that samples the device before it has applied the start seek (see
  // START_POSITION_GRACE_MS). A manual seek clears this — it's a fresh intent.
  let startIntentPositionMs = 0;
  let startIntentAt = Number.NEGATIVE_INFINITY;

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
        // The device may not have applied a just-issued start seek yet, still
        // reporting the track near 0. Within the grace window, keep the
        // optimistic cue-point anchor rather than snapping the bar backward.
        if (
          performance.now() - startIntentAt < START_POSITION_GRACE_MS &&
          state.positionMs < startIntentPositionMs - START_POSITION_TOLERANCE_MS
        ) {
          return;
        }
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

  const startPolling = (initialPositionMs?: number, knownDurationMs?: number) => {
    if (initialPositionMs != null) {
      // Seed the duration from the track length captured on selection when we
      // have it, so the seek-bar fill positions at the cue point immediately
      // instead of sitting empty until the first reconcile lands the duration.
      setDurationMs(knownDurationMs != null && knownDurationMs > 0 ? knownDurationMs : 0);
      setAnchor(initialPositionMs);
      // Record the cue point so the immediate reconcile can't snap the bar back
      // to 0 before the device has applied the start seek.
      startIntentPositionMs = initialPositionMs;
      startIntentAt = performance.now();
    }
    setIsPollingRequested(true);
  };

  const stopPolling = () => setIsPollingRequested(false);

  const seekTo = async (ms: number) => {
    seekGeneration++;
    // A manual seek is a fresh position intent; drop the start-seek guard so it
    // can't suppress reconciles against a deliberately lower target.
    startIntentAt = Number.NEGATIVE_INFINITY;
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
