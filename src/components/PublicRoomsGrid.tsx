import { Component, createMemo, For, Index, Show } from "solid-js";
import type { Room } from "../model/room";
import { usePublicRooms } from "../hooks/usePublicRooms";
import Button from "./forms/Button";
import RoomCardSkeleton from "./RoomCardSkeleton";
import RoomPreview from "./RoomPreview";

/** Shared by the skeleton and the real grid, so the two can't drift apart. */
const GRID_CLASS = "grid gap-5 lg:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]";

/** Roughly two rows on a desktop grid — enough to read as "rooms are coming". */
const SKELETON_CARDS = Array.from({ length: 6 });

interface PublicRoomsGridProps {
  /** Optional client-side filter applied to the loaded rooms (e.g. marketplace search). */
  filter?: (rooms: Room[]) => Room[];
  /** Empty-state label shown when the filter removes every loaded room. */
  emptyFilteredLabel?: string;
}

/**
 * The public-rooms listing shared by /rooms and /market — owns the
 * loading, empty, and error states plus the load-more pagination.
 * An optional `filter` narrows the loaded rooms client-side.
 */
const PublicRoomsGrid: Component<PublicRoomsGridProps> = (props) => {
  const { rooms, isLoading, isLoadingMore, hasMore, loadMore, error } = usePublicRooms();

  const visibleRooms = createMemo(() => (props.filter ? props.filter(rooms()) : rooms()));

  return (
    <>
      <Show when={error()}>
        <div class="mb-4 rounded-xl border border-magenta-hot/40 bg-magenta-hot/10 p-4 text-magenta-hot">
          {error()}
        </div>
      </Show>

      <Show when={isLoading()}>
        <div class={GRID_CLASS} role="status" aria-label="Loading public rooms">
          <Index each={SKELETON_CARDS}>{() => <RoomCardSkeleton />}</Index>
        </div>
      </Show>

      <Show when={!isLoading() && rooms().length === 0}>
        <div class="rounded-2xl border border-dashed border-line bg-night/50 p-8 text-center">
          <p class="text-muted">No public rooms available yet.</p>
        </div>
      </Show>

      <Show when={!isLoading() && rooms().length > 0 && visibleRooms().length === 0}>
        <div class="rounded-2xl border border-dashed border-line bg-night/50 p-8 text-center">
          <p class="text-muted">{props.emptyFilteredLabel ?? "No rooms match your search."}</p>
        </div>
      </Show>

      <Show when={!isLoading() && visibleRooms().length > 0}>
        <div class={GRID_CLASS}>
          <For each={visibleRooms()}>{(room) => <RoomPreview room={room} />}</For>
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
