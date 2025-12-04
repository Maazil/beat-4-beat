import { useNavigate } from "@solidjs/router";
import { Component, createSignal, For, onMount, Show } from "solid-js";
import { useAuth } from "../../../context/AuthContext";
import type { Category } from "../../../model/category";
import type { SongItem } from "../../../model/songItem";
import { createRoom as createRoomInFirestore } from "../../../services/roomsService";
import AddCategoryButton from "./AddCategoryButton";
import {
  generateColorScheme,
  MAX_CATEGORIES,
  resetHueAssignments,
} from "./categoryColors";
import CategoryColumn from "./CategoryColumn";

const CreateRoom: Component = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [roomName, setRoomName] = createSignal("");
  const [isPublic, setIsPublic] = createSignal(false);
  const [categories, setCategories] = createSignal<Category[]>([]);
  const [editingCategory, setEditingCategory] = createSignal<string | null>(
    null
  );
  const [editingItem, setEditingItem] = createSignal<string | null>(null);
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  // Reset hue assignments when component mounts (fresh room creation)
  onMount(() => {
    resetHueAssignments();
  });

  // Check if we've reached the maximum categories
  const canAddCategory = () => categories().length < MAX_CATEGORIES;

  // Add a new category
  const addCategory = () => {
    if (!canAddCategory()) return;

    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: "Ny kategori",
      items: [],
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
    setCategories(
      categories().map((c) => {
        if (c.id !== categoryId) return c;
        const newItem: SongItem = {
          id: `item-${Date.now()}`,
          level: c.items.length + 1,
          isRevealed: false,
          songUrl: "",
        };
        return { ...c, items: [...c.items, newItem] };
      })
    );
  };

  // Update item song URL
  const updateItemUrl = (
    categoryId: string,
    itemId: string,
    songUrl: string
  ) => {
    setCategories(
      categories().map((c) => {
        if (c.id !== categoryId) return c;
        return {
          ...c,
          items: c.items.map((item) =>
            item.id === itemId ? { ...item, songUrl } : item
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

  // Submit the room
  const handleCreateRoom = async () => {
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

    setIsSubmitting(true);

    try {
      await createRoomInFirestore({
        roomName: name,
        hostName: auth.state.user?.displayName || "Anonym",
        categories: categories(),
        isPublic: isPublic(),
        createdAt: Date.now(),
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to create room:", error);
      alert("Kunne ikke opprette rom. Prøv igjen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
              class={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
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

            {/* Create button */}
            <button
              type="button"
              onClick={handleCreateRoom}
              disabled={isSubmitting()}
              class="rounded-lg bg-neutral-900 px-6 py-2 font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50"
            >
              {isSubmitting() ? "Oppretter..." : "Opprett rom"}
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
                  isEditingName={editingCategory() === category.id}
                  editingItemId={editingItem()}
                  onEditName={() => setEditingCategory(category.id)}
                  onUpdateName={(name) => updateCategoryName(category.id, name)}
                  onBlurName={() => setEditingCategory(null)}
                  onRemove={() => removeCategory(category.id)}
                  onAddItem={() => addItem(category.id)}
                  onEditItem={(itemId) => setEditingItem(itemId)}
                  onUpdateItem={(itemId, songUrl) =>
                    updateItemUrl(category.id, itemId, songUrl)
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
  );
};

export default CreateRoom;
