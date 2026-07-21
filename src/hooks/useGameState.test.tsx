// @vitest-environment jsdom
import { createRoot } from "solid-js";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

// Node's experimental localStorage global shadows jsdom's, so provide a
// simple in-memory implementation for the fallback-path tests.
const memoryStorage = (): Storage => {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, String(v)),
  };
};
import { defaultGameState, type GameState } from "../model/gameState";
import type { Room } from "../model/room";

// Controllable fake auth — tests set `currentUid` to switch identities.
let currentUid: string | undefined;
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    state: {
      get user() {
        return currentUid ? { uid: currentUid } : null;
      },
      isLoading: false,
    },
  }),
}));

const updateRoomGameState = vi.fn((_id: string, _gs: Partial<GameState>) => Promise.resolve());
vi.mock("../services/roomsService", () => ({
  updateRoomGameState: (id: string, gs: Partial<GameState>) => updateRoomGameState(id, gs),
}));

import { useGameState } from "./useGameState";

const room = (over: Partial<Room> = {}): Room => ({
  id: "r1",
  roomName: "Room",
  hostId: "host-uid",
  hostName: "Host",
  categories: [],
  isActive: true,
  isPublic: true,
  createdAt: 0,
  ...over,
});

const gs = (over: Partial<GameState> = {}): GameState => ({ ...defaultGameState(), ...over });

beforeEach(() => {
  currentUid = undefined;
  updateRoomGameState.mockClear();
  vi.stubGlobal("localStorage", memoryStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useGameState — shared (host / co-owner)", () => {
  test("isShared is true for the host and reads gameState from the room", () => {
    createRoot((dispose) => {
      currentUid = "host-uid";
      const r = room({ gameState: gs({ currentItemId: "song-1" }) });
      const { game, isShared } = useGameState(
        () => r.id,
        () => r,
      );
      expect(isShared()).toBe(true);
      expect(game().currentItemId).toBe("song-1");
      dispose();
    });
  });

  test("isShared is true for a co-owner editor", () => {
    createRoot((dispose) => {
      currentUid = "editor-uid";
      const r = room({ editorIds: ["editor-uid"] });
      const { isShared } = useGameState(
        () => r.id,
        () => r,
      );
      expect(isShared()).toBe(true);
      dispose();
    });
  });

  test("updateGame writes only the changed fields once gameState exists", () => {
    createRoot((dispose) => {
      currentUid = "host-uid";
      const r = room({ gameState: gs({ playOrder: ["a"] }) });
      const { updateGame } = useGameState(
        () => r.id,
        () => r,
      );
      updateGame({ currentItemId: "b" });
      expect(updateRoomGameState).toHaveBeenCalledWith("r1", { currentItemId: "b" });
      dispose();
    });
  });

  test("updateGame seeds the full state on the first write", () => {
    createRoot((dispose) => {
      currentUid = "host-uid";
      const r = room({ gameState: undefined });
      const { updateGame } = useGameState(
        () => r.id,
        () => r,
      );
      updateGame({ currentItemId: "b" });
      expect(updateRoomGameState).toHaveBeenCalledWith("r1", {
        playOrder: [],
        currentItemId: "b",
        scores: [],
        revealTrackInfo: false,
      });
      dispose();
    });
  });
});

describe("useGameState — local fallback (non-editor)", () => {
  test("isShared is false and updates persist to localStorage, not Firestore", () => {
    createRoot((dispose) => {
      currentUid = "someone-else";
      const r = room();
      const { game, updateGame, isShared } = useGameState(
        () => r.id,
        () => r,
      );
      expect(isShared()).toBe(false);

      updateGame({ currentItemId: "local-song" });
      expect(updateRoomGameState).not.toHaveBeenCalled();
      expect(game().currentItemId).toBe("local-song");

      const saved = JSON.parse(localStorage.getItem("b4b:game:r1") ?? "{}");
      expect(saved.currentItemId).toBe("local-song");
      dispose();
    });
  });

  test("loads a previously saved local game", () => {
    createRoot((dispose) => {
      currentUid = undefined; // signed out
      localStorage.setItem("b4b:game:r1", JSON.stringify({ playOrder: ["x", "y"] }));
      const r = room();
      const { game } = useGameState(
        () => r.id,
        () => r,
      );
      expect(game().playOrder).toEqual(["x", "y"]);
      dispose();
    });
  });
});
