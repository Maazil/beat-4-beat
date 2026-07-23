// @vitest-environment jsdom
import { createRoot } from "solid-js";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { PlaybackState } from "../lib/spotify";

// Mock the Spotify Web API so tests drive playback state by hand instead of
// hitting the network.
const getPlaybackState = vi.fn<() => Promise<PlaybackState | null>>();
const seekPlayback = vi.fn<(ms: number) => Promise<void>>();

vi.mock("../lib/spotify", () => ({
  getPlaybackState: () => getPlaybackState(),
  seekPlayback: (ms: number) => seekPlayback(ms),
}));

import { usePlaybackProgress } from "./usePlaybackProgress";

const state = (over: Partial<PlaybackState> = {}): PlaybackState => ({
  isPlaying: true,
  positionMs: 0,
  durationMs: 200_000,
  ...over,
});

// A controllable performance.now() so interpolation is deterministic. It is
// advanced in lockstep with the fake timer clock via `advance()`.
let now = 0;

// Flush Solid's deferred effect queue plus any pending microtasks (resolved
// getPlaybackState promises).
const flush = async () => {
  await vi.advanceTimersByTimeAsync(0);
};

// Advance both the fake timer clock and performance.now() together, in tick-
// sized steps so interval callbacks read a consistent wall clock.
const advance = async (ms: number) => {
  const step = 250;
  for (let elapsed = 0; elapsed < ms; elapsed += step) {
    now += step;
    await vi.advanceTimersByTimeAsync(step);
  }
};

