import { useNavigate } from "@solidjs/router";
import { Component, createSignal, For, onMount, Show } from "solid-js";
import RoomPreview from "../../components/RoomPreview";
import { useAuth } from "../../context/AuthContext";
import { usePublicRooms } from "../../hooks/usePublicRooms";
import {
  searchPlaylists,
  loadPlaylistTracks,
  isSpotifyLoggedIn,
} from "../../lib/spotify";
import type { SpotifyPlaylistBrief } from "../../lib/spotify";
import type { Category } from "../../model/category";
import type { SongItem } from "../../model/songItem";
import { createRoom } from "../../services/roomsService";

/** Curated search queries displayed as rows on the marketplace. */
const PLAYLIST_ROWS = [
  { label: "Top 50 — Global", query: "Top 50 Global" },
  { label: "Top 50 — Norway", query: "Top 50 Norway" },
  { label: "Party Hits", query: "Party Hits" },
  { label: "Chill Vibes", query: "Chill Vibes" },
  { label: "Throwback Classics", query: "Throwback Classics" },
  { label: "Workout Energy", query: "Workout Energy" },
  { label: "R&B & Soul", query: "R&B Soul" },
  { label: "Hip-Hop", query: "Hip-Hop" },
] as const;

interface PlaylistRow {
  label: string;
  playlists: SpotifyPlaylistBrief[];
}

