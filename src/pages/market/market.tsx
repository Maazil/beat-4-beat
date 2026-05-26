import { useNavigate } from "@solidjs/router";
import { Component, For, Show } from "solid-js";
import RoomPreview from "../../components/RoomPreview";
import { usePublicRooms } from "../../hooks/usePublicRooms";

const Market: Component = () => {
  const { rooms, isLoading: roomsLoading, error: roomsError } = usePublicRooms();
  const navigate = useNavigate();

  return (
    <div class="mx-auto max-w-7xl p-6 py-12">
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        class="mb-6 flex items-center gap-2 text-neutral-400 transition hover:text-neutral-100"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        <span class="font-medium">Tilbake</span>
      </button>

      <div class="mb-8">
        <h1 class="text-3xl font-semibold text-neutral-100">Marketplace</h1>
        <p class="mt-2 text-neutral-400">Pick a playlist and start playing instantly</p>
      </div>

      {/* ── Community Rooms ──────────────────────────────────────── */}
      <div class="border-t border-neutral-700/60 pt-10">
        <h2 class="mb-6 text-2xl font-semibold text-neutral-100">Community Rooms</h2>

        <Show when={roomsError()}>
          <div class="mb-4 rounded-lg border border-red-400/50 bg-red-900/20 p-4 text-red-300">
            {roomsError()}
          </div>
        </Show>

        <Show when={roomsLoading()}>
          <div class="flex items-center justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-neutral-600 border-t-neutral-300" />
          </div>
        </Show>

        <Show when={!roomsLoading() && rooms().length === 0}>
          <div class="rounded-lg border border-dashed border-neutral-600 bg-neutral-800/50 p-8 text-center">
            <p class="text-neutral-400">No public rooms available yet.</p>
          </div>
        </Show>

        <Show when={!roomsLoading() && rooms().length > 0}>
          <div class="grid gap-6 lg:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
            <For each={rooms()}>{(room) => <RoomPreview room={room} />}</For>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default Market;
