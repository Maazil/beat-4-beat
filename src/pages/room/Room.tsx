import { useNavigate, useParams } from "@solidjs/router";
import { Component, createMemo, createSignal, For, Show } from "solid-js";
import { useAuth } from "../../context/AuthContext";
import { rooms } from "../../store/roomsStore";

const categoryColors = [
  {
    titleBg: "bg-gradient-to-r from-blue-600 to-blue-700",
    itemBg: "bg-blue-500/10",
    border: "border-blue-200",
    titleText: "text-white",
    itemText: "text-blue-700",
    shadow: "shadow-sm",
  },
  {
    titleBg: "bg-gradient-to-r from-purple-600 to-purple-700",
    itemBg: "bg-purple-500/10",
    border: "border-purple-200",
    titleText: "text-white",
    itemText: "text-purple-700",
    shadow: "shadow-sm",
  },
  {
    titleBg: "bg-gradient-to-r from-green-600 to-green-700",
    itemBg: "bg-green-500/10",
    border: "border-green-200",
    titleText: "text-white",
    itemText: "text-green-700",
    shadow: "shadow-sm",
  },
  {
    titleBg: "bg-gradient-to-r from-orange-600 to-orange-700",
    itemBg: "bg-orange-500/10",
    border: "border-orange-200",
    titleText: "text-white",
    itemText: "text-orange-700",
    shadow: "shadow-sm",
  },
  {
    titleBg: "bg-gradient-to-r from-pink-600 to-pink-700",
    itemBg: "bg-pink-500/10",
    border: "border-pink-200",
    titleText: "text-white",
    itemText: "text-pink-700",
    shadow: "shadow-sm",
  },
  {
    titleBg: "bg-gradient-to-r from-teal-600 to-teal-700",
    itemBg: "bg-teal-500/10",
    border: "border-teal-200",
    titleText: "text-white",
    itemText: "text-teal-700",
    shadow: "shadow-sm",
  },
];

const Room: Component = () => {
  const params = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const currentRoom = createMemo(() => rooms.find((r) => r.id === params.id));
  const [revealedItems, setRevealedItems] = createSignal<Set<string>>(
    new Set()
  );

  // Redirect to login/guest if not authenticated
  const requireAuth = () => {
    if (!auth.isAuthenticated()) {
      navigate("/guest");
    }
  };

  const handleItemClick = (itemId: string, songUrl?: string) => {
    if (!auth.isAuthenticated()) {
      requireAuth();
      return;
    }
    setRevealedItems((prev) => new Set(prev).add(itemId));
    if (songUrl) {
      window.open(songUrl, "_blank");
    }
  };

  return (
    <div class="min-h-screen bg-[#f4f6f8]">
      <div class="p-6">
        <div class="mx-auto max-w-7xl">
          {/* Header with user info */}
          <div class="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/")}
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

            <div class="flex items-center gap-4">
              <Show when={auth.isGuest()}>
                <div class="flex items-center gap-2 rounded-full bg-neutral-200 px-3 py-1.5 text-sm">
                  <span class="text-neutral-600">
                    👤 {auth.state.user?.name}
                  </span>
                </div>
              </Show>
              <Show when={auth.isAuthenticated()}>
                <div class="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-sm">
                  <span class="text-blue-700">✓ {auth.state.user?.name}</span>
                </div>
              </Show>
            </div>
          </div>

          <div class="mb-8">
            <h1 class="text-3xl font-bold text-neutral-900">
              {currentRoom()?.name}
            </h1>
            <p class="mt-2 text-neutral-600">
              Klikk på en rute for å velge sang
            </p>
          </div>

          {/* Guest CTA Banner */}
          <Show when={auth.isGuest()}>
            <div class="mb-6 rounded-lg border border-blue-200 bg-linear-to-r from-blue-50 to-purple-50 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="mb-1 font-semibold text-neutral-900">
                    Vil du lage egne rom?
                  </h3>
                  <p class="text-sm text-neutral-600">
                    Registrer deg for å opprette og administrere dine egne Beat
                    4 Beat rom.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  class="rounded-lg bg-blue-600 px-4 py-2 font-medium whitespace-nowrap text-white transition hover:bg-blue-700"
                >
                  Registrer deg
                </button>
              </div>
            </div>
          </Show>

          <div class="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            <For each={currentRoom()?.categories}>
              {(category, index) => {
                const colorScheme =
                  categoryColors[index() % categoryColors.length];
                return (
                  <div class="flex flex-col gap-4">
                    <div
                      class={`rounded-lg ${colorScheme.titleBg} border ${colorScheme.border} px-4 py-3 text-center ${colorScheme.shadow}`}
                    >
                      <h2
                        class={`text-lg font-semibold ${colorScheme.titleText} tracking-tight`}
                      >
                        {category.name}
                      </h2>
                    </div>

                    <div class="flex flex-col gap-3">
                      <For each={category.items}>
                        {(item) => (
                          <button
                            type="button"
                            class={`group flex h-16 w-full cursor-pointer items-center justify-center rounded-lg border-2 transition hover:scale-105 hover:shadow-lg active:scale-95 sm:h-20 ${
                              revealedItems().has(item.id)
                                ? "border-dashed border-neutral-300 bg-neutral-100/50"
                                : `${colorScheme.border} ${colorScheme.itemBg}`
                            }`}
                            onClick={() =>
                              handleItemClick(item.id, item.songUrl)
                            }
                          >
                            <span
                              class={`text-2xl font-bold ${
                                revealedItems().has(item.id)
                                  ? "text-neutral-400"
                                  : colorScheme.itemText
                              } transition group-hover:scale-110`}
                            >
                              {item.level}
                            </span>
                          </button>
                        )}
                      </For>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
