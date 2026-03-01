// ── Spotify shared TypeScript interfaces ──────────────────────────────

/** Simplified track object used across search, playlist, and playback. */
export interface SpotifyTrack {
  name: string;
  artist: string;
  albumArt: string; // URL to the album cover image
  durationMs: number;
  uri: string; // Spotify track URI, e.g. "spotify:track:6rqhFgbbKwnb9MLmUQDhG6"
}

/** Shape of the reactive playback state signal. */
export interface PlaybackState {
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
}

/** Shape of the reactive current-track signal. */
export interface CurrentTrack {
  name: string;
  artist: string;
  albumArt: string;
  durationMs: number;
}

// ── Spotify Connect device types ──────────────────────────────────────

/** A Spotify Connect device as returned by GET /me/player/devices. */
export interface SpotifyDevice {
  id: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string; // "Computer", "Smartphone", "Speaker", etc.
  volume_percent: number | null;
  supports_volume: boolean;
}

// ── Spotify Browse API types ──────────────────────────────────────────

/** A brief playlist object returned by Search or Browse API. */
export interface SpotifyPlaylistBrief {
  id: string;
  name: string;
  description: string;
  images: SpotifyImage[];
  items?: { total: number };
}

// ── Spotify Web API response types (only what we use) ─────────────────

/** Subset of the Spotify image object. */
export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

/** Subset of the Spotify artist object. */
export interface SpotifyArtistBrief {
  name: string;
}

/** Subset of the Spotify album object. */
export interface SpotifyAlbumBrief {
  images: SpotifyImage[];
}

/** Subset of the full track object returned by the Web API. */
export interface SpotifyApiTrack {
  name: string;
  uri: string;
  duration_ms: number;
  artists: SpotifyArtistBrief[];
  album: SpotifyAlbumBrief;
}

/** /v1/search response (only the tracks portion). */
export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyApiTrack[];
  };
}

/** /v1/playlists/{id}/tracks response. */
export interface SpotifyPlaylistTracksResponse {
  items: Array<{ track: SpotifyApiTrack | null }>;
  next: string | null; // pagination cursor
}

// ── Spotify Web Playback SDK ambient types ────────────────────────────
// The SDK is loaded at runtime via <script> and attaches to `window.Spotify`.

export interface WebPlaybackPlayer {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  addListener: (event: string, callback: (state: unknown) => void) => void;
  removeListener: (event: string) => void;
  getCurrentState: () => Promise<WebPlaybackState | null>;
  setName: (name: string) => void;
  getVolume: () => Promise<number>;
  setVolume: (volume: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  togglePlay: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  previousTrack: () => Promise<void>;
  nextTrack: () => Promise<void>;
  activateElement: () => Promise<void>;
  _options: { getOAuthToken: (cb: (token: string) => void) => void };
}

export interface WebPlaybackState {
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: {
      name: string;
      artists: Array<{ name: string }>;
      album: { images: Array<{ url: string }> };
      duration_ms: number;
    };
  };
}

/** Shape of the ready/not_ready event payload. */
export interface WebPlaybackReady {
  device_id: string;
}

// Extend the global Window interface so TypeScript knows about window.Spotify
// and the onSpotifyWebPlaybackSDKReady callback.
declare global {
  interface Window {
    Spotify?: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => WebPlaybackPlayer;
    };
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}
