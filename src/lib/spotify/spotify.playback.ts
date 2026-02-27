// ── Spotify playback composable (custom hook) ────────────────────────
//
// Wraps the Web Playback SDK + Web API into a set of reactive signals
// and imperative methods that any SolidJS component can use.
//
// Usage:
//   const { playSong, pause, resume, seek, setVolume, currentTrack, playbackState } =
//     useSpotifyPlayback();

import { createEffect, createSignal, onCleanup } from "solid-js";

import { SPOTIFY_API_BASE } from "./spotify.config";
import { getAccessToken } from "./spotify.auth";
import { useSpotifyPlayer } from "./spotify.sdk.jsx";
import type {
  CurrentTrack,
  PlaybackState,
  WebPlaybackState,
} from "./spotify.types";

// ── The composable ────────────────────────────────────────────────────

export function useSpotifyPlayback() {
  const { player, deviceId } = useSpotifyPlayer();

  // Reactive signals consumers can read in JSX or createEffect
  const [currentTrack, setCurrentTrack] = createSignal<CurrentTrack | null>(
    null,
  );
  const [playbackState, setPlaybackState] = createSignal<PlaybackState>({
    isPlaying: false,
    positionMs: 0,
    durationMs: 0,
  });

  // ── Subscribe to SDK state changes ──────────────────────────────────

  createEffect(() => {
    const p = player();
    if (!p) return;

    const handler = ((state: WebPlaybackState | null) => {
      if (!state) return;

      const track = state.track_window.current_track;
      setCurrentTrack({
        name: track.name,
        artist: track.artists.map((a) => a.name).join(", "),
        albumArt: track.album.images[0]?.url ?? "",
        durationMs: track.duration_ms,
      });

      setPlaybackState({
        isPlaying: !state.paused,
        positionMs: state.position,
        durationMs: state.duration,
      });
    }) as (state: unknown) => void;

    p.addListener("player_state_changed", handler);

    // Clean up the listener when the effect re-runs or the component unmounts
    onCleanup(() => p.removeListener("player_state_changed"));
  });

  // ── Playback methods ────────────────────────────────────────────────

  /**
   * Play a specific track by its Spotify URI (e.g. "spotify:track:xxx").
   * Uses the Web API rather than the SDK method because the SDK's play()
   * can only unpause — it can't start a specific track.
   */
  async function playSong(trackUri: string): Promise<void> {
    const token = await getAccessToken();
    const did = deviceId();
    if (!did) throw new Error("[spotify.playback] No device ID available");

    await fetch(`${SPOTIFY_API_BASE}/me/player/play?device_id=${did}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris: [trackUri] }),
    });
  }

  /** Pause playback. */
  async function pause(): Promise<void> {
    const p = player();
    if (p) await p.pause();
  }

  /** Resume playback. */
  async function resume(): Promise<void> {
    const p = player();
    if (p) await p.resume();
  }

  /** Seek to a specific position in the current track (ms). */
  async function seek(positionMs: number): Promise<void> {
    const p = player();
    if (p) await p.seek(positionMs);
  }

  /** Set volume (0–1). */
  async function setVolume(value: number): Promise<void> {
    const p = player();
    if (p) await p.setVolume(Math.max(0, Math.min(1, value)));
  }

  return {
    // Reactive signals
    currentTrack,
    playbackState,
    // Imperative methods
    playSong,
    pause,
    resume,
    seek,
    setVolume,
  } as const;
}
