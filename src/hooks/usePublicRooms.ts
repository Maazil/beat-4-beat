import { createSignal, onMount } from "solid-js";
import type { Room } from "../model/room";
import { getPublicRoomsPage, type PublicRoomsPage } from "../services/roomsService";

export interface UsePublicRoomsResult {
  rooms: () => Room[];
  isLoading: () => boolean;
  isLoadingMore: () => boolean;
  hasMore: () => boolean;
  loadMore: () => Promise<void>;
  error: () => string | null;
}

/**
 * Custom primitive for the public-rooms list views. Loads rooms one
 * bounded page at a time (newest first) via one-shot reads — the grids
 * don't need a live listener — and exposes loadMore for pagination.
 *
 * @returns Object with rooms array, loading/pagination state, and error accessors
 *
 * @example
 * const { rooms, isLoading, hasMore, loadMore, error } = usePublicRooms();
 */
export function usePublicRooms(): UsePublicRoomsResult {
  const [rooms, setRooms] = createSignal<Room[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [isLoadingMore, setIsLoadingMore] = createSignal(false);
  const [hasMore, setHasMore] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  let cursor: PublicRoomsPage["cursor"] = null;

  const loadPage = async () => {
    const page = await getPublicRoomsPage(cursor);
    cursor = page.cursor;
    setRooms([...rooms(), ...page.rooms]);
    setHasMore(page.hasMore);
    setError(null);
  };

  onMount(async () => {
    try {
      await loadPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rooms");
    } finally {
      setIsLoading(false);
    }
  });

  const loadMore = async () => {
    if (isLoadingMore() || isLoading() || !hasMore()) return;

    setIsLoadingMore(true);
    try {
      await loadPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more rooms");
    } finally {
      setIsLoadingMore(false);
    }
  };

  return { rooms, isLoading, isLoadingMore, hasMore, loadMore, error };
}
