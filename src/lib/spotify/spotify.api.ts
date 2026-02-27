// ── Spotify Web API helpers — search & playlist loading ───────────────
//
// All functions use `getAccessToken()` to obtain a valid token before
// every request, so callers never need to worry about token state.

import { SPOTIFY_API_BASE } from "./spotify.config";
import { getAccessToken } from "./spotify.auth";
import type {
  SpotifyApiTrack,
  SpotifyPlaylistTracksResponse,
  SpotifySearchResponse,
  SpotifyTrack,
} from "./spotify.types";

// ── Search ────────────────────────────────────────────────────────────

/**
 * Search Spotify for tracks matching `query`.
 * Returns up to `limit` results (default 20, max 50).
 */
export async function searchTracks(
  query: string,
  limit = 20,
): Promise<SpotifyTrack[]> {
  const token = await getAccessToken();

  const params = new URLSearchParams({
    q: query,
    type: "track",
    limit: String(Math.min(limit, 50)),
  });

  const res = await fetch(`${SPOTIFY_API_BASE}/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`[spotify.api] Search failed: ${res.status}`);
  }

  const data: SpotifySearchResponse = await res.json();
  return data.tracks.items.map(mapApiTrack);
}

// ── Playlist loader ───────────────────────────────────────────────────

/**
 * Load all tracks from a Spotify playlist.
 *
 * Accepts any of these formats:
 *   - Full URL:  https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
 *   - URI:       spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
 *   - Plain ID:  37i9dQZF1DXcBWIGoYBM5M
 *
 * Automatically paginates through all pages.
 */
export async function loadPlaylistTracks(
  playlistInput: string,
): Promise<SpotifyTrack[]> {
  const id = extractPlaylistId(playlistInput);
  const token = await getAccessToken();

  const tracks: SpotifyTrack[] = [];
  let url: string | null =
    `${SPOTIFY_API_BASE}/playlists/${id}/tracks?fields=items(track(name,uri,duration_ms,artists(name),album(images))),next&limit=100`;

  // Follow pagination until there are no more pages
  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(
        `[spotify.api] Playlist load failed: ${res.status}`,
      );
    }

    const data: SpotifyPlaylistTracksResponse = await res.json();

    for (const item of data.items) {
      // Playlist items can be null (e.g. deleted tracks)
      if (item.track) {
        tracks.push(mapApiTrack(item.track));
      }
    }

    url = data.next;
  }

  return tracks;
}

// ── Helpers ───────────────────────────────────────────────────────────

/** Map a Spotify Web API track object to our simplified SpotifyTrack. */
function mapApiTrack(t: SpotifyApiTrack): SpotifyTrack {
  return {
    name: t.name,
    artist: t.artists.map((a) => a.name).join(", "),
    albumArt: t.album.images[0]?.url ?? "",
    durationMs: t.duration_ms,
    uri: t.uri,
  };
}

/**
 * Extract a playlist ID from a URL, URI, or plain ID.
 *
 * Examples:
 *   "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=..." → "37i9dQZF1DXcBWIGoYBM5M"
 *   "spotify:playlist:37i9dQZF1DXcBWIGoYBM5M"                        → "37i9dQZF1DXcBWIGoYBM5M"
 *   "37i9dQZF1DXcBWIGoYBM5M"                                         → "37i9dQZF1DXcBWIGoYBM5M"
 */
function extractPlaylistId(input: string): string {
  // Full URL
  const urlMatch = input.match(/playlist\/([A-Za-z0-9]+)/);
  if (urlMatch) return urlMatch[1];

  // Spotify URI
  const uriMatch = input.match(/spotify:playlist:([A-Za-z0-9]+)/);
  if (uriMatch) return uriMatch[1];

  // Assume it's already a bare ID
  return input;
}
