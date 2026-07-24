import { Component, createEffect, createSignal, For, onCleanup, Show, untrack } from "solid-js";
import { Portal } from "solid-js/web";
import { Transition } from "solid-transition-group";
import { getTrack, isSpotifyLoggedIn, searchTracks, spotifyUrlToUri } from "../../../lib/spotify";
import type { SpotifyTrack } from "../../../lib/spotify";
import type { SongItem } from "../../../model/songItem";
import type { CategoryColorScheme } from "./categoryColors";
import { clampCueSeconds, maxCueSeconds, parseCueSeconds } from "./cuePoint";
import { animateModalEnter, animateModalExit } from "./songItemFlip";

interface SongItemEditModalProps {
  item: SongItem;
  colorScheme: CategoryColorScheme;
  isEditing: boolean;
  enterRect: () => DOMRect | null; // origin tile rect captured on open
  exitRect: () => DOMRect | null; // re-measured tile rect for close
  onUpdate: (
    songUrl: string,
    title?: string,
    artist?: string,
    startTime?: number,
    durationMs?: number,
    imageUrl?: string,
  ) => void;
  onBlur: () => void;
}

const SongItemEditModal: Component<SongItemEditModalProps> = (props) => {
  // Local draft of the URL, committed on save. Seeded per item identity and
  // re-seeded when the edit modal opens — no prop-mirroring effect.
  const [localUrl, setLocalUrl] = createSignal(props.item.songUrl || "");
  // Cue point (seconds) as a raw input string; empty means "leave unchanged".
  const [localStartTime, setLocalStartTime] = createSignal(
    props.item.startTime != null ? String(props.item.startTime) : "",
  );
  const [searchQuery, setSearchQuery] = createSignal("");
  const [searchResults, setSearchResults] = createSignal<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = createSignal(false);
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  // Reset search state and re-seed the URL draft when the modal opens
  createEffect(() => {
    if (props.isEditing) {
      setSearchQuery("");
      setSearchResults([]);
      setLocalUrl(untrack(() => props.item.songUrl) || "");
      setLocalStartTime(
        untrack(() => (props.item.startTime != null ? String(props.item.startTime) : "")),
      );
    }
  });

  // Close on Escape key
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && props.isEditing) {
      props.onBlur();
    }
  };

  createEffect(() => {
    if (!props.isEditing) return;
    document.addEventListener("keydown", handleKeyDown);
    onCleanup(() => document.removeEventListener("keydown", handleKeyDown));
  });

  // Track length (in whole seconds), so the cue point can't be set past the end
  // of the currently stored song.
  const maxStartSeconds = (): number | undefined => maxCueSeconds(props.item.durationMs);

  // Cue-point input clamped to the stored track length (used on URL/cue save).
  const parsedStartTime = (): number | undefined =>
    clampCueSeconds(parseCueSeconds(localStartTime()), maxStartSeconds());

  // Clamp as the host types so the field itself can never hold a value past the
  // cap (the `max` attribute alone doesn't block typing). Blank/partial input
  // passes through untouched. When clamping we also reset the element's value
  // directly: once the signal already holds the cap, setting it to the cap again
  // is a no-op (===), so the controlled `value` binding never re-runs and the DOM
  // would otherwise keep the over-cap text the host kept typing.
  const handleStartTimeInput = (el: HTMLInputElement) => {
    const max = maxStartSeconds();
    const parsed = parseCueSeconds(el.value);
    if (parsed != null && max != null && parsed > max) {
      const clamped = String(max);
      el.value = clamped;
      setLocalStartTime(clamped);
    } else {
      setLocalStartTime(el.value);
    }
  };

  const handleUrlSubmit = () => {
    props.onUpdate(localUrl(), undefined, undefined, parsedStartTime());
    props.onBlur();
  };

  const handleSearchInput = (query: string) => {
    setSearchQuery(query);
    clearTimeout(debounceTimer);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    debounceTimer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchTracks(query, 5);
        setSearchResults(results);
      } catch (err) {
        console.error("[SongItemEditModal] Search failed:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSelectTrack = (track: SpotifyTrack) => {
    const trackId = track.uri.replace("spotify:track:", "");
    const url = `https://open.spotify.com/track/${trackId}`;
    // Clamp against the newly selected track's length, not the previously
    // stored one — the new duration isn't on props.item yet.
    const startTime = clampCueSeconds(
      parseCueSeconds(localStartTime()),
      maxCueSeconds(track.durationMs),
    );
    props.onUpdate(url, track.name, track.artist, startTime, track.durationMs, track.albumArt);
    // Keep the local URL draft in sync so a later cue-point Save (which sends
    // localUrl) doesn't overwrite the just-selected track.
    setLocalUrl(url);
    setSearchQuery("");
    setSearchResults([]);
    // Stay open so the host can set a start-at cue point without re-opening the
    // modal — the cue-point section reveals itself now that a song is set.
  };

  const spotifyConnected = () => isSpotifyLoggedIn();

  // The cue point is only offered to connected Spotify users on a Spotify
  // track — that's the only path where a track length is available, so it's the
  // only one where the "start before the end" cap can be enforced. Non-Spotify
  // songs and non-connected users don't get the feature.
  const cuePointAvailable = () => spotifyConnected() && spotifyUrlToUri(localUrl()) != null;

  // Backfill a missing track length for Spotify songs added before we captured
  // durationMs. Without it the cap can't be enforced, so fetch it once (a
  // connected user has a token) and store it — the derived cap then kicks in.
  let durationFetchedFor: string | null = null;
  createEffect(() => {
    // Only when this song's modal is actually open — the modal is mounted for
    // every tile, so an ungated fetch would hit the API once per board song.
    if (!props.isEditing || !cuePointAvailable()) return;
    if (props.item.durationMs != null && props.item.durationMs > 0) return;
    const uri = spotifyUrlToUri(localUrl());
    if (!uri) return;
    const trackId = uri.replace("spotify:track:", "");
    if (durationFetchedFor === trackId) return; // already fetching/fetched this track
    durationFetchedFor = trackId;
    const url = untrack(localUrl);
    getTrack(trackId)
      .then((track) => props.onUpdate(url, undefined, undefined, undefined, track.durationMs))
      .catch((err) => {
        console.error("[SongItemEditModal] Failed to fetch track length:", err);
        durationFetchedFor = null; // allow a retry next time the modal reopens
      });
  });

  return (
    <Portal>
      <Transition
        onEnter={(el, done) => animateModalEnter(el, props.enterRect(), done)}
        onExit={(el, done) => animateModalExit(el, props.exitRect(), done)}
      >
        <Show when={props.isEditing}>
          <div class="fixed inset-0 z-100 flex items-center justify-center">
            {/* Subtle backdrop — click to close */}
            <div class="absolute inset-0 bg-night/80" onClick={() => props.onBlur()} />

            {/* Modal card */}
            <div
              data-modal-card
              class="relative z-10 w-full max-w-md rounded-xl border bg-surface p-5 shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
              style={{ "border-color": props.colorScheme.border }}
            >
              {/* Close button */}
              <button
                type="button"
                onClick={() => props.onBlur()}
                class="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Header with level number */}
              <div class="mb-4 flex items-center gap-3">
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border"
                  style={{
                    "background-color": props.colorScheme.itemBg,
                    "border-color": props.colorScheme.border,
                  }}
                >
                  <span class="font-mono text-xl font-bold" style={{ color: "var(--color-ink)" }}>
                    {props.item.level}
                  </span>
                </div>
                <Show when={props.item.imageUrl}>
                  {(src) => (
                    <img src={src()} alt="" class="h-12 w-12 shrink-0 rounded-lg object-cover" />
                  )}
                </Show>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold text-ink">Level {props.item.level}</p>
                  <Show when={props.item.title}>
                    <p class="truncate text-xs text-muted">
                      {props.item.title}
                      {props.item.artist ? ` — ${props.item.artist}` : ""}
                    </p>
                  </Show>
                </div>
              </div>

              {/* Input area */}
              <div class="flex flex-col gap-3">
                <Show
                  when={spotifyConnected()}
                  fallback={
                    <div class="flex items-center gap-2">
                      <input
                        type="text"
                        value={localUrl()}
                        onInput={(e) => setLocalUrl(e.currentTarget.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleUrlSubmit()}
                        placeholder="Paste a song URL…"
                        class="min-w-0 flex-1 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink placeholder:text-muted transition outline-none focus:border-beat focus:ring-2 focus:ring-beat/20"
                        autofocus
                      />
                      <button
                        type="button"
                        onClick={handleUrlSubmit}
                        class="shrink-0 rounded-full bg-beat px-4 py-3 text-sm font-bold text-night transition hover:bg-beat-bright"
                      >
                        Save
                      </button>
                    </div>
                  }
                >
                  <div class="flex flex-col gap-2">
                    <input
                      type="text"
                      value={searchQuery()}
                      onInput={(e) => handleSearchInput(e.currentTarget.value)}
                      placeholder="Search for a song…"
                      class="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink placeholder:text-muted transition outline-none focus:border-beat focus:ring-2 focus:ring-beat/20"
                      autofocus
                    />

                    {/* Search results */}
                    <Show when={searchResults().length > 0 || isSearching()}>
                      <div class="max-h-64 overflow-y-auto rounded-xl border border-line bg-surface">
                        <Show when={isSearching()}>
                          <div class="px-3 py-3 text-center text-xs text-muted">Searching…</div>
                        </Show>
                        <For each={searchResults()}>
                          {(track) => (
                            <button
                              type="button"
                              class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-surface-2"
                              onClick={() => handleSelectTrack(track)}
                            >
                              <Show when={track.albumArt}>
                                <img
                                  src={track.albumArt}
                                  alt=""
                                  class="h-10 w-10 shrink-0 rounded"
                                />
                              </Show>
                              <div class="min-w-0 flex-1">
                                <p class="truncate text-sm font-semibold text-ink">{track.name}</p>
                                <p class="truncate text-xs text-muted">{track.artist}</p>
                              </div>
                            </button>
                          )}
                        </For>
                      </div>
                    </Show>
                  </div>
                </Show>

                {/* Cue point — where playback starts, to skip long intros.
                    Connected Spotify users on a Spotify track only (that's the
                    only path with a length to cap against). */}
                <Show when={cuePointAvailable()}>
                  <div class="flex flex-col gap-1 border-t border-line pt-3">
                    <div class="flex items-end gap-2">
                      <label class="flex flex-1 flex-col gap-1">
                        <span class="text-xs font-semibold text-muted">Start at (seconds)</span>
                        <input
                          type="number"
                          min="0"
                          max={maxStartSeconds()}
                          inputmode="numeric"
                          value={localStartTime()}
                          onInput={(e) => handleStartTimeInput(e.currentTarget)}
                          onKeyPress={(e) => e.key === "Enter" && handleUrlSubmit()}
                          placeholder="0"
                          class="w-full rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-sm text-ink placeholder:text-muted transition outline-none focus:border-beat focus:ring-2 focus:ring-beat/20"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleUrlSubmit}
                        class="shrink-0 rounded-full bg-beat px-4 py-2.5 text-sm font-bold text-night transition hover:bg-beat-bright"
                      >
                        Save
                      </button>
                    </div>
                    <p class="text-xs text-muted">
                      Skip long intros — playback jumps here.
                      <Show when={maxStartSeconds()}>{(max) => <> Max {max()}s.</>}</Show>
                    </p>
                  </div>
                </Show>
              </div>
            </div>
          </div>
        </Show>
      </Transition>
    </Portal>
  );
};

export default SongItemEditModal;
