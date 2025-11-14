import { useParams } from "@solidjs/router";
import { Component, For, Show, createMemo, createSignal } from "solid-js";
import { rooms } from "../../../../../store/roomsStore";

const categoryColors = [
  { bg: "bg-blue-500/10", border: "border-blue-500", text: "text-blue-700" },
  { bg: "bg-purple-500/10", border: "border-purple-500", text: "text-purple-700" },
  { bg: "bg-green-500/10", border: "border-green-500", text: "text-green-700" },
  { bg: "bg-orange-500/10", border: "border-orange-500", text: "text-orange-700" },
  { bg: "bg-pink-500/10", border: "border-pink-500", text: "text-pink-700" },
  { bg: "bg-teal-500/10", border: "border-teal-500", text: "text-teal-700" },
];

const Play: Component = () => {
  const params = useParams();
  const currentRoom = createMemo(() => rooms.find((r) => r.id === params.id));
  const [revealedItems, setRevealedItems] = createSignal<Set<string>>(new Set());

  const handleItemClick = (itemId: string, songUrl?: string) => {
    setRevealedItems((prev) => new Set(prev).add(itemId));
    if (songUrl) {
      window.open(songUrl, "_blank");
    }
  };

  return (
    <div class="min-h-screen bg-[#f4f6f8] px-6 py-12">
      <Show when={currentRoom()} keyed>
        {(room) => (
          <div class="mx-auto w-full max-w-7xl">
            <div class="mb-12 text-center">
              <h1 class="text-4xl font-bold text-neutral-900">{room.name}</h1>
              <p class="mt-2 text-sm text-neutral-500">
                Klikk på en boks for å spille sangen
              </p>
            </div>

            <div class="grid gap-8 lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2">
              <For each={room.categories}>
                {(category, index) => {
                  const colorScheme = categoryColors[index() % categoryColors.length];
                  return (
                    <div class="flex flex-col gap-4">
                      <div
                        class={`rounded-lg ${colorScheme.bg} border-2 ${colorScheme.border} p-4 text-center`}
                      >
                        <h2 class={`text-lg font-semibold ${colorScheme.text}`}>
                          {category.name}
                        </h2>
                      </div>

                      <div class="flex flex-col gap-3">
                        <For each={category.items}>
                          {(item) => (
                            <Show
                              when={!revealedItems().has(item.id)}
                              fallback={
                                <div class="aspect-square rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-100/50" />
                              }
                            >
                              <button
                                type="button"
                                class={`group aspect-square w-full rounded-lg border-2 ${colorScheme.border} ${colorScheme.bg} transition hover:scale-105 hover:shadow-lg active:scale-95`}
                                onClick={() =>
                                  handleItemClick(item.id, item.songUrl)
                                }
                              >
                                <span
                                  class={`text-3xl font-bold ${colorScheme.text} group-hover:scale-110 transition`}
                                >
                                  {item.level}
                                </span>
                              </button>
                            </Show>
                          )}
                        </For>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        )}
      </Show>
    </div>
  );
};

export default Play;
