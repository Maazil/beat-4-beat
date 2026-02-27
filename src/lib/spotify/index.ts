// ── Barrel export for the Spotify integration module ──────────────────
// Import everything from "~/lib/spotify" in one line.

export {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_REDIRECT_URI,
  SPOTIFY_SCOPES,
} from "./spotify.config";

export {
  loginWithSpotify,
  handleSpotifyCallback,
  getAccessToken,
  logoutSpotify,
  isSpotifyLoggedIn,
} from "./spotify.auth";

export { SpotifyPlayerProvider, useSpotifyPlayer } from "./spotify.sdk.jsx";

export { useSpotifyPlayback } from "./spotify.playback";

export { searchTracks, loadPlaylistTracks } from "./spotify.api";

export type {
  SpotifyTrack,
  CurrentTrack,
  PlaybackState,
} from "./spotify.types";
