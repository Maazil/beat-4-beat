import { createEffect, createSignal, onCleanup } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import type { Room } from "../model/room";
import { getRoomOnce } from "../services/roomQuery";
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
  // Store + reconcile so each snapshot only notifies the changed subtree
  // (usually gameState) instead of replacing the whole Room — unchanged
  // categories and tiles keep their DOM nodes.
  const [state, setState] = createStore<{ room: Room | null }>({ room: null });
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  createEffect(() => {
    const roomId = getRoomId();

    // Reset state when roomId changes
    setState("room", null);
    setIsLoading(true);
    setError(null);

    if (!roomId) {
      setIsLoading(false);
      setError("No room ID provided");
      return;
    }

    let hasSnapshot = false;
    let disposed = false;
    onCleanup(() => {
      disposed = true;
    });

    // Warm start: render the route preload's cached copy (if any) while
    // the live subscription makes its first round trip.
    getRoomOnce(roomId)
      .then((roomData) => {
        if (disposed || hasSnapshot || !roomData) return;
        setState("room", reconcile(roomData));
        setIsLoading(false);
      })
      .catch(() => {
        // the subscription owns error reporting
      });

    try {
      const unsubscribe = subscribeToRoom(roomId, (roomData) => {
        hasSnapshot = true;
        setState("room", reconcile(roomData));
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

  return { room: () => state.room, isLoading, error };
}
