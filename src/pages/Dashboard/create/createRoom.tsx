import { useNavigate } from "@solidjs/router";
import { Component, createSignal, For, Show } from "solid-js";
import { useAuth } from "../../../context/AuthContext";
import type { Category } from "../../../model/category";
import type { SongItem } from "../../../model/songItem";
import { createRoom as createRoomInFirestore } from "../../../services/roomsService";

const categoryColors = [
  {
    titleBg: "bg-gradient-to-r from-blue-600 to-blue-700",
    itemBg: "bg-blue-500/10",
    border: "border-blue-200",
    titleText: "text-white",
    itemText: "text-blue-700",
    hoverBg: "hover:bg-blue-500/20",
  },
  {
    titleBg: "bg-gradient-to-r from-purple-600 to-purple-700",
    itemBg: "bg-purple-500/10",
    border: "border-purple-200",
    titleText: "text-white",
    itemText: "text-purple-700",
    hoverBg: "hover:bg-purple-500/20",
  },
  {
    titleBg: "bg-gradient-to-r from-green-600 to-green-700",
    itemBg: "bg-green-500/10",
    border: "border-green-200",
    titleText: "text-white",
    itemText: "text-green-700",
    hoverBg: "hover:bg-green-500/20",
  },
  {
    titleBg: "bg-gradient-to-r from-orange-600 to-orange-700",
    itemBg: "bg-orange-500/10",
    border: "border-orange-200",
    titleText: "text-white",
    itemText: "text-orange-700",
    hoverBg: "hover:bg-orange-500/20",
  },
  {
    titleBg: "bg-gradient-to-r from-pink-600 to-pink-700",
    itemBg: "bg-pink-500/10",
    border: "border-pink-200",
    titleText: "text-white",
    itemText: "text-pink-700",
    hoverBg: "hover:bg-pink-500/20",
  },
  {
    titleBg: "bg-gradient-to-r from-teal-600 to-teal-700",
    itemBg: "bg-teal-500/10",
    border: "border-teal-200",
    titleText: "text-white",
    itemText: "text-teal-700",
    hoverBg: "hover:bg-teal-500/20",
  },
];

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

  // Add a new category
  const addCategory = () => {
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
            {/* Public toggle */}
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic())}
              class={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                isPublic()
                  ? "bg-green-100 text-green-700"
                  : "bg-neutral-200 text-neutral-600"
              }`}
            >
              <span
                class={`h-2 w-2 rounded-full ${isPublic() ? "bg-green-500" : "bg-neutral-400"}`}
              />
              {isPublic() ? "Offentlig" : "Privat"}
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
          </p>
        </div>

        {/* Game board style grid */}
        <div class="flex gap-8 overflow-x-auto pt-4 pb-4">
          {/* Existing categories */}
          <For each={categories()}>
            {(category, index) => {
              const colorScheme =
                categoryColors[index() % categoryColors.length];
              return (
                <div class="flex w-40 shrink-0 flex-col gap-4">
                  {/* Category header */}
                  <div
                    class={`group relative rounded-lg ${colorScheme.titleBg} border ${colorScheme.border} px-4 py-3 text-center shadow-sm`}
                  >
                    <Show
                      when={editingCategory() === category.id}
                      fallback={
                        <h2
                          class={`cursor-pointer text-lg font-semibold ${colorScheme.titleText} tracking-tight`}
                          onClick={() => setEditingCategory(category.id)}
                        >
                          {category.name}
                        </h2>
                      }
                    >
                      <input
                        type="text"
                        value={category.name}
                        onInput={(e) =>
                          updateCategoryName(category.id, e.currentTarget.value)
                        }
                        onBlur={() => setEditingCategory(null)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && setEditingCategory(null)
                        }
                        class="w-full bg-transparent text-center text-lg font-semibold text-white outline-none"
                        autofocus
                      />
                    </Show>

                    {/* Delete category button */}
                    <button
                      type="button"
                      onClick={() => removeCategory(category.id)}
                      class="absolute -top-2 -right-2 hidden h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition group-hover:flex hover:bg-red-600"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Items */}
                  <div class="flex flex-col gap-3">
                    <For each={category.items}>
                      {(item) => (
                        <div
                          class={`group relative flex h-16 w-full items-center justify-center rounded-lg border-2 ${colorScheme.border} ${colorScheme.itemBg} sm:h-20`}
                        >
                          <Show
                            when={editingItem() === item.id}
                            fallback={
                              <button
                                type="button"
                                class="flex h-full w-full items-center justify-center"
                                onClick={() => setEditingItem(item.id)}
                              >
                                <span
                                  class={`text-2xl font-bold ${colorScheme.itemText}`}
                                >
                                  {item.level}
                                </span>
                              </button>
                            }
                          >
                            <input
                              type="text"
                              value={item.songUrl || ""}
                              onInput={(e) =>
                                updateItemUrl(
                                  category.id,
                                  item.id,
                                  e.currentTarget.value
                                )
                              }
                              onBlur={() => setEditingItem(null)}
                              onKeyPress={(e) =>
                                e.key === "Enter" && setEditingItem(null)
                              }
                              placeholder="Lim inn URL..."
                              class="w-full bg-transparent px-2 text-center text-sm outline-none"
                              autofocus
                            />
                          </Show>

                          {/* Song URL indicator */}
                          <Show
                            when={item.songUrl && editingItem() !== item.id}
                          >
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
                            onClick={() => removeItem(category.id, item.id)}
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
                      )}
                    </For>

                    {/* Add item button */}
                    <button
                      type="button"
                      onClick={() => addItem(category.id)}
                      class={`flex h-16 w-full items-center justify-center rounded-lg border-2 border-dashed ${colorScheme.border} ${colorScheme.hoverBg} transition sm:h-20`}
                    >
                      <svg
                        class={`h-8 w-8 ${colorScheme.itemText} opacity-50`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            }}
          </For>

          {/* Add category button */}
          <button
            type="button"
            onClick={addCategory}
            class="flex h-48 w-40 flex-shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-100/50 text-neutral-500 transition hover:border-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <svg
              class="h-10 w-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span class="text-sm font-medium">Legg til kategori</span>
          </button>
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