beforeEach(() => {
  now = 0;
  vi.useFakeTimers();
  vi.spyOn(performance, "now").mockImplementation(() => now);
  getPlaybackState.mockReset();
  getPlaybackState.mockResolvedValue(state());
  seekPlayback.mockReset();
  seekPlayback.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("usePlaybackProgress", () => {
  test("does not fetch or tick until polling is requested and playing", async () => {
    await createRoot(async (dispose) => {
      const p = usePlaybackProgress();
      await flush();
      await advance(2000);
      expect(getPlaybackState).not.toHaveBeenCalled();
      expect(p.positionMs()).toBe(0);
      dispose();
    });
  });

  test("interpolates position locally between reconciles", async () => {
    getPlaybackState.mockResolvedValue(state({ positionMs: 10_000 }));
    await createRoot(async (dispose) => {
      const p = usePlaybackProgress();
      p.startPolling();
      p.setIsPlaying(true);
      await flush(); // effect runs, immediate reconcile anchors to 10_000

      expect(p.positionMs()).toBe(10_000);
      expect(p.durationMs()).toBe(200_000);

      await advance(1000); // four 250ms ticks, no reconcile (< 5s)
      expect(p.positionMs()).toBe(11_000);
      expect(getPlaybackState).toHaveBeenCalledTimes(1); // still just the immediate one
      dispose();
    });
  });

  test("clamps the interpolated position to the track duration", async () => {
    getPlaybackState.mockResolvedValue(state({ positionMs: 199_500, durationMs: 200_000 }));
    await createRoot(async (dispose) => {
      const p = usePlaybackProgress();
      p.startPolling();
      p.setIsPlaying(true);
      await flush();

      await advance(2000); // would reach 201_500 unclamped
      expect(p.positionMs()).toBe(200_000);
      dispose();
    });
  });

  test("reconcile corrects drift and re-anchors to the real position", async () => {
    getPlaybackState.mockResolvedValue(state({ positionMs: 10_000 }));
    await createRoot(async (dispose) => {
      const p = usePlaybackProgress();
      p.startPolling();
      p.setIsPlaying(true);
      await flush();

      // Server jumps ahead of local interpolation (e.g. a track change).
      getPlaybackState.mockResolvedValue(state({ positionMs: 120_000 }));
      await advance(5000); // hits the reconcile interval, which re-anchors
      expect(getPlaybackState).toHaveBeenCalledTimes(2);
      expect(p.positionMs()).toBe(120_000);

      await advance(1000); // ticks resume from the reconciled anchor
      expect(p.positionMs()).toBe(121_000);
      dispose();
    });
  });

  test("compensates for request latency so the bar does not rewind", async () => {
    let resolveState: (s: PlaybackState) => void = () => {};
    getPlaybackState.mockImplementationOnce(
      () => new Promise<PlaybackState>((r) => (resolveState = r)),
    );
    await createRoot(async (dispose) => {
      const p = usePlaybackProgress();
      p.startPolling();
      p.setIsPlaying(true);
      await flush(); // immediate reconcile is now in flight; requestedAt = 0

      now += 400; // 400ms round-trip elapses during the request
      resolveState(state({ positionMs: 10_000 }));
      await flush();

      // Anchor advanced by half the round-trip (200ms) past the sampled value.
      expect(p.positionMs()).toBe(10_200);
      dispose();
    });
  });

  test("freezes the position when playback pauses", async () => {
    getPlaybackState.mockResolvedValue(state({ positionMs: 10_000 }));
    await createRoot(async (dispose) => {
      const p = usePlaybackProgress();
      p.startPolling();
      p.setIsPlaying(true);
      await flush();
      await advance(1000);
      expect(p.positionMs()).toBe(11_000);

      p.setIsPlaying(false); // external pause
      await flush();
      await advance(2000); // ticks are torn down, position must not advance
      expect(p.positionMs()).toBe(11_000);
      dispose();
    });
  });

  test("resuming re-anchors to the displayed position without rewinding", async () => {
    getPlaybackState.mockResolvedValue(state({ positionMs: 10_000 }));
    await createRoot(async (dispose) => {
      const p = usePlaybackProgress();
      p.startPolling();
      p.setIsPlaying(true);
      await flush();
      await advance(1000);
      expect(p.positionMs()).toBe(11_000);

      p.setIsPlaying(false);
      await flush();

      // On resume the immediate reconcile fails, so the re-anchor to the frozen
      // displayed position (11_000) must stand — no rewind to an older sample.
      getPlaybackState.mockRejectedValue(new Error("network"));
      p.setIsPlaying(true);
      await flush();
      await advance(1000);
      expect(p.positionMs()).toBe(12_000);
      dispose();
    });
  });

  test("ignores an in-flight reconcile that resolves after teardown", async () => {
    let resolveState: (s: PlaybackState) => void = () => {};
    getPlaybackState.mockImplementationOnce(
      () => new Promise<PlaybackState>((r) => (resolveState = r)),
    );
    await createRoot(async (dispose) => {
      const p = usePlaybackProgress();
      p.startPolling();
      p.setIsPlaying(true);
      await flush(); // immediate reconcile in flight, position still 0

      p.setIsPlaying(false); // teardown before the request resolves
      await flush();

      resolveState(state({ positionMs: 99_999, durationMs: 200_000 }));
      await flush();

      // The stale response must not clobber state after the loop tore down.
      expect(p.positionMs()).toBe(0);
      expect(p.durationMs()).toBe(0);
      expect(p.isPlaying()).toBe(false);
      dispose();
    });
  });

  test("keeps optimistic playing state when a reconcile right after start reports not playing", async () => {
    // Spotify Connect commonly still reports is_playing:false for a moment right
    // after a play command while the device buffers the track.
    getPlaybackState.mockResolvedValue(state({ isPlaying: false, positionMs: 0, durationMs: 0 }));
    await createRoot(async (dispose) => {
      const p = usePlaybackProgress();
      p.startPolling(0);
      p.setIsPlaying(true);
      await flush(); // immediate reconcile reports not-playing, but within grace

      expect(p.isPlaying()).toBe(true); // must not flip the button/loop off
      await advance(1000); // the tick loop keeps running
      expect(p.positionMs()).toBe(1000);
      dispose();
    });
  });

  test("honors a not-playing reconcile once the grace window has passed", async () => {
    getPlaybackState.mockResolvedValue(state({ positionMs: 10_000 }));
    await createRoot(async (dispose) => {
      const p = usePlaybackProgress();
      p.startPolling();
      p.setIsPlaying(true);
      await flush(); // confirmed playing

      getPlaybackState.mockResolvedValue(state({ isPlaying: false, positionMs: 12_000 }));
      await advance(5000); // reconcile fires ~5s later, past the 2.5s grace
      expect(p.isPlaying()).toBe(false);
      dispose();
    });
  });

  test("seeking does not rebuild the loop or fire an extra reconcile", async () => {
    getPlaybackState.mockResolvedValue(state({ positionMs: 10_000 }));
    await createRoot(async (dispose) => {
      const p = usePlaybackProgress();
      p.startPolling();
      p.setIsPlaying(true);
      await flush();
      expect(getPlaybackState).toHaveBeenCalledTimes(1); // the immediate reconcile

      await p.seekTo(30_000);
      await flush();
      // Toggling isSeeking must not re-run the effect and fire another reconcile.
      expect(getPlaybackState).toHaveBeenCalledTimes(1);
      expect(p.positionMs()).toBe(30_000);
      dispose();
    });
  });

  test("seekTo re-anchors to the target without counting request time", async () => {
    let resolveSeek: () => void = () => {};
    seekPlayback.mockImplementationOnce(() => new Promise<void>((r) => (resolveSeek = r)));
    getPlaybackState.mockResolvedValue(state({ positionMs: 0 }));
    await createRoot(async (dispose) => {
      const p = usePlaybackProgress();
      p.startPolling();
      p.setIsPlaying(true);
      await flush();

      const seek = p.seekTo(50_000);
      expect(p.positionMs()).toBe(50_000);

      now += 2000; // request takes 2s
      resolveSeek();
      await seek;

      // Re-anchored in the finally block: the 2s request time is not counted.
      expect(p.positionMs()).toBe(50_000);
      await advance(1000);
      expect(p.positionMs()).toBe(51_000);
      dispose();
    });
  });
});
