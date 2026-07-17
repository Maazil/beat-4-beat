import { createEffect, createSignal, onCleanup } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
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
  // Store + reconcile (keyed by id) so a snapshot only updates the rooms
  // that changed — the other market cards keep their DOM nodes.
  const [state, setState] = createStore<{ rooms: Room[] }>({ rooms: [] });
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  createEffect(() => {
    try {
      const unsubscribe = subscribeToPublicRooms((roomsData) => {
        setState("rooms", reconcile(roomsData));
        setIsLoading(false);
        setError(null);
      });

      onCleanup(() => unsubscribe());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rooms");
      setIsLoading(false);
    }
  });

  return { rooms: () => state.rooms, isLoading, error };
}
