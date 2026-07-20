// @vitest-environment jsdom
import { createRoot, createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Room } from "../model/room";

// Capture the snapshot callback and the unsubscribe spy so tests can drive
// the "subscription" by hand instead of touching Firestore.
let snapshotCb: ((room: Room | null) => void) | undefined;
const unsubscribe = vi.fn();
const subscribeToRoom = vi.fn((_id: string, cb: (room: Room | null) => void) => {
  snapshotCb = cb;
  return unsubscribe;
});

vi.mock("../services/roomsService", () => ({
  subscribeToRoom: (id: string, cb: (room: Room | null) => void) => subscribeToRoom(id, cb),
}));

// Warm-start read resolves to nothing so the live subscription owns state.
vi.mock("../services/roomQuery", () => ({
  getRoomOnce: () => Promise.resolve(null),
}));

import { useRoom } from "./useRoom";

const room = (over: Partial<Room> = {}): Room => ({
  id: "r1",
  roomName: "Room",
  hostId: "h",
  hostName: "Host",
  categories: [],
  isActive: false,
  isPublic: true,
  createdAt: 0,
  ...over,
});

// Let queued createEffect runs flush.
const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  snapshotCb = undefined;
  subscribeToRoom.mockClear();
  unsubscribe.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useRoom", () => {
  test("errors and does not subscribe when no room id is given", async () => {
    await createRoot(async (dispose) => {
      const { room, isLoading, error } = useRoom(() => undefined);
      await tick();
      expect(room()).toBeNull();
      expect(isLoading()).toBe(false);
      expect(error()).toBe("No room ID provided");
      expect(subscribeToRoom).not.toHaveBeenCalled();
      dispose();
    });
  });

  test("delivers a snapshot and clears loading/error", async () => {
    await createRoot(async (dispose) => {
      const { room: getRoom, isLoading, error } = useRoom(() => "r1");
      await tick();
      expect(subscribeToRoom).toHaveBeenCalledWith("r1", expect.any(Function));
      expect(isLoading()).toBe(true);

      snapshotCb?.(room({ id: "r1", roomName: "Bangers" }));
      expect(getRoom()?.roomName).toBe("Bangers");
      expect(isLoading()).toBe(false);
      expect(error()).toBeNull();
      dispose();
    });
  });

  test("reports 'Room not found' on a null snapshot", async () => {
    await createRoot(async (dispose) => {
      const { room: getRoom, error } = useRoom(() => "missing");
      await tick();
      snapshotCb?.(null);
      expect(getRoom()).toBeNull();
      expect(error()).toBe("Room not found");
      dispose();
    });
  });

  test("resubscribes when the room id changes", async () => {
    await createRoot(async (dispose) => {
      const [id, setId] = createSignal("r1");
      useRoom(id);
      await tick();
      expect(subscribeToRoom).toHaveBeenCalledTimes(1);

      setId("r2");
      await tick();
      expect(unsubscribe).toHaveBeenCalledTimes(1);
      expect(subscribeToRoom).toHaveBeenCalledTimes(2);
      expect(subscribeToRoom).toHaveBeenLastCalledWith("r2", expect.any(Function));
      dispose();
    });
  });

  test("unsubscribes when the owner is disposed", async () => {
    await createRoot(async (dispose) => {
      useRoom(() => "r1");
      await tick();
      expect(subscribeToRoom).toHaveBeenCalledTimes(1);
      dispose();
      expect(unsubscribe).toHaveBeenCalledTimes(1);
    });
  });
});
