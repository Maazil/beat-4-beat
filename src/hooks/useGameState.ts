import { createSignal } from "solid-js";
import { unwrap } from "solid-js/store";
import { useAuth } from "../context/AuthContext";
import { defaultGameState, type GameState } from "../model/gameState";
import type { Room } from "../model/room";
import { migrateScore } from "../model/score";
import { updateRoomGameState } from "../services/roomsService";

export interface UseGameStateResult {
  game: () => GameState;
  updateGame: (updates: Partial<GameState>) => void;
  /** True when game state is shared via the room document (host or co-owner). */
  isShared: () => boolean;
}

const storageKey = (roomId: string) => `b4b:game:${roomId}`;

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

  // Local (non-shared) games, cached per room and bumped via a version
  // signal so reads stay reactive without re-parsing localStorage.
  const localCache = new Map<string, GameState>();
  const [localVersion, setLocalVersion] = createSignal(0);

  const loadLocal = (roomId: string): GameState => {
    try {
      const raw = localStorage.getItem(storageKey(roomId));
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<GameState>;
        return {
          ...defaultGameState(),
          ...parsed,
          // Normalize any past score shape to the current { rounds } model
          ...(parsed.scores
            ? { scores: (parsed.scores as unknown as Record<string, unknown>[]).map(migrateScore) }
            : {}),
        };
      }
    } catch (err) {
      console.error("[useGameState] Failed to load saved game:", err);
    }
    return defaultGameState();
  };

  const localGame = (roomId: string): GameState => {
    localVersion();
    let cached = localCache.get(roomId);
    if (!cached) {
      cached = loadLocal(roomId);
      localCache.set(roomId, cached);
    }
    return cached;
  };

  const isShared = () => {
    const room = getRoom();
    const uid = authState.user?.uid;
    return !!room && !!uid && (room.hostId === uid || (room.editorIds?.includes(uid) ?? false));
  };

  const game = (): GameState => {
    if (isShared()) return getRoom()?.gameState ?? defaultGameState();
    const roomId = getRoomId();
    return roomId ? localGame(roomId) : defaultGameState();
  };

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

    const next = { ...game(), ...updates };
    localCache.set(roomId, next);
    try {
      localStorage.setItem(storageKey(roomId), JSON.stringify(next));
    } catch (err) {
      console.error("[useGameState] Failed to persist game locally:", err);
    }
    setLocalVersion((v) => v + 1);
  };

  return { game, updateGame, isShared };
}
