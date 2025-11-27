import { Component, For, Show } from "solid-js";
import RoomPreview from "../../components/RoomPreview";
import { usePublicRooms } from "../../hooks/usePublicRooms";

const Market: Component = () => {
  const { rooms, isLoading, error } = usePublicRooms();

  return (
    <div class="mx-auto max-w-6xl p-6 py-12">
      <div class="mb-8">
        <h1 class="text-3xl font-semibold text-neutral-100">Market</h1>
        <p class="mt-2 text-neutral-400">Browse and join available rooms</p>
      </div>

      <Show when={error()}>
        <div class="mb-4 rounded-lg border border-red-400/50 bg-red-900/20 p-4 text-red-300">
          {error()}
        </div>
      </Show>

      <Show when={isLoading()}>
        <div class="flex items-center justify-center py-12">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-neutral-600 border-t-neutral-300" />
        </div>
      </Show>

      <Show when={!isLoading() && rooms().length === 0}>
        <div class="rounded-lg border border-dashed border-neutral-600 bg-neutral-800/50 p-8 text-center">
          <p class="text-neutral-400">No public rooms available yet.</p>
        </div>
      </Show>

      <Show when={!isLoading() && rooms().length > 0}>
        <div class="grid gap-6 lg:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
          <For each={rooms()}>{(room) => <RoomPreview room={room} />}</For>
        </div>
      </Show>
    </div>
  );
};

export default Market;
