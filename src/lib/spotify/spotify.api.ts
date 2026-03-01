// ── Spotify Web API helpers — search & playlist loading ───────────────
//
// All functions use `getAccessToken()` to obtain a valid token before
// every request, so callers never need to worry about token state.

import { SPOTIFY_API_BASE } from "./spotify.config";
import { getAccessToken } from "./spotify.auth";
import type {
  SpotifyApiTrack,
  SpotifyDevice,
  SpotifyPlaylistBrief,
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
  offset = 0
): Promise<SpotifyTrack[]> {
  const token = await getAccessToken();

  const params = new URLSearchParams({
    q: query,
    type: "track",
    limit: String(Math.min(limit, 50)),
    offset: String(offset),
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


// ── Spotify Connect — device listing & remote playback ────────────────

/**
 * Fetch the list of the user's available Spotify Connect devices.
 * Devices include phones, desktop apps, speakers, smart TVs, etc.
 */
export async function getDevices(): Promise<SpotifyDevice[]> {
  const token = await getAccessToken();

  const res = await fetch(`${SPOTIFY_API_BASE}/me/player/devices`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`[spotify.api] Get devices failed: ${res.status}`);
  }

  const data: { devices: SpotifyDevice[] } = await res.json();
  return data.devices;
}

/**
 * Start playback of a track on a specific Spotify Connect device.
 * The song plays on the target device (phone, desktop app, speaker)
 * — the browser never receives the audio or track metadata.
 *
 * @param trackUri  Spotify track URI, e.g. "spotify:track:6rqhFg..."
 * @param deviceId  The target device ID from `getDevices()`
 * @param positionMs  Optional position to start from (milliseconds)
 */
export async function playOnDevice(
  trackUri: string,
  deviceId: string,
  positionMs = 0
): Promise<void> {
  const token = await getAccessToken();

  const res = await fetch(
    `${SPOTIFY_API_BASE}/me/player/play?device_id=${deviceId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uris: [trackUri],
        position_ms: positionMs,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`[spotify.api] Play on device failed: ${res.status}`);
  }
}

/**
 * Pause playback on the user's currently active Spotify device.
 */
export async function pausePlayback(): Promise<void> {
  const token = await getAccessToken();

  await fetch(`${SPOTIFY_API_BASE}/me/player/pause`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * Resume playback on the user's currently active Spotify device.
 */
export async function resumePlayback(): Promise<void> {
  const token = await getAccessToken();

  await fetch(`${SPOTIFY_API_BASE}/me/player/play`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * Seek to a position in the currently playing track on the active device.
 * @param positionMs  Position in milliseconds
 */
export async function seekPlayback(positionMs: number): Promise<void> {
  const token = await getAccessToken();

  const res = await fetch(
    `${SPOTIFY_API_BASE}/me/player/seek?position_ms=${Math.max(0, Math.round(positionMs))}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    throw new Error(`[spotify.api] Seek failed: ${res.status}`);
  }
}

// ── Current user's playlists ─────────────────────────────────────────

/**
 * Fetch the current user's playlists via `GET /me/playlists`.
 * Returns up to `limit` playlists (default 50, max 50).
 */
export async function getMySpotifyPlaylists(
  limit = 50
): Promise<SpotifyPlaylistBrief[]> {
  const token = await getAccessToken();

  const params = new URLSearchParams({
    limit: String(Math.min(limit, 50)),
  });

  const res = await fetch(
    `${SPOTIFY_API_BASE}/me/playlists?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    throw new Error(`[spotify.api] Get my playlists failed: ${res.status}`);
  }

  const data = await res.json();
  const items: (SpotifyPlaylistBrief | null)[] = data?.items ?? [];
  return items.filter((p): p is SpotifyPlaylistBrief => p !== null);
}

/**
 * Fetch tracks from a playlist the current user owns or collaborates on.
 * Uses `GET /playlists/{id}/items` (works for own playlists).
 * Paginates through all pages automatically.
 */
export async function getOwnPlaylistTracks(
  playlistId: string
): Promise<SpotifyTrack[]> {
  const token = await getAccessToken();

  const tracks: SpotifyTrack[] = [];
  let url: string | null =
    `${SPOTIFY_API_BASE}/playlists/${playlistId}/items?limit=50`;

  while (url) {
    const res: Response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(
        `[spotify.api] Get playlist items failed: ${res.status}`
      );
    }

    const data: {
      items?: Array<{
        item?: SpotifyApiTrack | null;
        is_local?: boolean;
      } | null>;
      next?: string | null;
    } = await res.json();

    for (const entry of data.items ?? []) {
      if (!entry || entry.is_local || !entry.item) continue;
      tracks.push(mapApiTrack(entry.item));
    }

    url = data.next ?? null;
  }

  return tracks;
}

// ── Playlist search ──────────────────────────────────────────────────

/**
 * Search Spotify for playlists matching `query`.
 * Uses the standard /search endpoint (no elevated access required).
 * Returns up to `limit` results (default 10, max 10).
 */
export async function searchPlaylists(
  query: string,
  limit = 10
): Promise<SpotifyPlaylistBrief[]> {
  const token = await getAccessToken();

  const params = new URLSearchParams({
    q: query,
    type: "playlist",
    limit: String(Math.min(limit, 10)),
  });

  const res = await fetch(`${SPOTIFY_API_BASE}/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`[spotify.api] Playlist search failed: ${res.status}`);
  }

  const data: { playlists: { items: (SpotifyPlaylistBrief | null)[] } } =
    await res.json();
  return data.playlists.items.filter(
    (p): p is SpotifyPlaylistBrief => p !== null
  );
}
