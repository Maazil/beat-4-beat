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
        class="mb-6 flex items-center gap-2 text-muted transition hover:cursor-pointer hover:text-beat"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        <span class="font-medium">Back to dashboard</span>
      </button>

      <h1 class="font-display mb-8 text-3xl font-bold tracking-tight text-ink">All rooms</h1>

      <Show when={error()}>
        <div class="mb-4 rounded-xl border border-beat/30 bg-beat-soft p-4 text-beat-deep">
          {error()}
        </div>
      </Show>

      <Show
        when={!isLoading()}
        fallback={
          <div class="flex items-center justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-line border-t-beat" />
          </div>
        }
      >
        <div class="grid gap-5 lg:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
          <For
            each={rooms()}
            fallback={
              <p class="col-span-full text-center text-muted">No public rooms available yet.</p>
            }
          >
            {(room) => (
              <article
                class="group cursor-pointer rounded-2xl border border-line bg-paper p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-beat/40 hover:shadow-md"
                onClick={() => navigate(`/rooms/${room.id}`)}
              >
                <div class="mb-3 flex items-start justify-between gap-3">
                  <h2 class="font-display text-lg font-bold text-ink transition group-hover:text-beat">
                    {room.roomName}
                  </h2>
                  <span
                    class={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      room.isActive
                        ? "border border-beat/20 bg-beat-soft text-beat-deep"
                        : "border border-line bg-sand text-muted"
                    }`}
                  >
                    {room.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div class="space-y-1 font-mono text-xs text-muted">
                  {room.categories.length > 0 && (
                    <p>
                      <span class="font-semibold text-ink">Categories:</span>{" "}
                      {room.categories.length}
                    </p>
                  )}

                  {room.createdAt && (
                    <p>
                      <span class="font-semibold text-ink">Created:</span>{" "}
                      {new Date(room.createdAt).toLocaleString("en-GB", {
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
