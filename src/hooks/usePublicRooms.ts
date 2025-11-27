import { createEffect, createSignal, onCleanup } from "solid-js";
import type { Room } from "../model/room";
import { subscribeToPublicRooms } from "../services/roomsService";

export interface UsePublicRoomsResult {
  rooms: () => Room[];
  isLoading: () => boolean;
  error: () => string | null;
}

/**
 * Custom primitive for subscribing to public rooms from Firestore.
 * Handles loading state, error state, and cleanup automatically.
 *
 * @returns Object with rooms array, isLoading, and error accessors
 *
 * @example
 * const { rooms, isLoading, error } = usePublicRooms();
 */
export function usePublicRooms(): UsePublicRoomsResult {
  const [rooms, setRooms] = createSignal<Room[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  createEffect(() => {
    try {
      const unsubscribe = subscribeToPublicRooms((roomsData) => {
        setRooms(roomsData);
        setIsLoading(false);
        setError(null);
      });

      onCleanup(() => unsubscribe());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rooms");
      setIsLoading(false);
    }
  });

  return { rooms, isLoading, error };
}
