import { createEffect, createMemo, on } from "solid-js";
import { createStore, reconcile, unwrap } from "solid-js/store";
import { useAuth } from "../context/AuthContext";
import { defaultGameState, type GameState } from "../model/gameState";
import type { Room } from "../model/room";
import { updateRoomGameState } from "../services/roomsService";

export interface UseGameStateResult {
  game: () => GameState;
  updateGame: (updates: Partial<GameState>) => void;
  /** True when game state is shared via the room document (host or co-owner). */
  isShared: () => boolean;
}

const storageKey = (roomId: string) => `b4b:game:${roomId}`;

const loadLocal = (roomId: string): GameState => {
  try {
    const raw = localStorage.getItem(storageKey(roomId));
    if (raw) return { ...defaultGameState(), ...(JSON.parse(raw) as Partial<GameState>) };
  } catch (err) {
    console.error("[useGameState] Failed to load saved game:", err);
  }
  return defaultGameState();
};

/**
 * Game state for a play session. Hosts and co-owners read and write the
 * gameState field on the room document — real-time and refresh-safe.
 * Everyone else (e.g. playing a public room from the market) keeps a private
 * copy in localStorage so their board survives a refresh too, without
 * touching a room they can't write to.
 */
export function useGameState(
  getRoomId: () => string | undefined,
  getRoom: () => Room | null,
): UseGameStateResult {
  const { state: authState } = useAuth();

  // Local (non-shared) game — a store so updates merge field-by-field and
  // reads stay reactive without re-parsing localStorage. Seeded synchronously
  // for the initial room; a deferred effect reloads it if the room changes.
  const initialRoomId = getRoomId();
  const [local, setLocal] = createStore<GameState>(
    initialRoomId ? loadLocal(initialRoomId) : defaultGameState(),
  );
  let loadedRoomId = initialRoomId;

  createEffect(
    on(
      getRoomId,
      (roomId) => {
        if (!roomId || roomId === loadedRoomId) return;
        loadedRoomId = roomId;
        setLocal(reconcile(loadLocal(roomId)));
      },
      { defer: true },
    ),
  );

  const isShared = () => {
    const room = getRoom();
    const uid = authState.user?.uid;
    return !!room && !!uid && (room.hostId === uid || (room.editorIds?.includes(uid) ?? false));
  };

  const game = createMemo<GameState>(() => {
    if (isShared()) return getRoom()?.gameState ?? defaultGameState();
    return local;
  });

  const updateGame = (updates: Partial<GameState>) => {
    const room = getRoom();
    const roomId = room?.id ?? getRoomId();
    if (!roomId) return;

    if (isShared()) {
      // Send only the changed fields (field-path write) so a score award
      // can't clobber a concurrent tile click. The first write seeds the
      // full gameState map so reads never see missing fields. unwrap()
      // strips store proxies (values often come from the room store) before
      // handing the data to Firestore.
      // Firestore latency compensation echoes the write back through the
      // room subscription immediately, so the UI updates without waiting.
      const payload = room?.gameState ? { ...updates } : { ...game(), ...updates };
      updateRoomGameState(roomId, unwrap(payload)).catch((err) =>
        console.error("[useGameState] Failed to save game state:", err),
      );
      return;
    }

    // Keep the store aligned with the room being written to, then merge the
    // changed fields — the store's fine-grained updates drive reactivity.
    if (roomId !== loadedRoomId) {
      loadedRoomId = roomId;
      setLocal(reconcile(loadLocal(roomId)));
    }
    setLocal(updates);
    try {
      localStorage.setItem(storageKey(roomId), JSON.stringify(unwrap(local)));
    } catch (err) {
      console.error("[useGameState] Failed to persist game locally:", err);
    }
  };

  return { game, updateGame, isShared };
}
