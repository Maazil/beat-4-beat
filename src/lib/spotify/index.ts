// ── Barrel export for the Spotify integration module ──────────────────
// Import everything from "~/lib/spotify" in one line.

export { SPOTIFY_CLIENT_ID, SPOTIFY_REDIRECT_URI, SPOTIFY_SCOPES } from "./spotify.config";

export {
  loginWithSpotify,
  loginWithSpotifyPopup,
  handleSpotifyCallback,
  getAccessToken,
  logoutSpotify,
  isSpotifyLoggedIn,
} from "./spotify.auth";

export { SpotifyPlayerProvider, useSpotifyPlayer } from "./spotify.sdk";

export { useSpotifyPlayback } from "./spotify.playback";

export {
  searchTracks,
  getDevices,
  playOnDevice,
  pausePlayback,
  resumePlayback,
  seekPlayback,
  getPlaybackState,
  skipRelative,
  getMySpotifyPlaylists,
  getOwnPlaylistTracks,
} from "./spotify.api";

export { spotifyUrlToUri } from "./spotify.utils";

export type {
  SpotifyTrack,
  SpotifyDevice,
  SpotifyPlaylistBrief,
  CurrentTrack,
  PlaybackState,
} from "./spotify.types";
