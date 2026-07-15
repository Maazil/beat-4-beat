// ── DEV-ONLY: Spotify integration test page ──────────────────────────
// Route: /spotify-test
// Remove this file and its route once integration is verified.

import { createSignal, For, onMount, Show } from "solid-js";

import {
  handleSpotifyCallback,
  isSpotifyLoggedIn,
  loginWithSpotify,
  logoutSpotify,
  searchTracks,
  type SpotifyTrack,
} from "../../lib/spotify";
import { SpotifyPlayerProvider } from "../../lib/spotify/spotify.sdk.jsx";
import { useSpotifyPlayback } from "../../lib/spotify/spotify.playback";

export default function SpotifyTest() {
  const [loggedIn, setLoggedIn] = createSignal(false);
  const [status, setStatus] = createSignal("Checking...");

  onMount(async () => {
    // Handle redirect callback if Spotify sent us back with a code
    const handled = await handleSpotifyCallback();
    if (handled) {
      setLoggedIn(true);
      setStatus("Logged in via callback!");
      return;
    }

    if (isSpotifyLoggedIn()) {
      setLoggedIn(true);
      setStatus("Already logged in (token in memory)");
    } else {
      setStatus("Not logged in");
    }
  });

  return (
    <div class="min-h-screen bg-night p-8 text-ink">
      <h1 class="mb-6 text-2xl font-bold">Spotify Integration Test</h1>

      {/* Status */}
      <div class="mb-6 rounded-xl border border-line bg-surface p-4">
        <p class="text-sm text-muted">Status</p>
        <p class="text-lg">{status()}</p>
      </div>

      {/* Login / Logout */}
      <div class="mb-6 flex gap-4">
        <Show when={!loggedIn()}>
          <button
            onClick={() => loginWithSpotify()}
            class="rounded-full bg-spotify px-6 py-2 font-semibold text-night hover:brightness-110"
          >
            Login with Spotify
          </button>
        </Show>
        <Show when={loggedIn()}>
          <button
            onClick={() => {
              logoutSpotify();
              setLoggedIn(false);
              setStatus("Logged out");
            }}
            class="rounded-full border border-magenta-hot/50 px-6 py-2 font-semibold text-magenta-hot hover:bg-magenta-hot/10"
          >
            Logout
          </button>
        </Show>
      </div>

      {/* Playback test - only render when logged in */}
      <Show when={loggedIn()}>
        <SpotifyPlayerProvider>
          <PlaybackTest />
        </SpotifyPlayerProvider>
      </Show>
    </div>
  );
}

function PlaybackTest() {
  const { playSong, pause, resume, currentTrack, playbackState } = useSpotifyPlayback();

  const [query, setQuery] = createSignal("");
  const [results, setResults] = createSignal<SpotifyTrack[]>([]);
  const [searchError, setSearchError] = createSignal("");

  async function handleSearch() {
    if (!query().trim()) return;
    setSearchError("");
    try {
      const tracks = await searchTracks(query());
      setResults(tracks);
    } catch (e) {
      setSearchError(String(e));
    }
  }

  return (
    <div class="space-y-6">
      {/* Search */}
      <div class="rounded-xl border border-line bg-surface p-4">
        <h2 class="mb-3 text-lg font-semibold">Search Tracks</h2>
        <div class="flex gap-2">
          <input
            type="text"
            value={query()}
            onInput={(e) => setQuery(e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search for a song..."
            class="flex-1 rounded-xl border border-line bg-surface-2 px-4 py-2 text-ink outline-none focus:ring-2 focus:ring-spotify"
          />
          <button
            onClick={handleSearch}
            class="rounded-full bg-spotify px-4 py-2 font-semibold text-night hover:brightness-110"
          >
            Search
          </button>
        </div>
        <Show when={searchError()}>
          <p class="mt-2 text-magenta-hot">{searchError()}</p>
        </Show>

        {/* Results */}
        <div class="mt-4 space-y-2">
          <For each={results()}>
            {(track) => (
              <div class="flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3">
                <img src={track.albumArt} alt="" class="h-12 w-12 rounded object-cover" />
                <div class="flex-1">
                  <p class="font-medium">{track.name}</p>
                  <p class="text-sm text-muted">{track.artist}</p>
                </div>
                <button
                  onClick={() => playSong(track.uri)}
                  class="rounded-full bg-spotify px-3 py-1 text-sm text-night hover:brightness-110"
                >
                  Play
                </button>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Now Playing */}
      <Show when={currentTrack()}>
        {(track) => (
          <div class="rounded-xl border border-line bg-surface p-4">
            <h2 class="mb-3 text-lg font-semibold">Now Playing</h2>
            <div class="flex items-center gap-4">
              <img src={track().albumArt} alt="" class="h-16 w-16 rounded object-cover" />
              <div class="flex-1">
                <p class="text-lg font-medium">{track().name}</p>
                <p class="text-muted">{track().artist}</p>
              </div>
              <div class="flex gap-2">
                <button
                  onClick={() => pause()}
                  class="rounded-full border border-line px-4 py-2 hover:border-beat hover:bg-beat-soft"
                >
                  Pause
                </button>
                <button
                  onClick={() => resume()}
                  class="rounded-full border border-line px-4 py-2 hover:border-beat hover:bg-beat-soft"
                >
                  Resume
                </button>
              </div>
            </div>
            <div class="mt-3 text-sm text-muted">
              {Math.floor(playbackState().positionMs / 1000)}s /{" "}
              {Math.floor(playbackState().durationMs / 1000)}s
              {playbackState().isPlaying ? " — Playing" : " — Paused"}
            </div>
          </div>
        )}
      </Show>
    </div>
  );
}
