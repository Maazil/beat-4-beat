import { Component, createEffect, createSignal, For, onCleanup, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { Transition } from "solid-transition-group";
import { isSpotifyLoggedIn, searchTracks } from "../../../lib/spotify";
import type { SpotifyTrack } from "../../../lib/spotify";
import type { SongItem } from "../../../model/songItem";
import type { CategoryColorScheme } from "./categoryColors";

interface SongItemCardProps {
  item: SongItem;
  colorScheme: CategoryColorScheme;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (songUrl: string, title?: string, artist?: string) => void;
  onBlur: () => void;
  onRemove: () => void;
}

const SongItemCard: Component<SongItemCardProps> = (props) => {
  // Local state for editing
  const [localUrl, setLocalUrl] = createSignal("");
  const [searchQuery, setSearchQuery] = createSignal("");
  const [searchResults, setSearchResults] = createSignal<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = createSignal(false);
  const [originRect, setOriginRect] = createSignal<DOMRect | null>(null);
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let cardRef: HTMLDivElement | undefined;

  // Sync local state when item songUrl changes
  createEffect(() => {
    setLocalUrl(props.item.songUrl || "");
  });

  // Capture card position when entering edit mode
  createEffect(() => {
    if (props.isEditing && cardRef) {
      setOriginRect(cardRef.getBoundingClientRect());
    }
  });

  // Reset search state when editing state changes
  createEffect(() => {
    if (props.isEditing) {
      setSearchQuery("");
      setSearchResults([]);
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

  const handleUrlSubmit = () => {
    props.onUpdate(localUrl());
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
        console.error("[SongItemCard] Search failed:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSelectTrack = (track: SpotifyTrack) => {
    const trackId = track.uri.replace("spotify:track:", "");
    const url = `https://open.spotify.com/track/${trackId}`;
    props.onUpdate(url, track.name, track.artist);
    setSearchQuery("");
    setSearchResults([]);
    props.onBlur();
  };

  const spotifyConnected = () => isSpotifyLoggedIn();

  return (
    <div class="group relative flex w-full flex-col">
      {/* In-place card — always visible */}
      <div
        ref={cardRef}
        class="stage-card flex h-16 w-full items-center justify-center rounded-lg sm:h-20"
        style={{
          "--stage-ink": props.colorScheme.border,
          "--stage-tint": props.colorScheme.itemBg,
          "--stage-tint-hover": props.colorScheme.itemBgHover,
          opacity: props.isEditing ? 0.5 : 1,
        }}
      >
        <button
          type="button"
          class="flex h-full w-full flex-col items-center justify-center"
          onClick={() => !props.isEditing && props.onEdit()}
        >
          <span class="font-mono text-2xl font-bold" style={{ color: "var(--color-ink)" }}>
            {props.item.level}
          </span>
          <Show when={props.item.title && !props.isEditing}>
            <span
              class="max-w-full truncate px-1 text-[10px] leading-tight opacity-70"
              style={{ color: "var(--color-ink)" }}
            >
              {props.item.title}
            </span>
          </Show>
        </button>

        {/* Song URL indicator */}
        <Show when={props.item.songUrl && !props.isEditing}>
          <div class="absolute right-1 bottom-1">
            <svg class="h-4 w-4 text-spotify" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>
        </Show>

        {/* Delete item button */}
        <Show when={!props.isEditing}>
          <button
            type="button"
            onClick={() => props.onRemove()}
            class="absolute -top-2 -right-2 hidden h-5 w-5 items-center justify-center rounded-full bg-ink text-night transition group-hover:flex hover:bg-beat"
          >
            <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </Show>
      </div>

      {/* Editing modal — rendered via Portal */}
      <Portal>
        <Transition
          onEnter={(el, done) => {
            const rect = originRect();
            const modalCard = el.querySelector("[data-modal-card]") as HTMLElement | null;
            if (!rect || !modalCard) {
              el.animate([{ opacity: 0 }, { opacity: 1 }], {
                duration: 200,
                easing: "ease-out",
              }).finished.then(done);
              return;
            }
            // Force layout so we can measure the modal's resting position
            const modalRect = modalCard.getBoundingClientRect();
            const dx = rect.left + rect.width / 2 - (modalRect.left + modalRect.width / 2);
            const dy = rect.top + rect.height / 2 - (modalRect.top + modalRect.height / 2);
            const scaleX = rect.width / modalRect.width;
            const scaleY = rect.height / modalRect.height;

            modalCard
              .animate(
                [
                  {
                    transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`,
                    opacity: 0,
                    borderRadius: "0.5rem",
                  },
                  {
                    transform: "translate(0, 0) scale(1)",
                    opacity: 1,
                    borderRadius: "0.75rem",
                  },
                ],
                { duration: 280, easing: "cubic-bezier(0.32, 0.72, 0, 1)" },
              )
              .finished.then(done);
          }}
          onExit={(el, done) => {
            // Re-measure card position (it may have shifted due to scroll)
            const rect = cardRef?.getBoundingClientRect() ?? originRect();
            const modalCard = el.querySelector("[data-modal-card]") as HTMLElement | null;
            if (!rect || !modalCard) {
              el.animate([{ opacity: 1 }, { opacity: 0 }], {
                duration: 150,
                easing: "ease-in",
              }).finished.then(done);
              return;
            }
            const modalRect = modalCard.getBoundingClientRect();
            const dx = rect.left + rect.width / 2 - (modalRect.left + modalRect.width / 2);
            const dy = rect.top + rect.height / 2 - (modalRect.top + modalRect.height / 2);
            const scaleX = rect.width / modalRect.width;
            const scaleY = rect.height / modalRect.height;

            modalCard
              .animate(
                [
                  {
                    transform: "translate(0, 0) scale(1)",
                    opacity: 1,
                    borderRadius: "0.75rem",
                  },
                  {
                    transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`,
                    opacity: 0,
                    borderRadius: "0.5rem",
                  },
                ],
                { duration: 220, easing: "cubic-bezier(0.32, 0, 0.67, 0)" },
              )
              .finished.then(done);
          }}
        >
          <Show when={props.isEditing}>
            <div class="fixed inset-0 z-[100] flex items-center justify-center">
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
                    <span
                      class="font-mono text-xl font-bold"
                      style={{ color: "var(--color-ink)" }}
                    >
                      {props.item.level}
                    </span>
                  </div>
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
                <Show
                  when={spotifyConnected()}
                  fallback={
                    <div class="flex flex-col gap-2">
                      <input
                        type="text"
                        value={localUrl()}
                        onInput={(e) => setLocalUrl(e.currentTarget.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleUrlSubmit()}
                        placeholder="Paste a song URL…"
                        class="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink placeholder:text-muted/60 transition outline-none focus:border-beat focus:ring-2 focus:ring-beat/20"
                        autofocus
                      />
                      <button
                        type="button"
                        onClick={handleUrlSubmit}
                        class="self-end rounded-full bg-beat px-4 py-2 text-sm font-bold text-night transition hover:bg-beat-bright"
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
                      class="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink placeholder:text-muted/60 transition outline-none focus:border-beat focus:ring-2 focus:ring-beat/20"
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
              </div>
            </div>
          </Show>
        </Transition>
      </Portal>
    </div>
  );
};

export default SongItemCard;
