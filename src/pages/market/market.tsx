import { useNavigate } from "@solidjs/router";
import { Component, For, Show } from "solid-js";
import RoomPreview from "../../components/RoomPreview";
import { usePublicRooms } from "../../hooks/usePublicRooms";

const Market: Component = () => {
  const { rooms, isLoading: roomsLoading, error: roomsError } = usePublicRooms();
  const navigate = useNavigate();

  return (
    <div class="mx-auto w-full max-w-6xl px-6 py-12">
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        class="mb-6 flex items-center gap-2 text-muted transition hover:text-beat"
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

      <div class="mb-10">
        <h1 class="font-display text-3xl font-bold tracking-tight text-ink">Marketplace</h1>
        <p class="mt-2 text-muted">Pick a community room and start playing instantly.</p>
      </div>

      <Show when={roomsError()}>
        <div class="mb-4 rounded-xl border border-magenta-hot/40 bg-magenta-hot/10 p-4 text-magenta-hot">
          {roomsError()}
        </div>
      </Show>

      <Show when={roomsLoading()}>
        <div class="flex items-center justify-center py-12">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-line border-t-beat" />
        </div>
      </Show>

      <Show when={!roomsLoading() && rooms().length === 0}>
        <div class="rounded-2xl border border-dashed border-line bg-night/50 p-8 text-center">
          <p class="text-muted">No public rooms available yet.</p>
        </div>
      </Show>

      <Show when={!roomsLoading() && rooms().length > 0}>
        <div class="grid gap-5 lg:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
          <For each={rooms()}>{(room) => <RoomPreview room={room} />}</For>
        </div>
      </Show>
    </div>
  );
};

export default Market;
