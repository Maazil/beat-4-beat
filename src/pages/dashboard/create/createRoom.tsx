import { revalidate, useNavigate, useSearchParams } from "@solidjs/router";
import { Component, createSignal, For, onMount, Show } from "solid-js";
import { unwrap } from "solid-js/store";
import { useAuth } from "../../../context/AuthContext";
import { useConfirm } from "../../../context/ConfirmContext";
import { useToast } from "../../../context/ToastContext";
import type { Category } from "../../../model/category";
import { getRoomOnce } from "../../../services/roomQuery";
import {
  canEditRoom,
  createRoom as createRoomInFirestore,
  updateRoom as updateRoomInFirestore,
} from "../../../services/roomsService";
import Button from "../../../components/forms/Button";
import AddCategoryButton from "./AddCategoryButton";
import {
  generateColorScheme,
  MAX_CATEGORIES,
  MAX_ITEMS_CREATE,
  resetHueAssignments,
} from "./categoryColors";
import CategoryColumn from "./CategoryColumn";
import CoOwnerPanel from "./CoOwnerPanel";
import SpotifyImportPanel from "./SpotifyImportPanel";
import { useRoomEditor } from "./useRoomEditor";

const CreateRoom: Component = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const auth = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const editor = useRoomEditor();
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [isLoadingRoom, setIsLoadingRoom] = createSignal(false);

  // Co-owner management data — edit mode, host only
  const [roomHostId, setRoomHostId] = createSignal<string | null>(null);
  const [inviteToken, setInviteToken] = createSignal<string | null>(null);
  const [editorIds, setEditorIds] = createSignal<string[]>([]);

  const isHost = () => auth.isRoomHost(roomHostId() ?? undefined);

  const editRoomId = () => searchParams.edit as string | undefined;
  const isEditMode = () => !!editRoomId();

  // Load existing room data when in edit mode, or reset for creation
  onMount(async () => {
    resetHueAssignments();

    const roomId = editRoomId();
    if (!roomId) return;

    setIsLoadingRoom(true);
    try {
      // One-shot read (not a subscription) so in-progress edits are never
      // clobbered; goes through the shared query to warm from its cache.
      const room = await getRoomOnce(roomId);
      if (!room) {
        toast.error("Room not found.");
        navigate("/dashboard");
        return;
      }

      // Only the host or a co-owner may edit this room
      if (!canEditRoom(room)) {
        toast.error("You don't have permission to edit this room.");
        navigate("/dashboard");
        return;
      }

      // Populate form with existing data
      editor.setRoomName(room.roomName);
      editor.setIsPublic(room.isPublic);
      editor.replaceCategories(room.categories);
      setRoomHostId(room.hostId);

      // Co-owner management is host-only (rules also restrict join requests)
      if (auth.state.user?.uid === room.hostId) {
        setInviteToken(room.inviteToken ?? null);
        setEditorIds(room.editorIds ?? []);
      }

      // Register existing category hues so new ones get distinct colors.
      // Preset categories carry an inkIndex and don't consume a round-robin slot.
      for (const cat of room.categories) {
        generateColorScheme(cat.id, cat.inkIndex);
      }
    } catch (err) {
      console.error("Failed to load room for editing:", err);
      toast.error("Could not load the room. Please try again.");
      navigate("/dashboard");
    } finally {
      setIsLoadingRoom(false);
    }
  });

  // Replace the board with an imported playlist
  const handlePlaylistImport = (categories: Category[], playlistName: string) => {
    // Set room name from playlist if empty
    if (!editor.roomName().trim()) {
      editor.setRoomName(playlistName);
    }

    resetHueAssignments();
    editor.replaceCategories(categories);

    // Register hues for the new categories. Preset categories carry an
    // inkIndex and don't consume a round-robin slot.
    for (const cat of categories) {
      generateColorScheme(cat.id, cat.inkIndex);
    }
  };

  // Submit the room (handles both create and edit)
  const handleSubmit = async () => {
    const name = editor.roomName().trim();

    if (!name) {
      toast.error("Please enter a room name");
      return;
    }

    if (editor.categories().length === 0) {
      toast.error("Add at least one category");
      return;
    }

    const hasEmptyCategories = editor.categories().some((c) => c.items.length === 0);
    if (hasEmptyCategories) {
      toast.error("Every category needs at least one song");
      return;
    }

    // Check for empty song URLs and warn user (one-time confirmation)
    const emptyCount = editor.countEmptySongUrls();
    if (emptyCount > 0) {
      const confirmed = await confirm({
        title: "Missing song URLs",
        message: `You have ${emptyCount} song${emptyCount > 1 ? "s" : ""} without a URL. Continue without adding URLs?`,
        confirmLabel: "Continue",
      });
      if (!confirmed) {
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const roomId = editRoomId();
      // Firestore rejects store proxies — hand it the raw categories
      const categories = unwrap(editor.categories());
      if (roomId) {
        // Edit mode — update existing room
        await updateRoomInFirestore(roomId, {
          roomName: name,
          hostName: auth.djName() || auth.state.user?.displayName || "Anonymous",
          categories,
          isPublic: editor.isPublic(),
        });
        // Drop the shared query's now-stale copy of this room
        await revalidate(getRoomOnce.keyFor(roomId));
      } else {
        // Create mode — create new room
        await createRoomInFirestore({
          roomName: name,
          hostName: auth.djName() || auth.state.user?.displayName || "Anonymous",
          categories,
          isPublic: editor.isPublic(),
          isActive: true,
          createdAt: Date.now(),
        });
      }
      navigate("/dashboard");
    } catch (error) {
      console.error(`Failed to ${isEditMode() ? "update" : "create"} room:`, error);
      toast.error(
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
                onClick={() => editor.setIsPublic(!editor.isPublic())}
                class={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  editor.isPublic()
                    ? "border-beat/30 bg-beat-soft text-beat-bright"
                    : "border-line bg-surface-2 text-muted"
                }`}
              >
                <Show
                  when={editor.isPublic()}
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
                {editor.isPublic() ? "Public room" : "Private room"}
              </button>

              {/* Submit button */}
              <Button onClick={handleSubmit} disabled={isSubmitting() || !editor.canCreateRoom()}>
                {isSubmitting()
                  ? isEditMode()
                    ? "Saving…"
                    : "Creating…"
                  : isEditMode()
                    ? "Save changes"
                    : "Create room"}
              </Button>
            </div>
          </div>

          {/* Room name input */}
          <div class="mb-8">
            <input
              type="text"
              value={editor.roomName()}
              onInput={(e) => editor.setRoomName(e.currentTarget.value)}
              placeholder="Enter a room name…"
              class="font-display w-full max-w-md border-b-2 border-line bg-transparent pb-2 text-3xl font-bold text-ink placeholder-muted/50 outline-none focus:border-beat"
            />
            <p class="mt-2 text-muted">
              Click + to add categories and songs
              <Show when={editor.categories().length > 0}>
                <span class="ml-2 font-mono text-sm text-muted/70">
                  ({editor.categories().length}/{MAX_CATEGORIES} categories)
                </span>
              </Show>
            </p>
          </div>

          {/* Co-owners (medeiere) — host only, edit mode */}
          <Show when={isEditMode() && isHost()}>
            <CoOwnerPanel
              roomId={editRoomId()!}
              initialInviteToken={inviteToken()}
              editorIds={editorIds()}
            />
          </Show>

          {/* Spotify — connect to enable song search, plus playlist import in create mode */}
          <SpotifyImportPanel isEditMode={isEditMode()} onImport={handlePlaylistImport} />

          {/* Game board style grid - wraps to next row if needed */}
          <div class="flex flex-wrap gap-6 pt-4 pb-4">
            {/* Existing categories */}
            <For each={editor.categories()}>
              {(category) => {
                // Auto-assigned by ID for consistent, unique colors — unless the
                // category picked a preset, whose hue (inkIndex) then wins. Read
                // reactively so choosing a preset recolors the column live.
                const colorScheme = () => generateColorScheme(category.id, category.inkIndex);
                return (
                  <CategoryColumn
                    category={category}
                    colorScheme={colorScheme()}
                    maxItems={MAX_ITEMS_CREATE}
                    isEditingName={editor.editingCategory() === category.id}
                    editingItemId={editor.editingItem()}
                    onEditName={() => editor.setEditingCategory(category.id)}
                    onUpdateName={(name) => editor.updateCategoryName(category.id, name)}
                    onUpdateImage={(imageUrl, inkIndex) =>
                      editor.updateCategoryImage(category.id, imageUrl, inkIndex)
                    }
                    onBlurName={() => editor.setEditingCategory(null)}
                    onRemove={() => editor.removeCategory(category.id)}
                    onAddItem={() => editor.addItem(category.id)}
                    onEditItem={(itemId) => editor.setEditingItem(itemId)}
                    onUpdateItem={(
                      itemId,
                      songUrl,
                      title,
                      artist,
                      startTime,
                      durationMs,
                      imageUrl,
                    ) =>
                      editor.updateItem(
                        category.id,
                        itemId,
                        songUrl,
                        title,
                        artist,
                        startTime,
                        durationMs,
                        imageUrl,
                      )
                    }
                    onBlurItem={() => editor.setEditingItem(null)}
                    onRemoveItem={(itemId) => editor.removeItem(category.id, itemId)}
                  />
                );
              }}
            </For>

            {/* Add category button, only show if user can add more categories */}
            <Show when={editor.canAddCategory()}>
              <AddCategoryButton onClick={editor.addCategory} disabled={!editor.canAddCategory()} />
            </Show>
          </div>

          {/* Help text */}
          <Show when={editor.categories().length === 0}>
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
