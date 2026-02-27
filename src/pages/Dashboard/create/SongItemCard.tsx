import { Component, createEffect, createSignal, For, Show } from "solid-js";
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
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  // Sync local state when item songUrl changes
  createEffect(() => {
    setLocalUrl(props.item.songUrl || "");
  });

  // Reset search state when editing state changes
  createEffect(() => {
    if (props.isEditing) {
      setSearchQuery("");
      setSearchResults([]);
    }
  });

  const handleUrlBlur = () => {
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
    // Convert URI to URL for storage: spotify:track:ID → https://open.spotify.com/track/ID
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
      <div
        class="flex h-16 w-full items-center justify-center rounded-lg border-2 transition-colors sm:h-20"
        style={{
          "background-color": props.colorScheme.itemBg,
          "border-color": props.colorScheme.border,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = props.colorScheme.itemBgHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = props.colorScheme.itemBg;
        }}
      >
        <Show
          when={props.isEditing}
          fallback={
            <button
              type="button"
              class="flex h-full w-full flex-col items-center justify-center"
              onClick={() => props.onEdit()}
            >
              <span
                class="text-2xl font-bold"
                style={{ color: props.colorScheme.textDark }}
              >
                {props.item.level}
              </span>
              <Show when={props.item.title && !props.isEditing}>
                <span
                  class="max-w-full truncate px-1 text-[10px] leading-tight opacity-70"
                  style={{ color: props.colorScheme.textDark }}
                >
                  {props.item.title}
                </span>
              </Show>
            </button>
          }
        >
          <Show
            when={spotifyConnected()}
            fallback={
              <input
                type="text"
                value={localUrl()}
                onInput={(e) => setLocalUrl(e.currentTarget.value)}
                onBlur={handleUrlBlur}
                onKeyPress={(e) => e.key === "Enter" && handleUrlBlur()}
                placeholder="Lim inn URL..."
                class="w-full bg-transparent px-2 text-center text-sm outline-none"
                autofocus
              />
            }
          >
            <input
              type="text"
              value={searchQuery()}
              onInput={(e) => handleSearchInput(e.currentTarget.value)}
              placeholder="Søk etter sang..."
              class="w-full bg-transparent px-2 text-center text-sm outline-none"
              autofocus
            />
          </Show>
        </Show>

        {/* Song URL indicator */}
        <Show when={props.item.songUrl && !props.isEditing}>
          <div class="absolute right-1 bottom-1">
            <svg
              class="h-4 w-4 text-green-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>
        </Show>

        {/* Delete item button */}
        <button
          type="button"
          onClick={() => props.onRemove()}
          class="absolute -top-2 -right-2 hidden h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition group-hover:flex hover:bg-red-600"
        >
          <svg
            class="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Spotify search results dropdown */}
      <Show
        when={
          props.isEditing &&
          spotifyConnected() &&
          (searchResults().length > 0 || isSearching())
        }
      >
        <div class="absolute top-full left-0 z-50 mt-1 w-64 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
          <Show when={isSearching()}>
            <div class="px-3 py-2 text-center text-xs text-neutral-400">
              Soker...
            </div>
          </Show>
          <For each={searchResults()}>
            {(track) => (
              <button
                type="button"
                class="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-neutral-100"
                onMouseDown={(e) => {
                  // Prevent blur from firing before selection
                  e.preventDefault();
                  handleSelectTrack(track);
                }}
              >
                <Show when={track.albumArt}>
                  <img
                    src={track.albumArt}
                    alt=""
                    class="h-8 w-8 shrink-0 rounded"
                  />
                </Show>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-xs font-medium text-neutral-900">
                    {track.name}
                  </p>
                  <p class="truncate text-[10px] text-neutral-500">
                    {track.artist}
                  </p>
                </div>
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

export default SongItemCard;
