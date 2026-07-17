import { Component, createSignal, For, Show } from "solid-js";
import {
  isSpotifyLoggedIn,
  loginWithSpotifyPopup,
  getMySpotifyPlaylists,
  getOwnPlaylistTracks,
} from "../../../lib/spotify";
import type { SpotifyPlaylistBrief } from "../../../lib/spotify";
import type { Category } from "../../../model/category";
import type { SongItem } from "../../../model/songItem";
import { MAX_CATEGORIES } from "./categoryColors";

interface SpotifyImportPanelProps {
  /** Import is create-mode only; edit mode just shows the connected chip. */
  isEditMode: boolean;
  /** Receives the freshly built board and the playlist name it came from. */
  onImport: (categories: Category[], playlistName: string) => void;
}

const SpotifyLogo: Component = () => (
  <svg class="h-5 w-5 text-spotify" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
  </svg>
);

/**
 * Spotify connection status + playlist import (create mode).
 * Builds the categories from the chosen playlist and hands them to the
 * parent via onImport — board state stays with the room editor.
 */
const SpotifyImportPanel: Component<SpotifyImportPanelProps> = (props) => {
  const [showPlaylistPicker, setShowPlaylistPicker] = createSignal(false);
  const [myPlaylists, setMyPlaylists] = createSignal<SpotifyPlaylistBrief[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = createSignal(false);
  const [playlistSearch, setPlaylistSearch] = createSignal("");
  const [importMode, setImportMode] = createSignal<"single" | "genres" | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = createSignal<SpotifyPlaylistBrief | null>(null);
  const [importLoading, setImportLoading] = createSignal(false);

  const filteredPlaylists = () => {
    const q = playlistSearch().toLowerCase();
    if (!q) return myPlaylists();
    return myPlaylists().filter((p) => p.name.toLowerCase().includes(q));
  };

  const openPlaylistPicker = async () => {
    setShowPlaylistPicker(true);
    if (myPlaylists().length > 0) return;

    setPlaylistsLoading(true);
    try {
      const playlists = await getMySpotifyPlaylists(50);
      setMyPlaylists(playlists);
    } catch (err) {
      console.error("Failed to load playlists:", err);
    } finally {
      setPlaylistsLoading(false);
    }
  };

  const handlePlaylistSelect = (playlist: SpotifyPlaylistBrief) => {
    setSelectedPlaylist(playlist);
    setImportMode(null);
  };

  const handleImport = async (mode: "single" | "genres") => {
    const playlist = selectedPlaylist();
    if (!playlist) return;

    setImportMode(mode);
    setImportLoading(true);

    try {
      const tracks = await getOwnPlaylistTracks(playlist.id);
      if (tracks.length === 0) {
        alert("The playlist has no tracks.");
        return;
      }

      const toItem = (t: (typeof tracks)[number], idx: number): SongItem => ({
        id: crypto.randomUUID(),
        level: idx + 1,
        title: t.name,
        artist: t.artist,
        songUrl: t.uri,
        isRevealed: false,
      });

      let categories: Category[];
      if (mode === "single") {
        // All tracks in one category
        categories = [
          {
            id: crypto.randomUUID(),
            name: playlist.name,
            items: tracks.map(toItem),
          },
        ];
      } else {
        // Shuffle, then chunk into categories of ~6 songs
        const shuffled = [...tracks].sort(() => Math.random() - 0.5);
        const CHUNK_SIZE = 6;
        categories = [];

        for (
          let i = 0;
          i < shuffled.length && categories.length < MAX_CATEGORIES;
          i += CHUNK_SIZE
        ) {
          categories.push({
            id: crypto.randomUUID(),
            name: `Round ${categories.length + 1}`,
            items: shuffled.slice(i, i + CHUNK_SIZE).map(toItem),
          });
        }
      }

      props.onImport(categories, playlist.name);

      // Close picker
      setShowPlaylistPicker(false);
      setSelectedPlaylist(null);
      setImportMode(null);
    } catch (err) {
      console.error("Failed to import playlist:", err);
      alert("Could not import the playlist. Please try again.");
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <Show
      when={isSpotifyLoggedIn()}
      fallback={
        <div class="mb-6">
          <button
            type="button"
            onClick={() => loginWithSpotifyPopup()}
            class="flex items-center gap-2 rounded-full border border-spotify/30 bg-spotify/10 px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-spotify/20"
          >
            <SpotifyLogo />
            Connect Spotify to search songs
          </button>
        </div>
      }
    >
      <Show
        when={!props.isEditMode}
        fallback={
          <div class="mb-6">
            <div class="inline-flex items-center gap-2 rounded-full border border-spotify/30 bg-spotify/10 px-4 py-2.5 text-sm font-semibold text-ink">
              <SpotifyLogo />
              <span class="inline-block h-2 w-2 rounded-full bg-spotify" />
              Spotify connected — click a song card to search
            </div>
          </div>
        }
      >
        <div class="mb-6">
          <Show
            when={!showPlaylistPicker()}
            fallback={
              <div class="rounded-2xl border border-line bg-surface p-4">
                {/* Header with close */}
                <div class="mb-3 flex items-center justify-between">
                  <h3 class="font-display font-bold text-ink">Choose a playlist</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlaylistPicker(false);
                      setSelectedPlaylist(null);
                      setImportMode(null);
                    }}
                    class="text-sm text-muted hover:text-ink"
                  >
                    Close
                  </button>
                </div>

                {/* Search */}
                <input
                  type="text"
                  value={playlistSearch()}
                  onInput={(e) => setPlaylistSearch(e.currentTarget.value)}
                  placeholder="Search playlists…"
                  class="mb-3 w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-muted/60 outline-none focus:border-beat focus:ring-2 focus:ring-beat/20"
                />

                {/* Loading */}
                <Show when={playlistsLoading()}>
                  <div class="flex justify-center py-8">
                    <div class="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-beat" />
                  </div>
                </Show>

                {/* Playlist list */}
                <Show when={!playlistsLoading()}>
                  <div class="max-h-64 space-y-1 overflow-y-auto">
                    <For each={filteredPlaylists()}>
                      {(playlist) => (
                        <button
                          type="button"
                          class={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                            selectedPlaylist()?.id === playlist.id
                              ? "bg-beat-soft ring-2 ring-beat"
                              : "hover:bg-surface-2"
                          }`}
                          onClick={() => handlePlaylistSelect(playlist)}
                        >
                          <div class="h-10 w-10 shrink-0 overflow-hidden rounded bg-surface-2">
                            <Show when={playlist.images?.[0]?.url}>
                              <img
                                src={playlist.images[0].url}
                                alt=""
                                class="h-full w-full object-cover"
                              />
                            </Show>
                          </div>
                          <div class="min-w-0 flex-1">
                            <p class="truncate text-sm font-semibold text-ink">{playlist.name}</p>
                            <p class="text-xs text-muted">{playlist.items?.total ?? "?"} tracks</p>
                          </div>
                        </button>
                      )}
                    </For>

                    <Show when={filteredPlaylists().length === 0 && !playlistsLoading()}>
                      <p class="py-4 text-center text-sm text-muted">No playlists found</p>
                    </Show>
                  </div>

                  {/* Mode picker — shown when a playlist is selected */}
                  <Show when={selectedPlaylist()}>
                    <div class="mt-4 border-t border-line pt-4">
                      <p class="mb-3 text-sm font-semibold text-ink">
                        How do you want to import "{selectedPlaylist()!.name}"?
                      </p>
                      <div class="flex gap-3">
                        <button
                          type="button"
                          disabled={importLoading()}
                          onClick={() => handleImport("single")}
                          class="flex-1 rounded-xl border border-line px-4 py-3 text-sm font-semibold text-ink transition hover:border-beat hover:bg-beat-soft/40 disabled:opacity-50"
                        >
                          <Show
                            when={!(importLoading() && importMode() === "single")}
                            fallback={
                              <div class="flex justify-center">
                                <div class="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-beat" />
                              </div>
                            }
                          >
                            All in one category
                          </Show>
                        </button>
                        <button
                          type="button"
                          disabled={importLoading()}
                          onClick={() => handleImport("genres")}
                          class="flex-1 rounded-xl border border-line px-4 py-3 text-sm font-semibold text-ink transition hover:border-beat hover:bg-beat-soft/40 disabled:opacity-50"
                        >
                          <Show
                            when={!(importLoading() && importMode() === "genres")}
                            fallback={
                              <div class="flex justify-center">
                                <div class="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-beat" />
                              </div>
                            }
                          >
                            Split into categories
                          </Show>
                        </button>
                      </div>
                    </div>
                  </Show>
                </Show>
              </div>
            }
          >
            <button
              type="button"
              onClick={openPlaylistPicker}
              class="flex items-center gap-2 rounded-full border border-spotify/30 bg-spotify/10 px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-spotify/20"
            >
              <SpotifyLogo />
              Import from Spotify
            </button>
          </Show>
        </div>
      </Show>
    </Show>
  );
};

export default SpotifyImportPanel;
