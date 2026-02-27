// ── Spotify OAuth & SDK configuration ─────────────────────────────────
// All values that vary per environment are read from Vite env vars so the
// same build can target dev / staging / production.

/** Spotify application client ID (public, safe for frontend). */
export const SPOTIFY_CLIENT_ID: string = import.meta.env
  .VITE_SPOTIFY_CLIENT_ID as string;

/**
 * Where Spotify redirects after the user approves access.
 * Must exactly match one of the URIs registered in the Spotify Developer
 * Dashboard under "Redirect URIs".
 *
 * IMPORTANT: Spotify no longer allows "localhost" in redirect URIs.
 * For local dev use the loopback IP instead: http://127.0.0.1:3000
 * Production must use HTTPS.
 */
export const SPOTIFY_REDIRECT_URI: string = import.meta.env
  .VITE_SPOTIFY_REDIRECT_URI as string;

/**
 * OAuth scopes the app needs.
 * - streaming + user-read-playback-state + user-modify-playback-state →
 *   required by the Web Playback SDK to play music in the browser.
 * - user-read-email / user-read-private → identify the logged-in user.
 * - playlist-read-private / playlist-read-collaborative → load user playlists.
 */
export const SPOTIFY_SCOPES: string = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  "playlist-read-private",
  "playlist-read-collaborative",
].join(" ");

/** Spotify Accounts authorize endpoint. */
export const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";

/** Spotify Accounts token endpoint. */
export const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

/** Spotify Web API base URL. */
export const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

/** Spotify Web Playback SDK script URL. */
export const SPOTIFY_SDK_URL = "https://sdk.scdn.co/spotify-player.js";
