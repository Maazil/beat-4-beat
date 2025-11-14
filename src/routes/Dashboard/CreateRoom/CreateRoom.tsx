import { useNavigate } from "@solidjs/router";
import { Component, createSignal, For } from "solid-js";
import type { Category } from "../../../model/category";
import { addRoom, type RoomSnapshot } from "../../../store/roomsStore";

const CreateRoom: Component = () => {
  const navigate = useNavigate();
  const [roomName, setRoomName] = createSignal("");
  const [hostName, setHostName] = createSignal("");
  const [categories, setCategories] = createSignal<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = createSignal("");
  const [itemCounts, setItemCounts] = createSignal<Record<string, number>>({});

  const addCategory = () => {
    const categoryName = newCategoryName().trim();
    if (!categoryName) return;

    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: categoryName,
      items: [],
    };

    setCategories([...categories(), newCategory]);
    setItemCounts({ ...itemCounts(), [newCategory.id]: 3 });
    setNewCategoryName("");
  };

  const removeCategory = (categoryId: string) => {
    setCategories(categories().filter((c) => c.id !== categoryId));
    const newCounts = { ...itemCounts() };
    delete newCounts[categoryId];
    setItemCounts(newCounts);
  };

  const updateItemCount = (categoryId: string, count: number) => {
    setItemCounts({ ...itemCounts(), [categoryId]: Math.max(1, Math.min(10, count)) });
  };

  const createRoom = () => {
    const name = roomName().trim();
    const host = hostName().trim();

    if (!name || !host || categories().length === 0) {
      alert("Vennligst fyll ut alle felter og legg til minst én kategori");
      return;
    }

    const categoriesWithItems = categories().map((category) => {
      const count = itemCounts()[category.id] || 3;
      const items = Array.from({ length: count }, (_, i) => ({
        id: `item-${category.id}-${i + 1}`,
        level: i + 1,
        isRevealed: false,
        songUrl: undefined,
      }));

      return {
        ...category,
        items,
      };
    });

    const newRoom: RoomSnapshot = {
      id: `room-${Date.now()}`,
      name,
      hostId: `host-${Date.now()}`,
      hostName: host,
      categories: categoriesWithItems,
      isActive: true,
      isPublic: false,
      createdAt: Date.now(),
      status: "scheduled",
      participants: 0,
    };

    addRoom(newRoom);
    navigate("/dashboard/rooms");
  };

  return (
    <div class="mx-auto w-full max-w-4xl px-6 py-12">
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        class="mb-6 flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition"
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
        <span class="font-medium">Tilbake til Dashboard</span>
      </button>

      <h1 class="text-3xl font-bold text-neutral-900 mb-8">Opprett nytt rom</h1>

      <div class="space-y-6">
        {/* Room Name */}
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-2">
            Romnavn
          </label>
          <input
            type="text"
            value={roomName()}
            onInput={(e) => setRoomName(e.currentTarget.value)}
            placeholder="F.eks. Fredagskveld Beat Battle"
            class="w-full rounded-lg border border-neutral-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Host Name */}
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-2">
            Vertsnavn
          </label>
          <input
            type="text"
            value={hostName()}
            onInput={(e) => setHostName(e.currentTarget.value)}
            placeholder="F.eks. DJ Ola"
            class="w-full rounded-lg border border-neutral-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Categories */}
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-2">
            Kategorier
          </label>

          <div class="space-y-3 mb-4">
            <For each={categories()}>
              {(category) => (
                <div class="flex items-center gap-3 p-4 rounded-lg border border-neutral-200 bg-neutral-50">
                  <div class="flex-1">
                    <span class="font-medium text-neutral-900">{category.name}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <label class="text-sm text-neutral-600">Antall sanger:</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={itemCounts()[category.id] || 3}
                      onInput={(e) => updateItemCount(category.id, parseInt(e.currentTarget.value) || 3)}
                      class="w-16 rounded border border-neutral-300 px-2 py-1 text-center"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCategory(category.id)}
                    class="text-red-600 hover:text-red-700"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </For>
          </div>

          <div class="flex gap-2">
            <input
              type="text"
              value={newCategoryName()}
              onInput={(e) => setNewCategoryName(e.currentTarget.value)}
              onKeyPress={(e) => e.key === "Enter" && addCategory()}
              placeholder="F.eks. Pop Hits"
              class="flex-1 rounded-lg border border-neutral-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="button"
              onClick={addCategory}
              class="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
            >
              Legg til
            </button>
          </div>
        </div>

        {/* Create Button */}
        <div class="flex gap-3 pt-4">
          <button
            type="button"
            onClick={createRoom}
            class="flex-1 px-6 py-3 rounded-lg bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 transition shadow-sm"
          >
            Opprett rom
          </button>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            class="px-6 py-3 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition"
          >
            Avbryt
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;
