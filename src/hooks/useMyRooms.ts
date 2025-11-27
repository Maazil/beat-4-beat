import { createEffect, createSignal, onCleanup } from "solid-js";
import { useAuth } from "../context/AuthContext";
import type { Room } from "../model/room";
import { subscribeToMyRooms } from "../services/roomsService";

export interface UseMyRoomsResult {
  rooms: () => Room[];
  isLoading: () => boolean;
  error: () => string | null;
}

/**
 * Custom primitive for subscribing to the current user's rooms from Firestore.
 * Waits for auth to be ready before subscribing.
 * Handles loading state, error state, and cleanup automatically.
 *
 * @returns Object with rooms array, isLoading, and error accessors
 *
 * @example
 * const { rooms, isLoading, error } = useMyRooms();
 */
export function useMyRooms(): UseMyRoomsResult {
  const auth = useAuth();
  const [rooms, setRooms] = createSignal<Room[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  createEffect(() => {
    // Don't do anything while auth is still loading
    if (auth.state.isLoading) return;

    // If not authenticated, don't try to fetch
    if (!auth.isAuthenticated()) {
      setRooms([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      const unsubscribe = subscribeToMyRooms((roomsData) => {
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
