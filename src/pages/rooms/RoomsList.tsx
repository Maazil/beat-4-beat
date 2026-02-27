import { useNavigate } from "@solidjs/router";
import { Component, For, Show } from "solid-js";
import { usePublicRooms } from "../../hooks/usePublicRooms";

const Rooms: Component = () => {
  const navigate = useNavigate();
  const { rooms, isLoading, error } = usePublicRooms();

  return (
    <div class="mx-auto w-full max-w-6xl px-6 py-12">
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        class="mb-6 flex items-center gap-2 text-neutral-600 transition hover:cursor-pointer hover:text-neutral-900"
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

      <h1 class="mb-8 text-3xl font-semibold text-neutral-900">Alle rom</h1>

      <Show when={error()}>
        <div class="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error()}
        </div>
      </Show>

      <Show
        when={!isLoading()}
        fallback={
          <div class="flex items-center justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-900" />
          </div>
        }
      >
        <div class="grid gap-6 lg:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
          <For
            each={rooms()}
            fallback={
              <p class="col-span-full text-center text-neutral-500">
                Ingen offentlige rom tilgjengelig ennå.
              </p>
            }
          >
            {(room) => (
              <article
                class="group cursor-pointer rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
                onClick={() => navigate(`/rooms/${room.id}`)}
              >
                <div class="mb-3 flex items-start justify-between">
                  <h2 class="text-lg font-semibold text-neutral-900 group-hover:text-neutral-700">
                    {room.roomName}
                  </h2>
                  <span
                    class={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      room.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {room.isActive ? "Aktiv" : "Inaktiv"}
                  </span>
                </div>
                <div class="space-y-2 text-sm text-neutral-500">
                  {room.categories.length > 0 && (
                    <p>
                      <span class="font-medium text-neutral-700">
                        Antall kategorier:
                      </span>{" "}
                      {room.categories.length}
                    </p>
                  )}

                  {room.createdAt && (
                    <p>
                      <span class="font-medium text-neutral-700">
                        Opprettet:
                      </span>{" "}
                      {new Date(room.createdAt).toLocaleString("no-NO", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  )}
                </div>
              </article>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

export default Rooms;
