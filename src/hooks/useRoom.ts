import { createEffect, createSignal, onCleanup } from "solid-js";
import type { Room } from "../model/room";
import { subscribeToRoom } from "../services/roomsService";

export interface UseRoomResult {
  room: () => Room | null;
  isLoading: () => boolean;
  error: () => string | null;
}

/**
 * Custom primitive for subscribing to a single room from Firestore.
 * Handles loading state, error state, and cleanup automatically.
 *
 * @param getRoomId - Accessor function that returns the room ID (reactive)
 * @returns Object with room, isLoading, and error accessors
 *
 * @example
 * const params = useParams();
 * const { room, isLoading, error } = useRoom(() => params.id);
 */
export function useRoom(getRoomId: () => string | undefined): UseRoomResult {
  const [room, setRoom] = createSignal<Room | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  createEffect(() => {
    const roomId = getRoomId();

    // Reset state when roomId changes
    setRoom(null);
    setIsLoading(true);
    setError(null);

    if (!roomId) {
      setIsLoading(false);
      setError("No room ID provided");
      return;
    }

    try {
      const unsubscribe = subscribeToRoom(roomId, (roomData) => {
        setRoom(roomData);
        setIsLoading(false);
        if (!roomData) {
          setError("Room not found");
        } else {
          setError(null);
        }
      });

      onCleanup(() => unsubscribe());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load room");
      setIsLoading(false);
    }
  });

  return { room, isLoading, error };
}
