// ── Spotify OAuth 2.0 PKCE flow (frontend-only, no backend) ──────────
//
// Flow overview:
//   1. Generate a random code_verifier + derive the code_challenge (SHA-256).
//   2. Redirect the user to Spotify's /authorize with the challenge.
//   3. Spotify redirects back with an authorization code.
//   4. Exchange the code + verifier for an access_token & refresh_token.
//   5. On expiry, silently refresh using the refresh_token (no user prompt).
//
// Tokens are kept in module-level variables (memory only).
// The PKCE verifier is stored in sessionStorage only for the brief redirect
// round-trip — it is deleted immediately after use.

import {
  SPOTIFY_AUTH_URL,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_REDIRECT_URI,
  SPOTIFY_SCOPES,
  SPOTIFY_TOKEN_URL,
} from "./spotify.config";

// ── In-memory token store ─────────────────────────────────────────────

let accessToken: string | null = null;
let refreshToken: string | null = null;
let tokenExpiresAt = 0; // epoch ms

// Allow external modules to check login state without importing internals
export function isSpotifyLoggedIn(): boolean {
  return accessToken !== null;
}

// ── PKCE helpers ──────────────────────────────────────────────────────

/** Generate a random 64-char code verifier (A-Z, a-z, 0-9, -, _, .). */
function generateCodeVerifier(): string {
  const array = new Uint8Array(48);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Derive the S256 code challenge from a verifier. */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ── Public API ────────────────────────────────────────────────────────

/**
 * Kick off the Spotify PKCE login flow.
 * Generates a verifier, stores it in sessionStorage for the redirect
 * round-trip, and navigates to Spotify's authorize page.
 */
export async function loginWithSpotify(): Promise<void> {
  const verifier = generateCodeVerifier();
  // sessionStorage is acceptable here — the verifier is short-lived and
  // non-sensitive (it's a one-time-use cryptographic nonce, not a token).
  sessionStorage.setItem("spotify_code_verifier", verifier);

  const challenge = await generateCodeChallenge(verifier);

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: SPOTIFY_SCOPES,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });

  // Full-page redirect to Spotify login
  window.location.href = `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

/**
 * Call this on the page that Spotify redirects back to.
 * It reads the authorization code from the URL, exchanges it for tokens,
 * and cleans up the URL + sessionStorage.
 *
 * @returns `true` if tokens were obtained, `false` if there was no code.
 */
export async function handleSpotifyCallback(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (!code) return false;

  const verifier = sessionStorage.getItem("spotify_code_verifier");
  if (!verifier) {
    console.error("[spotify.auth] Missing code verifier in sessionStorage");
    return false;
  }

  // Exchange authorization code for tokens
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    client_id: SPOTIFY_CLIENT_ID,
    code_verifier: verifier,
  });

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    console.error("[spotify.auth] Token exchange failed", await res.text());
    return false;
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  storeTokens(data.access_token, data.refresh_token, data.expires_in);

  // Clean up — remove the code from the URL bar without reloading
  sessionStorage.removeItem("spotify_code_verifier");
  window.history.replaceState({}, document.title, window.location.pathname);

  return true;
}

/**
 * Returns a valid access token, silently refreshing if it has expired.
 * This is the single entry-point other modules should use to get a token.
 */
export async function getAccessToken(): Promise<string> {
  // Refresh 60 s before actual expiry to avoid race conditions
  if (accessToken && Date.now() < tokenExpiresAt - 60_000) {
    return accessToken;
  }

  if (refreshToken) {
    await silentRefresh();
  }

  if (!accessToken) {
    throw new Error(
      "[spotify.auth] No access token available. User must log in.",
    );
  }

  return accessToken;
}

/** Disconnect: clear all in-memory tokens. */
export function logoutSpotify(): void {
  accessToken = null;
  refreshToken = null;
  tokenExpiresAt = 0;
}

// ── Internal helpers ──────────────────────────────────────────────────

function storeTokens(access: string, refresh: string, expiresIn: number) {
  accessToken = access;
  refreshToken = refresh;
  // Convert the "seconds until expiry" into an absolute epoch timestamp
  tokenExpiresAt = Date.now() + expiresIn * 1000;
}

async function silentRefresh(): Promise<void> {
  if (!refreshToken) return;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: SPOTIFY_CLIENT_ID,
  });

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    console.error("[spotify.auth] Silent refresh failed", await res.text());
    // Wipe tokens so getAccessToken() throws instead of looping
    logoutSpotify();
    return;
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  // Spotify may or may not rotate the refresh token
  storeTokens(
    data.access_token,
    data.refresh_token ?? refreshToken!,
    data.expires_in,
  );
}
