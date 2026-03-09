import { useNavigate, useSearchParams } from "@solidjs/router";
import { Component, createSignal, For, onMount, Show } from "solid-js";
import { useAuth } from "../../../context/AuthContext";
import type { Category } from "../../../model/category";
import type { SongItem } from "../../../model/songItem";
import {
  createRoom as createRoomInFirestore,
  getRoom,
  updateRoom as updateRoomInFirestore,
} from "../../../services/roomsService";
import {
  isSpotifyLoggedIn,
  getMySpotifyPlaylists,
  getOwnPlaylistTracks,
} from "../../../lib/spotify";
import type { SpotifyPlaylistBrief, SpotifyTrack } from "../../../lib/spotify";
import AddCategoryButton from "./AddCategoryButton";
import {
  generateColorScheme,
  MAX_CATEGORIES,
  MAX_ITEMS_CREATE,
  resetHueAssignments,
} from "./categoryColors";
import CategoryColumn from "./CategoryColumn";

const CreateRoom: Component = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const auth = useAuth();
  const [roomName, setRoomName] = createSignal("");
  const [isPublic, setIsPublic] = createSignal(false);
  const [categories, setCategories] = createSignal<Category[]>([]);
  const [editingCategory, setEditingCategory] = createSignal<string | null>(
    null
  );
  const [editingItem, setEditingItem] = createSignal<string | null>(null);
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [isLoadingRoom, setIsLoadingRoom] = createSignal(false);

  // Spotify playlist import state
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
        alert("Spillelisten har ingen spor.");
        return;
      }

      // Set room name from playlist if empty
      if (!roomName().trim()) {
        setRoomName(playlist.name);
      }

      resetHueAssignments();

      if (mode === "single") {
        // All tracks in one category
        const items: SongItem[] = tracks.map((t, idx) => ({
          id: crypto.randomUUID(),
          level: idx + 1,
          title: t.name,
          artist: t.artist,
          songUrl: t.uri,
          isRevealed: false,
        }));

        const cat: Category = {
          id: crypto.randomUUID(),
          name: playlist.name,
          items,
        };
        setCategories([cat]);
      } else {
        // Group tracks by first artist letter as a rough genre split,
        // then chunk into categories of 5-7 songs
        const shuffled = [...tracks].sort(() => Math.random() - 0.5);
        const CHUNK_SIZE = 6;
        const cats: Category[] = [];

        for (let i = 0; i < shuffled.length && cats.length < MAX_CATEGORIES; i += CHUNK_SIZE) {
          const chunk = shuffled.slice(i, i + CHUNK_SIZE);
          const items: SongItem[] = chunk.map((t, idx) => ({
            id: crypto.randomUUID(),
            level: idx + 1,
            title: t.name,
            artist: t.artist,
            songUrl: t.uri,
            isRevealed: false,
          }));

          cats.push({
            id: crypto.randomUUID(),
            name: `Runde ${cats.length + 1}`,
            items,
          });
        }

        setCategories(cats);
      }

      // Register hues for the new categories
      for (const cat of categories()) {
        generateColorScheme(cat.id);
      }

      // Close picker
      setShowPlaylistPicker(false);
      setSelectedPlaylist(null);
      setImportMode(null);
    } catch (err) {
      console.error("Failed to import playlist:", err);
      alert("Kunne ikke importere spillelisten. Prøv igjen.");
    } finally {
      setImportLoading(false);
    }
  };

  const editRoomId = () => searchParams.edit as string | undefined;
  const isEditMode = () => !!editRoomId();

  // Load existing room data when in edit mode, or reset for creation
  onMount(async () => {
    resetHueAssignments();

    const roomId = editRoomId();
    if (!roomId) return;

    setIsLoadingRoom(true);
    try {
      const room = await getRoom(roomId);
      if (!room) {
        alert("Rommet ble ikke funnet.");
        navigate("/dashboard");
        return;
      }

      // Populate form with existing data
      setRoomName(room.roomName);
      setIsPublic(room.isPublic);
      setCategories(room.categories);

      // Register existing category hues so new ones get distinct colors
      for (const cat of room.categories) {
        generateColorScheme(cat.id);
      }
    } catch (err) {
      console.error("Failed to load room for editing:", err);
      alert("Kunne ikke laste rommet. Prøv igjen.");
      navigate("/dashboard");
    } finally {
      setIsLoadingRoom(false);
    }
  });

  // Check if we've reached the maximum categories
  const canAddCategory = () => categories().length < MAX_CATEGORIES;

  // Check if room creation requirements are met
  const canCreateRoom = () => {
    const hasRoomName = roomName().trim().length > 0;
    const hasCategories = categories().length > 0;
    const allCategoriesHaveItems = categories().every(
      (c) => c.items.length > 0
    );
    return hasRoomName && hasCategories && allCategoriesHaveItems;
  };

  // Add a new category
  const addCategory = () => {
    if (!canAddCategory()) return;

    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: "Ny kategori",
      items: [
        {
          id: `item-${Date.now()}`,
          level: 1,
          isRevealed: false,
          songUrl: "",
        },
      ],
    };
    setCategories([...categories(), newCategory]);
    setEditingCategory(newCategory.id);
  };

  // Update category name
  const updateCategoryName = (categoryId: string, name: string) => {
    setCategories(
      categories().map((c) => (c.id === categoryId ? { ...c, name } : c))
    );
  };

  // Remove a category
  const removeCategory = (categoryId: string) => {
    setCategories(categories().filter((c) => c.id !== categoryId));
  };

  // Add item to a category
  const addItem = (categoryId: string) => {
    const newItemId = `item-${Date.now()}`;
    setCategories(
      categories().map((c) => {
        if (c.id !== categoryId) return c;
        const newItem: SongItem = {
          id: newItemId,
          level: c.items.length + 1,
          isRevealed: false,
          songUrl: "",
        };
        return { ...c, items: [...c.items, newItem] };
      })
    );
    setEditingItem(newItemId);
  };

  // Update item song URL and optional metadata (title, artist)
  const updateItem = (
    categoryId: string,
    itemId: string,
    songUrl: string,
    title?: string,
    artist?: string,
  ) => {
    setCategories(
      categories().map((c) => {
        if (c.id !== categoryId) return c;
        return {
          ...c,
          items: c.items.map((item) =>
            item.id === itemId
              ? { ...item, songUrl, title: title ?? item.title, artist: artist ?? item.artist }
              : item
          ),
        };
      })
    );
  };

  // Remove item from category
  const removeItem = (categoryId: string, itemId: string) => {
    setCategories(
      categories().map((c) => {
        if (c.id !== categoryId) return c;
        const filteredItems = c.items.filter((item) => item.id !== itemId);
        // Re-number levels
        return {
          ...c,
          items: filteredItems.map((item, index) => ({
            ...item,
            level: index + 1,
          })),
        };
      })
    );
  };

  // Count empty song URLs for warning
  const countEmptySongUrls = () => {
    let count = 0;
    for (const category of categories()) {
      for (const item of category.items) {
        if (!item.songUrl?.trim()) {
          count++;
        }
      }
    }
    return count;
  };

  // Submit the room (handles both create and edit)
  const handleSubmit = async () => {
    const name = roomName().trim();

    if (!name) {
      alert("Vennligst skriv inn et romnavn");
      return;
    }

    if (categories().length === 0) {
      alert("Legg til minst én kategori");
      return;
    }

    const hasEmptyCategories = categories().some((c) => c.items.length === 0);
    if (hasEmptyCategories) {
      alert("Alle kategorier må ha minst én sang");
      return;
    }

    // Check for empty song URLs and warn user (one-time confirmation)
    const emptyCount = countEmptySongUrls();
    if (emptyCount > 0) {
      const confirmed = confirm(
        `Du har ${emptyCount} sang${emptyCount > 1 ? "er" : ""} uten URL. Vil du fortsette uten å legge til URL-er?`
      );
      if (!confirmed) {
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const roomId = editRoomId();
      if (roomId) {
        // Edit mode — update existing room
        await updateRoomInFirestore(roomId, {
          roomName: name,
          hostName: auth.djName() || auth.state.user?.displayName || "Anonym",
          categories: categories(),
          isPublic: isPublic(),
        });
      } else {
        // Create mode — create new room
        await createRoomInFirestore({
          roomName: name,
          hostName: auth.djName() || auth.state.user?.displayName || "Anonym",
          categories: categories(),
          isPublic: isPublic(),
          isActive: true,
          createdAt: Date.now(),
        });
      }
      navigate("/dashboard");
    } catch (error) {
      console.error(
        `Failed to ${isEditMode() ? "update" : "create"} room:`,
        error
      );
      alert(
        isEditMode()
          ? "Kunne ikke oppdatere rommet. Prøv igjen."
          : "Kunne ikke opprette rom. Prøv igjen."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Show
      when={!isLoadingRoom()}
      fallback={
        <div class="flex min-h-screen items-center justify-center bg-[#f4f6f8]">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-900" />
        </div>
      }
    >
    <div class="min-h-screen bg-[#f4f6f8] p-6">
      <div class="mx-auto max-w-7xl">
        {/* Header */}
        <div class="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            class="flex items-center gap-2 text-neutral-600 transition hover:text-neutral-900"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span class="font-medium">Tilbake</span>
          </button>

          <div class="flex items-center gap-3">
            {/* Public toggle with lock icons */}
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic())}
              class={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                isPublic()
                  ? "bg-green-100 text-green-700"
                  : "bg-neutral-200 text-neutral-600"
              }`}
            >
              <Show
                when={isPublic()}
                fallback={
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                }
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                  />
                </svg>
              </Show>
              {isPublic() ? "Offentlig rom" : "Privat rom"}
            </button>

            {/* Submit button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting() || !canCreateRoom()}
              class="rounded-lg bg-neutral-900 px-6 py-2 font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting()
                ? isEditMode()
                  ? "Lagrer..."
                  : "Oppretter..."
                : isEditMode()
                  ? "Lagre endringer"
                  : "Opprett rom"}
            </button>
          </div>
        </div>

        {/* Room name input */}
        <div class="mb-8">
          <input
            type="text"
            value={roomName()}
            onInput={(e) => setRoomName(e.currentTarget.value)}
            placeholder="Skriv inn romnavn..."
            class="w-full max-w-md border-b-2 border-neutral-300 bg-transparent pb-2 text-3xl font-bold text-neutral-900 placeholder-neutral-400 outline-none focus:border-blue-500"
          />
          <p class="mt-2 text-neutral-500">
            Klikk på + for å legge til kategorier og sanger
            <Show when={categories().length > 0}>
              <span class="ml-2 text-neutral-400">
                ({categories().length}/{MAX_CATEGORIES} kategorier)
              </span>
            </Show>
          </p>
        </div>

        {/* Spotify playlist import */}
        <Show when={isSpotifyLoggedIn() && !isEditMode()}>
          <div class="mb-6">
            <Show
              when={!showPlaylistPicker()}
              fallback={
                <div class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                  {/* Header with close */}
                  <div class="mb-3 flex items-center justify-between">
                    <h3 class="font-semibold text-neutral-900">
                      Velg spilleliste
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPlaylistPicker(false);
                        setSelectedPlaylist(null);
                        setImportMode(null);
                      }}
                      class="text-sm text-neutral-500 hover:text-neutral-700"
                    >
                      Lukk
                    </button>
                  </div>

                  {/* Search */}
                  <input
                    type="text"
                    value={playlistSearch()}
                    onInput={(e) => setPlaylistSearch(e.currentTarget.value)}
                    placeholder="Søk i spillelister..."
                    class="mb-3 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-blue-400"
                  />

                  {/* Loading */}
                  <Show when={playlistsLoading()}>
                    <div class="flex justify-center py-8">
                      <div class="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700" />
                    </div>
                  </Show>

                  {/* Playlist list */}
                  <Show when={!playlistsLoading()}>
                    <div class="max-h-64 space-y-1 overflow-y-auto">
                      <For each={filteredPlaylists()}>
                        {(playlist) => (
                          <button
                            type="button"
                            class={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition ${
                              selectedPlaylist()?.id === playlist.id
                                ? "bg-blue-50 ring-2 ring-blue-400"
                                : "hover:bg-neutral-50"
                            }`}
                            onClick={() => handlePlaylistSelect(playlist)}
                          >
                            <div class="h-10 w-10 shrink-0 overflow-hidden rounded bg-neutral-200">
                              <Show when={playlist.images?.[0]?.url}>
                                <img
                                  src={playlist.images[0].url}
                                  alt=""
                                  class="h-full w-full object-cover"
                                />
                              </Show>
                            </div>
                            <div class="min-w-0 flex-1">
                              <p class="truncate text-sm font-medium text-neutral-900">
                                {playlist.name}
                              </p>
                              <p class="text-xs text-neutral-500">
                                {playlist.items?.total ?? "?"} spor
                              </p>
                            </div>
                          </button>
                        )}
                      </For>

                      <Show when={filteredPlaylists().length === 0 && !playlistsLoading()}>
                        <p class="py-4 text-center text-sm text-neutral-500">
                          Ingen spillelister funnet
                        </p>
                      </Show>
                    </div>

                    {/* Mode picker — shown when a playlist is selected */}
                    <Show when={selectedPlaylist()}>
                      <div class="mt-4 border-t border-neutral-100 pt-4">
                        <p class="mb-3 text-sm font-medium text-neutral-700">
                          Hvordan vil du importere «{selectedPlaylist()!.name}»?
                        </p>
                        <div class="flex gap-3">
                          <button
                            type="button"
                            disabled={importLoading()}
                            onClick={() => handleImport("single")}
                            class="flex-1 rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-700 transition hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50"
                          >
                            <Show
                              when={!(importLoading() && importMode() === "single")}
                              fallback={
                                <div class="flex justify-center">
                                  <div class="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700" />
                                </div>
                              }
                            >
                              Alle i én kategori
                            </Show>
                          </button>
                          <button
                            type="button"
                            disabled={importLoading()}
                            onClick={() => handleImport("genres")}
                            class="flex-1 rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-700 transition hover:border-purple-400 hover:bg-purple-50 disabled:opacity-50"
                          >
                            <Show
                              when={!(importLoading() && importMode() === "genres")}
                              fallback={
                                <div class="flex justify-center">
                                  <div class="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700" />
                                </div>
                              }
                            >
                              Delt i kategorier
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
                class="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 transition hover:bg-green-100"
              >
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
                Importer fra Spotify
              </button>
            </Show>
          </div>
        </Show>

        {/* Game board style grid - wraps to next row if needed */}
        <div class="flex flex-wrap gap-6 pt-4 pb-4">
          {/* Existing categories */}
          <For each={categories()}>
            {(category) => {
              // Generate color based on category ID for consistent, unique colors
              const colorScheme = generateColorScheme(category.id);
              return (
                <CategoryColumn
                  category={category}
                  colorScheme={colorScheme}
                  maxItems={MAX_ITEMS_CREATE}
                  isEditingName={editingCategory() === category.id}
                  editingItemId={editingItem()}
                  onEditName={() => setEditingCategory(category.id)}
                  onUpdateName={(name) => updateCategoryName(category.id, name)}
                  onBlurName={() => setEditingCategory(null)}
                  onRemove={() => removeCategory(category.id)}
                  onAddItem={() => addItem(category.id)}
                  onEditItem={(itemId) => setEditingItem(itemId)}
                  onUpdateItem={(itemId, songUrl, title, artist) =>
                    updateItem(category.id, itemId, songUrl, title, artist)
                  }
                  onBlurItem={() => setEditingItem(null)}
                  onRemoveItem={(itemId) => removeItem(category.id, itemId)}
                />
              );
            }}
          </For>

          {/* Add category button, only show if user can add more categories */}
          {canAddCategory() && (
            <AddCategoryButton
              onClick={addCategory}
              disabled={!canAddCategory()}
            />
          )}
        </div>

        {/* Help text */}
        <Show when={categories().length === 0}>
          <div class="mt-12 text-center">
            <p class="text-lg text-neutral-500">
              Klikk på "Legg til kategori" for å begynne å bygge ditt spillbrett
            </p>
          </div>
        </Show>
      </div>
    </div>
    </Show>
  );
};

export default CreateRoom;