const Market: Component = () => {
  const { rooms, isLoading: roomsLoading, error: roomsError } = usePublicRooms();
  const { state, canCreateRooms } = useAuth();
  const navigate = useNavigate();

  const [rows, setRows] = createSignal<PlaylistRow[]>([]);
  const [rowsLoading, setRowsLoading] = createSignal(false);
  const [rowsError, setRowsError] = createSignal<string | null>(null);
  const [creatingFrom, setCreatingFrom] = createSignal<string | null>(null);
  const [spotifyConnected, setSpotifyConnected] = createSignal(isSpotifyLoggedIn());

  onMount(async () => {
    if (!isSpotifyLoggedIn()) return;

    setRowsLoading(true);
    setRowsError(null);

    try {
      const results = await Promise.all(
        PLAYLIST_ROWS.map(async (row) => {
          try {
            const playlists = await searchPlaylists(row.query);
            return { label: row.label, playlists };
          } catch {
            return { label: row.label, playlists: [] };
          }
        })
      );

      setRows(results.filter((r) => r.playlists.length > 0));
    } catch (err) {
      setRowsError(
        err instanceof Error ? err.message : "Failed to load playlists"
      );
    } finally {
      setSpotifyConnected(true);
      setRowsLoading(false);
    }
  });

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  async function handlePlaylistClick(playlist: SpotifyPlaylistBrief) {
    if (!canCreateRooms()) return;
    if (creatingFrom()) return;

    setCreatingFrom(playlist.id);

    try {
      const tracks = await loadPlaylistTracks(playlist.id);
      if (tracks.length === 0) {
        throw new Error("Playlist has no playable tracks");
      }

      const picked = shuffle(tracks).slice(0, 18);

      const CATEGORY_SIZE = 5;
      const categories: Category[] = [];
      for (let i = 0; i < picked.length; i += CATEGORY_SIZE) {
        const chunk = picked.slice(i, i + CATEGORY_SIZE);
        const roundNum = Math.floor(i / CATEGORY_SIZE) + 1;

        const items: SongItem[] = chunk.map((track, idx) => ({
          id: crypto.randomUUID(),
          level: idx + 1,
          title: track.name,
          artist: track.artist,
          songUrl: track.uri,
          isRevealed: false,
        }));

        categories.push({
          id: crypto.randomUUID(),
          name: `Runde ${roundNum}`,
          items,
        });
      }

      const roomId = await createRoom({
        roomName: playlist.name,
        hostName: state.user?.displayName || "Host",
        categories,
        isPublic: false,
        createdAt: Date.now(),
      });

      navigate(`/rooms/${roomId}/play`);
    } catch (err) {
      console.error("Failed to create room from playlist:", err);
      setRowsError(
        err instanceof Error ? err.message : "Failed to create room"
      );
    } finally {
      setCreatingFrom(null);
    }
  }

  return (
    <div class="mx-auto max-w-7xl p-6 py-12">
      <div class="mb-8">
        <h1 class="text-3xl font-semibold text-neutral-100">Marketplace</h1>
        <p class="mt-2 text-neutral-400">
          Pick a playlist and start playing instantly
        </p>
      </div>

      {/* ── Spotify Playlist Section ─────────────────────────────── */}
      <Show when={!spotifyConnected()}>
        <div class="mb-12 rounded-2xl border border-neutral-700/60 bg-neutral-800/50 p-8 text-center">
          <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
            <svg class="h-7 w-7 text-green-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
          </div>
          <h3 class="mb-2 text-lg font-semibold text-neutral-100">
            Connect Spotify to explore playlists
          </h3>
          <p class="mb-4 text-sm text-neutral-400">
            Link your Spotify account from the dashboard to browse popular playlists and create rooms instantly.
          </p>
          <button
            class="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-500"
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </button>
        </div>
      </Show>

      <Show when={spotifyConnected()}>
        <Show when={rowsError()}>
          <div class="mb-6 rounded-lg border border-red-400/50 bg-red-900/20 p-4 text-red-300">
            {rowsError()}
          </div>
        </Show>

        <Show when={rowsLoading()}>
          <div class="mb-12 space-y-8">
            <For each={[1, 2, 3]}>
              {() => (
                <div class="space-y-3">
                  <div class="h-6 w-32 animate-pulse rounded bg-neutral-700/50" />
                  <div class="flex gap-4 overflow-hidden">
                    <For each={[1, 2, 3, 4, 5]}>
                      {() => (
                        <div class="h-52 w-40 shrink-0 animate-pulse rounded-xl bg-neutral-700/50" />
                      )}
                    </For>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>

        <Show when={!rowsLoading() && rows().length > 0}>
          <div class="mb-12 space-y-8">
            <For each={rows()}>
              {(row) => (
                <div>
                  <h2 class="mb-3 text-xl font-semibold text-neutral-100">
                    {row.label}
                  </h2>
                  <div class="scrollbar-hide -mx-6 flex gap-4 overflow-x-auto px-6 pb-2">
                    <For each={row.playlists}>
                      {(playlist) => (
                        <button
                          class="group relative w-40 shrink-0 text-left focus:outline-none disabled:opacity-50"
                          onClick={() => handlePlaylistClick(playlist)}
                          disabled={!canCreateRooms() || creatingFrom() !== null}
                        >
                          <div class="overflow-hidden rounded-xl border border-neutral-700/60 bg-neutral-800/80 transition-all duration-200 group-hover:border-red-500/40 group-hover:shadow-lg group-hover:shadow-red-500/10">
                            <div class="relative aspect-square w-full overflow-hidden bg-neutral-700">
                              <Show
                                when={playlist.images[0]?.url}
                                fallback={
                                  <div class="flex h-full w-full items-center justify-center bg-neutral-700 text-3xl text-neutral-500">
                                    ♫
                                  </div>
                                }
                              >
                                <img
                                  src={playlist.images[0].url}
                                  alt={playlist.name}
                                  class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                  loading="lazy"
                                />
                              </Show>

                              <Show when={creatingFrom() === playlist.id}>
                                <div class="absolute inset-0 flex items-center justify-center bg-black/60">
                                  <div class="h-6 w-6 animate-spin rounded-full border-2 border-neutral-400 border-t-white" />
                                </div>
                              </Show>
                            </div>

                            <div class="p-3">
                              <p class="truncate text-sm font-medium text-neutral-100">
                                {playlist.name}
                              </p>
                              <p class="mt-0.5 text-xs text-neutral-400">
                                {playlist.items?.total ?? "?"} tracks
                              </p>
                            </div>
                          </div>
                        </button>
                      )}
                    </For>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </Show>

      {/* ── Community Rooms Section ──────────────────────────────── */}
      <div class="border-t border-neutral-700/60 pt-10">
        <h2 class="mb-6 text-2xl font-semibold text-neutral-100">
          Community Rooms
        </h2>

        <Show when={roomsError()}>
          <div class="mb-4 rounded-lg border border-red-400/50 bg-red-900/20 p-4 text-red-300">
            {roomsError()}
          </div>
        </Show>

        <Show when={roomsLoading()}>
          <div class="flex items-center justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-neutral-600 border-t-neutral-300" />
          </div>
        </Show>

        <Show when={!roomsLoading() && rooms().length === 0}>
          <div class="rounded-lg border border-dashed border-neutral-600 bg-neutral-800/50 p-8 text-center">
            <p class="text-neutral-400">No public rooms available yet.</p>
          </div>
        </Show>

        <Show when={!roomsLoading() && rooms().length > 0}>
          <div class="grid gap-6 lg:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
            <For each={rooms()}>{(room) => <RoomPreview room={room} />}</For>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default Market;
