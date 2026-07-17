import { Component, For, Show } from "solid-js";
import { usePublicRooms } from "../hooks/usePublicRooms";
import Button from "./forms/Button";
import RoomPreview from "./RoomPreview";

/**
 * The public-rooms listing shared by /rooms and /market — owns the
 * loading, empty, and error states plus the load-more pagination.
 */
const PublicRoomsGrid: Component = () => {
  const { rooms, isLoading, isLoadingMore, hasMore, loadMore, error } = usePublicRooms();

  return (
    <>
      <Show when={error()}>
        <div class="mb-4 rounded-xl border border-magenta-hot/40 bg-magenta-hot/10 p-4 text-magenta-hot">
          {error()}
        </div>
      </Show>

      <Show when={isLoading()}>
        <div class="flex items-center justify-center py-12">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-line border-t-beat" />
        </div>
      </Show>

      <Show when={!isLoading() && rooms().length === 0}>
        <div class="rounded-2xl border border-dashed border-line bg-night/50 p-8 text-center">
          <p class="text-muted">No public rooms available yet.</p>
        </div>
      </Show>

      <Show when={!isLoading() && rooms().length > 0}>
        <div class="grid gap-5 lg:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
          <For each={rooms()}>{(room) => <RoomPreview room={room} />}</For>
        </div>

        <Show when={hasMore()}>
          <div class="mt-8 flex justify-center">
            <Button variant="secondary" disabled={isLoadingMore()} onClick={() => void loadMore()}>
              {isLoadingMore() ? "Loading…" : "Load more rooms"}
            </Button>
          </div>
        </Show>
      </Show>
    </>
  );
};

export default PublicRoomsGrid;
