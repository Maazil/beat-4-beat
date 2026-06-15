// ── Spotify OAuth 2.0 PKCE flow (frontend-only, no backend) ──────────
//
// Flow overview:
//   1. Generate a random code_verifier + derive the code_challenge (SHA-256).
//   2. Redirect the user to Spotify's /authorize with the challenge.
//   3. Spotify redirects back with an authorization code.
//   4. Exchange the code + verifier for an access_token & refresh_token.
//   5. On expiry, silently refresh using the refresh_token (no user prompt).
//
// Tokens are persisted in localStorage so the Spotify connection
// survives reloads, new tabs, and browser restarts (until logout or
// refresh-token revocation). The one-time PKCE verifier lives in
// sessionStorage for the full-page flow, or localStorage for the popup flow
// (so the popup window can read it), and is deleted right after use.

import { createSignal } from "solid-js";
import {
  SPOTIFY_AUTH_URL,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_REDIRECT_URI,
  SPOTIFY_SCOPES,
  SPOTIFY_TOKEN_URL,
} from "./spotify.config";

// ── Token store (localStorage-backed) ─────────────────────────────────

const SK_ACCESS = "spotify_access_token";
const SK_REFRESH = "spotify_refresh_token";
const SK_EXPIRES = "spotify_token_expires_at";
const SK_VERIFIER = "spotify_code_verifier";

// OAuth `state` marker set when logging in via a popup (vs. a full-page
// redirect), so the callback knows to close its window instead of rendering.
const POPUP_STATE = "popup";

let accessToken: string | null = localStorage.getItem(SK_ACCESS);
let refreshToken: string | null = localStorage.getItem(SK_REFRESH);
let tokenExpiresAt = Number(localStorage.getItem(SK_EXPIRES)) || 0;

// Reactive mirror of login state so consumers (e.g. the song search in the
// create/edit room flow) update the instant tokens are stored or cleared,
// without importing the token internals.
const [loggedIn, setLoggedIn] = createSignal(accessToken !== null);

// Allow external modules to check login state without importing internals
export function isSpotifyLoggedIn(): boolean {
  return loggedIn();
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

/** Build the Spotify authorize URL for a verifier, with an optional `state`. */
async function buildAuthorizeUrl(verifier: string, state?: string): Promise<string> {
  const challenge = await generateCodeChallenge(verifier);

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: SPOTIFY_SCOPES,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });
  if (state) params.set("state", state);

  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

/**
 * Kick off the Spotify PKCE login flow with a full-page redirect.
 * Generates a verifier, stores it in sessionStorage for the redirect
 * round-trip, and navigates to Spotify's authorize page.
 */
export async function loginWithSpotify(): Promise<void> {
  const verifier = generateCodeVerifier();
  // sessionStorage is acceptable here — the verifier is short-lived and
  // non-sensitive (it's a one-time-use cryptographic nonce, not a token).
  sessionStorage.setItem(SK_VERIFIER, verifier);

  // Full-page redirect to Spotify login
  window.location.href = await buildAuthorizeUrl(verifier);
}

/**
 * Log in via a popup instead of a full-page redirect, so the caller's page
 * (e.g. the create/edit room form) stays mounted and its unsaved state is
 * preserved. The popup lands on the redirect page, which exchanges the code,
 * stores the tokens, and closes itself; this window then picks up the new
 * tokens via a `storage` event.
 *
 * @returns `true` once tokens are obtained; `false` if the popup was blocked
 *   (in which case it falls back to a full-page redirect) or closed early.
 */
export async function loginWithSpotifyPopup(): Promise<boolean> {
  const verifier = generateCodeVerifier();
  // localStorage (not sessionStorage) so the popup — a separate browsing
  // context — can read the verifier when Spotify redirects it back to us.
  localStorage.setItem(SK_VERIFIER, verifier);
  const authUrl = await buildAuthorizeUrl(verifier, POPUP_STATE);

  const popup = window.open(authUrl, "spotify-login", "width=480,height=720");
  if (!popup) {
    // Popup blocked — fall back to the full-page redirect flow.
    window.location.href = authUrl;
    return false;
  }

  return await new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("storage", onStorage);
      clearInterval(poll);
      resolve(ok);
    };

    // The popup stores the access token in localStorage, which fires a
    // `storage` event here — events fire only in *other* same-origin documents.
    const onStorage = (e: StorageEvent) => {
      if (e.key === SK_ACCESS && e.newValue) {
        syncTokensFromStorage();
        finish(true);
      }
    };
    window.addEventListener("storage", onStorage);

    // Fallback: the user closed the popup before completing the flow.
    const poll = setInterval(() => {
      if (popup.closed) {
        syncTokensFromStorage();
        finish(isSpotifyLoggedIn());
      }
    }, 500);
  });
}

/**
 * Call this on the page that Spotify redirects back to.
 * It reads the authorization code from the URL, exchanges it for tokens,
 * and cleans up the stored verifier. If the login was started via a popup
 * (`state=popup`), it closes the window instead of cleaning up the URL.
 *
 * @returns `true` if tokens were obtained, `false` if there was no code.
 */
export async function handleSpotifyCallback(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (!code) return false;

  // Popup logins (from the create/edit flow) tag the request via `state` so we
  // close this window afterwards instead of rendering the redirect page.
  const isPopup = params.get("state") === POPUP_STATE;

  // Popup flow stores the verifier in localStorage; full-page flow uses sessionStorage.
  const verifier = localStorage.getItem(SK_VERIFIER) ?? sessionStorage.getItem(SK_VERIFIER);
  if (!verifier) {
    console.error("[spotify.auth] Missing code verifier");
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

  // Clean up the one-time verifier wherever it was stored
  localStorage.removeItem(SK_VERIFIER);
  sessionStorage.removeItem(SK_VERIFIER);

  if (isPopup) {
    // Opened from the create/edit "Connect Spotify" popup. The opener picks up
    // the new tokens via a storage event; just close this window.
    window.close();
    return true;
  }

  // Full-page flow: strip the code from the URL bar without reloading
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
    throw new Error("[spotify.auth] No access token available. User must log in.");
  }

  return accessToken;
}

/** Disconnect: clear all tokens from memory and localStorage. */
export function logoutSpotify(): void {
  accessToken = null;
  refreshToken = null;
  tokenExpiresAt = 0;
  localStorage.removeItem(SK_ACCESS);
  localStorage.removeItem(SK_REFRESH);
  localStorage.removeItem(SK_EXPIRES);
  setLoggedIn(false);
}

// ── Internal helpers ──────────────────────────────────────────────────

/**
 * Re-read tokens from localStorage into the in-memory cache and refresh the
 * reactive login state — used after the popup flow, which stores the tokens
 * from a different window.
 */
function syncTokensFromStorage(): void {
  accessToken = localStorage.getItem(SK_ACCESS);
  refreshToken = localStorage.getItem(SK_REFRESH);
  tokenExpiresAt = Number(localStorage.getItem(SK_EXPIRES)) || 0;
  setLoggedIn(accessToken !== null);
}

function storeTokens(access: string, refresh: string, expiresIn: number) {
  accessToken = access;
  refreshToken = refresh;
  tokenExpiresAt = Date.now() + expiresIn * 1000;

  localStorage.setItem(SK_ACCESS, access);
  localStorage.setItem(SK_REFRESH, refresh);
  localStorage.setItem(SK_EXPIRES, String(tokenExpiresAt));
  setLoggedIn(true);
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
  storeTokens(data.access_token, data.refresh_token ?? refreshToken!, data.expires_in);
}
