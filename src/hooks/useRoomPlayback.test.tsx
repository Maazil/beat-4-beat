// @vitest-environment jsdom
import { createRoot } from "solid-js";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { PlaybackState, SpotifyDevice } from "../lib/spotify";

// Mock the Spotify Web API so tests drive devices and playback state by hand.
const getPlaybackState = vi.fn<() => Promise<PlaybackState | null>>();
const seekPlayback = vi.fn<(ms: number) => Promise<void>>();
const playOnDevice = vi.fn<(uri: string, deviceId: string, posMs?: number) => Promise<void>>();

vi.mock("../lib/spotify", () => ({
  isSpotifyLoggedIn: () => true,
  getDevices: () => Promise.resolve([]),
  playOnDevice: (uri: string, deviceId: string, posMs?: number) =>
    playOnDevice(uri, deviceId, posMs),
  pausePlayback: () => Promise.resolve(),
  resumePlayback: () => Promise.resolve(),
  seekPlayback: (ms: number) => seekPlayback(ms),
  getPlaybackState: () => getPlaybackState(),
  spotifyUrlToUri: (url: string) => `spotify:track:${url.split("/").pop()}`,
}));

vi.mock("../lib/externalUrl", () => ({ openSongUrl: vi.fn() }));

import { useRoomPlayback } from "./useRoomPlayback";

const SONG = "https://open.spotify.com/track/abc123";
const DEVICE: SpotifyDevice = { id: "dev-1", name: "Kitchen", type: "Speaker", isActive: true };

/** Device reports the track still at 0 — it dropped the `position_ms` cue. */
const atStart = (positionMs = 0): PlaybackState => ({
  isPlaying: true,
  positionMs,
  durationMs: 200_000,
});

// performance.now() has to track the fake timer clock: ensureCuePoint bounds
// itself by wall clock, so a frozen now() would loop forever.
let now = 0;

const advance = async (ms: number) => {
  const step = 100;
  for (let elapsed = 0; elapsed < ms; elapsed += step) {
    now += step;
    await vi.advanceTimersByTimeAsync(step);
  }
};

beforeEach(() => {
  now = 0;
  vi.useFakeTimers();
  vi.spyOn(performance, "now").mockImplementation(() => now);
  sessionStorage.clear();
  getPlaybackState.mockReset();
  getPlaybackState.mockResolvedValue(atStart());
  seekPlayback.mockReset();
  seekPlayback.mockResolvedValue(undefined);
  playOnDevice.mockReset();
  playOnDevice.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

/** Mounts the hook with a Spotify device already selected. */
const setup = (body: (p: ReturnType<typeof useRoomPlayback>) => Promise<void>) =>
  createRoot(async (dispose) => {
    const playback = useRoomPlayback();
    playback.selectDevice(DEVICE);
    await body(playback);
    dispose();
  });

describe("useRoomPlayback cue point", () => {
  test("forces the cue point when the device ignored position_ms", async () => {
    await setup(async (playback) => {
      await playback.playSong(SONG, 60);
      expect(playOnDevice).toHaveBeenCalledWith("spotify:track:abc123", "dev-1", 60_000);

      await advance(1000);
      expect(seekPlayback).toHaveBeenCalledWith(60_000);
    });
  });

  test("leaves a device that honored position_ms alone", async () => {
    getPlaybackState.mockResolvedValue(atStart(60_000));
    await setup(async (playback) => {
      await playback.playSong(SONG, 60);
      await advance(1000);
      expect(seekPlayback).not.toHaveBeenCalled();
    });
  });

  test("a manual seek cancels the pending cue check", async () => {
    // Regression: the host scrubs away from the cue point moments after the song
    // starts. The cue check must not drag playback back to the cue — it has to
    // treat the scrub as a fresh intent, exactly as the -10s/+10s buttons do.
    await setup(async (playback) => {
      await playback.playSong(SONG, 60);

      await playback.seekTo(5_000);
      expect(seekPlayback).toHaveBeenCalledWith(5_000);
      seekPlayback.mockClear();
      getPlaybackState.mockResolvedValue(atStart(5_000));

      await advance(3000);
      expect(seekPlayback).not.toHaveBeenCalled();
    });
  });

  test("a newer song cancels the previous song's cue check", async () => {
    await setup(async (playback) => {
      await playback.playSong(SONG, 60);
      await playback.playSong(SONG, 0);

      await advance(3000);
      expect(seekPlayback).not.toHaveBeenCalled();
    });
  });

  test("gives up once the start-position grace window has passed", async () => {
    // The device reports nothing for the whole window, so no attempt ever finds
    // a cue to fix. Past the window a forced seek would fight the seek bar (a
    // reconcile has since anchored it to the device), so the loop must be done —
    // even though the device now reports a state it would have acted on.
    getPlaybackState.mockResolvedValue(null);
    await setup(async (playback) => {
      await playback.playSong(SONG, 60);
      await advance(3000);

      getPlaybackState.mockResolvedValue(atStart());
      await advance(3000);
      expect(seekPlayback).not.toHaveBeenCalled();
    });
  });
});
