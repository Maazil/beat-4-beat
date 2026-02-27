// ── Spotify Web Playback SDK loader & SolidJS context ─────────────────
//
// This module:
//   1. Dynamically loads the Spotify Web Playback SDK <script>.
//   2. Initializes the player once the SDK is ready.
//   3. Registers the browser as an active Spotify Connect device.
//   4. Exposes the player and device ID via a SolidJS context so any
//      component in the tree can access them.

import {
  type Accessor,
  type JSX,
  createContext,
  createSignal,
  onCleanup,
  onMount,
  useContext,
} from "solid-js";

import { SPOTIFY_API_BASE, SPOTIFY_SDK_URL } from "./spotify.config";
import { getAccessToken } from "./spotify.auth";
import type { WebPlaybackPlayer, WebPlaybackReady } from "./spotify.types";

// ── Context shape ─────────────────────────────────────────────────────

interface SpotifyPlayerContext {
  /** The underlying SDK Player instance (null until initialised). */
  player: Accessor<WebPlaybackPlayer | null>;
  /** The device ID assigned by Spotify (null until ready). */
  deviceId: Accessor<string | null>;
  /** Whether the SDK has finished loading and the device is registered. */
  isReady: Accessor<boolean>;
}

const SpotifyPlayerCtx = createContext<SpotifyPlayerContext>();

// ── Provider component ────────────────────────────────────────────────

/**
 * Wrap your component tree with <SpotifyPlayerProvider> to make the
 * player available everywhere via `useSpotifyPlayer()`.
 *
 * The player is headless — no visible Spotify UI is rendered.
 */
export function SpotifyPlayerProvider(props: { children: JSX.Element }) {
  const [player, setPlayer] = createSignal<WebPlaybackPlayer | null>(null);
  const [deviceId, setDeviceId] = createSignal<string | null>(null);
  const [isReady, setIsReady] = createSignal(false);

  onMount(() => {
    loadSdk().then((sdk) => {
      if (!sdk) return;
      initPlayer(sdk, setPlayer, setDeviceId, setIsReady);
    });
  });

  // Disconnect the player on unmount to free resources
  onCleanup(() => {
    const p = player();
    if (p) p.disconnect();
  });

  return (
    <SpotifyPlayerCtx.Provider value={{ player, deviceId, isReady }}>
      {props.children}
    </SpotifyPlayerCtx.Provider>
  );
}

/** Consume the player context from any descendant component. */
export function useSpotifyPlayer(): SpotifyPlayerContext {
  const ctx = useContext(SpotifyPlayerCtx);
  if (!ctx) {
    throw new Error(
      "[spotify.sdk] useSpotifyPlayer must be used inside <SpotifyPlayerProvider>",
    );
  }
  return ctx;
}

// ── SDK script loader ─────────────────────────────────────────────────

/**
 * Injects the Spotify Web Playback SDK <script> tag if it hasn't been
 * loaded yet, and waits for the global `onSpotifyWebPlaybackSDKReady`
 * callback before resolving.
 */
function loadSdk(): Promise<typeof window.Spotify | null> {
  return new Promise((resolve) => {
    // Already loaded — resolve immediately
    if (window.Spotify) {
      resolve(window.Spotify);
      return;
    }

    // Register the global callback the SDK calls once it's loaded
    window.onSpotifyWebPlaybackSDKReady = () => {
      resolve(window.Spotify ?? null);
    };

    // Inject the <script> tag
    const script = document.createElement("script");
    script.src = SPOTIFY_SDK_URL;
    script.async = true;
    script.onerror = () => {
      console.error("[spotify.sdk] Failed to load Spotify SDK script");
      resolve(null);
    };
    document.head.appendChild(script);
  });
}

// ── Player initialisation ─────────────────────────────────────────────

function initPlayer(
  sdk: NonNullable<typeof window.Spotify>,
  setPlayer: (p: WebPlaybackPlayer) => void,
  setDeviceId: (id: string) => void,
  setIsReady: (v: boolean) => void,
) {
  const p = new sdk.Player({
    name: "Beat 4 Beat",
    // The SDK calls this callback whenever it needs a fresh token.
    getOAuthToken: (cb) => {
      getAccessToken().then(cb);
    },
    volume: 0.5,
  }) as unknown as WebPlaybackPlayer;

  // Device is registered and visible on Spotify Connect
  p.addListener("ready", (({ device_id }: WebPlaybackReady) => {
    console.log("[spotify.sdk] Ready with device ID", device_id);
    setDeviceId(device_id);
    setIsReady(true);
    // Automatically transfer playback to this device so the host doesn't
    // have to manually select it in Spotify.
    transferPlayback(device_id);
  }) as (state: unknown) => void);

  p.addListener("not_ready", (({ device_id }: WebPlaybackReady) => {
    console.warn("[spotify.sdk] Device went offline", device_id);
    setIsReady(false);
  }) as (state: unknown) => void);

  p.addListener("initialization_error", ((e: { message: string }) => {
    console.error("[spotify.sdk] Initialization error", e.message);
  }) as (state: unknown) => void);

  p.addListener("authentication_error", ((e: { message: string }) => {
    console.error("[spotify.sdk] Authentication error", e.message);
  }) as (state: unknown) => void);

  p.addListener("account_error", ((e: { message: string }) => {
    console.error("[spotify.sdk] Account error (Premium required)", e.message);
  }) as (state: unknown) => void);

  p.connect();
  setPlayer(p);
}

// ── Transfer playback to the new device ───────────────────────────────

async function transferPlayback(deviceId: string): Promise<void> {
  const token = await getAccessToken();
  await fetch(`${SPOTIFY_API_BASE}/me/player`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ device_ids: [deviceId], play: false }),
  });
}
