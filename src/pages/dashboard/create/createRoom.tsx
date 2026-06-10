import { useNavigate, useSearchParams } from "@solidjs/router";
import { Component, createSignal, For, onMount, Show } from "solid-js";
import { useAuth } from "../../../context/AuthContext";
import type { Category } from "../../../model/category";
import type { SongItem } from "../../../model/songItem";
import {
  canEditRoom,
  createRoom as createRoomInFirestore,
  generateRoomInvite,
  getRoom,
  getRoomEditors,
  removeRoomEditor,
  revokeRoomInvite,
  updateRoom as updateRoomInFirestore,
  type RoomEditor,
} from "../../../services/roomsService";
import {
  isSpotifyLoggedIn,
  getMySpotifyPlaylists,
  getOwnPlaylistTracks,
} from "../../../lib/spotify";
import type { SpotifyPlaylistBrief } from "../../../lib/spotify";
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
  const [editingCategory, setEditingCategory] = createSignal<string | null>(null);
  const [editingItem, setEditingItem] = createSignal<string | null>(null);
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [isLoadingRoom, setIsLoadingRoom] = createSignal(false);

  // Co-owner (medeier) management state — edit mode, host only
  const [roomHostId, setRoomHostId] = createSignal<string | null>(null);
  const [editors, setEditors] = createSignal<RoomEditor[]>([]);
  const [inviteToken, setInviteToken] = createSignal<string | null>(null);
  const [inviteCopied, setInviteCopied] = createSignal(false);
  const [editorError, setEditorError] = createSignal<string | null>(null);
  const [editorBusy, setEditorBusy] = createSignal(false);

  const isHost = () => auth.isRoomHost(roomHostId() ?? undefined);

  const inviteLink = () => {
    const roomId = editRoomId();
    const token = inviteToken();
    return roomId && token ? `${window.location.origin}/invite/${roomId}/${token}` : null;
  };

  const handleGenerateInvite = async () => {
    const roomId = editRoomId();
    if (!roomId || editorBusy()) return;

    setEditorBusy(true);
    setEditorError(null);
    try {
      setInviteToken(await generateRoomInvite(roomId));
      setInviteCopied(false);
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : "Could not create the invite link");
    } finally {
      setEditorBusy(false);
    }
  };

  const handleRevokeInvite = async () => {
    const roomId = editRoomId();
    if (!roomId || editorBusy()) return;

    setEditorBusy(true);
    setEditorError(null);
    try {
      await revokeRoomInvite(roomId);
      setInviteToken(null);
      setInviteCopied(false);
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : "Could not disable the link");
    } finally {
      setEditorBusy(false);
    }
  };

  const handleCopyInvite = async () => {
    const link = inviteLink();
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      setInviteCopied(true);
    } catch {
      setEditorError("Could not copy the link — select the text and copy it manually");
    }
  };

  const handleRemoveEditor = async (uid: string) => {
    const roomId = editRoomId();
    if (!roomId) return;

    setEditorBusy(true);
    setEditorError(null);
    try {
      await removeRoomEditor(roomId, uid);
      setEditors(editors().filter((e) => e.uid !== uid));
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : "Could not remove the co-owner");
    } finally {
      setEditorBusy(false);
    }
  };

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
        alert("The playlist has no tracks.");
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
            name: `Round ${cats.length + 1}`,
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
      alert("Could not import the playlist. Please try again.");
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
        alert("Room not found.");
        navigate("/dashboard");
        return;
      }

      // Only the host or a co-owner may edit this room
      if (!canEditRoom(room)) {
        alert("You don't have permission to edit this room.");
        navigate("/dashboard");
        return;
      }

      // Populate form with existing data
      setRoomName(room.roomName);
      setIsPublic(room.isPublic);
      setCategories(room.categories);
      setRoomHostId(room.hostId);

      // Co-owner management is host-only (rules also restrict join requests)
      if (auth.state.user?.uid === room.hostId) {
        setInviteToken(room.inviteToken ?? null);
        const editorIds = room.editorIds ?? [];
        setEditors(editorIds.length > 0 ? await getRoomEditors(roomId, editorIds) : []);
      }

      // Register existing category hues so new ones get distinct colors
      for (const cat of room.categories) {
        generateColorScheme(cat.id);
      }
    } catch (err) {
      console.error("Failed to load room for editing:", err);
      alert("Could not load the room. Please try again.");
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
    const allCategoriesHaveItems = categories().every((c) => c.items.length > 0);
    return hasRoomName && hasCategories && allCategoriesHaveItems;
  };

  // Add a new category
  const addCategory = () => {
    if (!canAddCategory()) return;

    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: "New category",
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
    setCategories(categories().map((c) => (c.id === categoryId ? { ...c, name } : c)));
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
      }),
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
              : item,
          ),
        };
      }),
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
      }),
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
      alert("Please enter a room name");
      return;
    }

    if (categories().length === 0) {
      alert("Add at least one category");
      return;
    }

    const hasEmptyCategories = categories().some((c) => c.items.length === 0);
    if (hasEmptyCategories) {
      alert("Every category needs at least one song");
      return;
    }

    // Check for empty song URLs and warn user (one-time confirmation)
    const emptyCount = countEmptySongUrls();
    if (emptyCount > 0) {
      const confirmed = confirm(
        `You have ${emptyCount} song${emptyCount > 1 ? "s" : ""} without a URL. Continue without adding URLs?`,
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
          hostName: auth.djName() || auth.state.user?.displayName || "Anonymous",
          categories: categories(),
          isPublic: isPublic(),
        });
      } else {
        // Create mode — create new room
        await createRoomInFirestore({
          roomName: name,
          hostName: auth.djName() || auth.state.user?.displayName || "Anonymous",
          categories: categories(),
          isPublic: isPublic(),
          isActive: true,
          createdAt: Date.now(),
        });
      }
      navigate("/dashboard");
    } catch (error) {
      console.error(`Failed to ${isEditMode() ? "update" : "create"} room:`, error);
      alert(
        isEditMode()
          ? "Could not update the room. Please try again."
          : "Could not create the room. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Show
      when={!isLoadingRoom()}
      fallback={
        <div class="bg-stage flex min-h-screen items-center justify-center">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-line border-t-beat" />
        </div>
      }
    >
      <div class="bg-stage min-h-screen p-6">
        <div class="mx-auto max-w-7xl">
          {/* Header */}
          <div class="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              class="flex items-center gap-2 text-muted transition hover:text-beat"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span class="font-medium">Back</span>
            </button>

            <div class="flex items-center gap-3">
              {/* Public toggle with lock icons */}
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic())}
                class={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  isPublic()
                    ? "border-beat/30 bg-beat-soft text-beat-deep"
                    : "border-line bg-sand text-muted"
                }`}
              >
                <Show
                  when={isPublic()}
                  fallback={
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  }
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                    />
                  </svg>
                </Show>
                {isPublic() ? "Public room" : "Private room"}
              </button>

              {/* Submit button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting() || !canCreateRoom()}
                class="rounded-full bg-beat px-6 py-2 font-bold text-white shadow-[0_10px_24px_-10px_rgba(232,38,74,0.55)] transition hover:bg-beat-deep disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting()
                  ? isEditMode()
                    ? "Saving…"
                    : "Creating…"
                  : isEditMode()
                    ? "Save changes"
                    : "Create room"}
              </button>
            </div>
          </div>

          {/* Room name input */}
          <div class="mb-8">
            <input
              type="text"
              value={roomName()}
              onInput={(e) => setRoomName(e.currentTarget.value)}
              placeholder="Enter a room name…"
              class="font-display w-full max-w-md border-b-2 border-line bg-transparent pb-2 text-3xl font-bold text-ink placeholder-muted/50 outline-none focus:border-beat"
            />
            <p class="mt-2 text-muted">
              Click + to add categories and songs
              <Show when={categories().length > 0}>
                <span class="ml-2 font-mono text-sm text-muted/70">
                  ({categories().length}/{MAX_CATEGORIES} categories)
                </span>
              </Show>
            </p>
          </div>

          {/* Co-owners (medeiere) — host only, edit mode */}
          <Show when={isEditMode() && isHost()}>
            <div class="mb-8 max-w-md rounded-2xl border border-line bg-paper p-4 shadow-sm">
              <h3 class="font-display mb-1 font-bold text-ink">Co-owners</h3>
              <p class="mb-3 text-sm text-muted">
                Co-owners can edit the room, but not delete it or change the co-owner list.
              </p>

              {/* Existing co-owners */}
              <Show
                when={editors().length > 0}
                fallback={<p class="mb-3 text-sm text-muted/70">No co-owners yet.</p>}
              >
                <ul class="mb-3 space-y-1">
                  <For each={editors()}>
                    {(editor) => (
                      <li class="flex items-center justify-between rounded-xl bg-cream px-3 py-2 text-sm">
                        <span class="min-w-0 truncate text-ink">
                          {editor.displayName || editor.email || editor.uid}
                        </span>
                        <button
                          type="button"
                          disabled={editorBusy()}
                          onClick={() => handleRemoveEditor(editor.uid)}
                          class="ml-3 shrink-0 text-muted transition hover:text-beat disabled:opacity-50"
                          title="Remove co-owner"
                        >
                          ✕
                        </button>
                      </li>
                    )}
                  </For>
                </ul>
              </Show>

              {/* Invite link */}
              <Show
                when={inviteLink()}
                fallback={
                  <button
                    type="button"
                    disabled={editorBusy()}
                    onClick={handleGenerateInvite}
                    class="rounded-full bg-beat px-4 py-2 text-sm font-bold text-white transition hover:bg-beat-deep disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Create invite link
                  </button>
                }
              >
                <div class="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteLink() ?? ""}
                    onFocus={(e) => e.currentTarget.select()}
                    class="min-w-0 flex-1 rounded-xl border border-line bg-cream px-3 py-2 font-mono text-sm text-ink outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyInvite}
                    class="shrink-0 rounded-full bg-beat px-4 py-2 text-sm font-bold text-white transition hover:bg-beat-deep"
                  >
                    {inviteCopied() ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div class="mt-2 flex gap-4 text-sm">
                  <button
                    type="button"
                    disabled={editorBusy()}
                    onClick={handleGenerateInvite}
                    class="text-muted transition hover:text-ink disabled:opacity-50"
                  >
                    Create new link
                  </button>
                  <button
                    type="button"
                    disabled={editorBusy()}
                    onClick={handleRevokeInvite}
                    class="text-muted transition hover:text-beat disabled:opacity-50"
                  >
                    Disable link
                  </button>
                </div>
                <p class="mt-2 text-xs text-muted/70">
                  Anyone with the link can become a co-owner. Create a new link to invalidate shared
                  ones.
                </p>
              </Show>

              <Show when={editorError()}>
                <p class="mt-2 text-sm text-beat-deep">{editorError()}</p>
              </Show>
            </div>
          </Show>

          {/* Spotify playlist import */}
          <Show when={isSpotifyLoggedIn() && !isEditMode()}>
            <div class="mb-6">
              <Show
                when={!showPlaylistPicker()}
                fallback={
                  <div class="rounded-2xl border border-line bg-paper p-4 shadow-sm">
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
                      class="mb-3 w-full rounded-xl border border-line bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-beat"
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
                                  : "hover:bg-cream"
                              }`}
                              onClick={() => handlePlaylistSelect(playlist)}
                            >
                              <div class="h-10 w-10 shrink-0 overflow-hidden rounded bg-sand">
                                <Show when={playlist.images?.[0]?.url}>
                                  <img
                                    src={playlist.images[0].url}
                                    alt=""
                                    class="h-full w-full object-cover"
                                  />
                                </Show>
                              </div>
                              <div class="min-w-0 flex-1">
                                <p class="truncate text-sm font-semibold text-ink">
                                  {playlist.name}
                                </p>
                                <p class="text-xs text-muted">
                                  {playlist.items?.total ?? "?"} tracks
                                </p>
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
                  <svg class="h-5 w-5 text-spotify" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                  </svg>
                  Import from Spotify
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
              <AddCategoryButton onClick={addCategory} disabled={!canAddCategory()} />
            )}
          </div>

          {/* Help text */}
          <Show when={categories().length === 0}>
            <div class="mt-12 text-center">
              <p class="text-lg text-muted">Click "Add category" to start building your board</p>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
};

export default CreateRoom;
