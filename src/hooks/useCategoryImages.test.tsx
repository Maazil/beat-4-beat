// @vitest-environment jsdom
import { createRoot, createSignal } from "solid-js";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { CategoryImageMap } from "../lib/categoryImages";

// Hand-driven stand-in for the cached one-shot read.
let resolveImages: ((map: CategoryImageMap) => void) | undefined;
let rejectImages: ((err: Error) => void) | undefined;
const getCategoryImagesOnce = vi.fn(
  (_roomId: string) =>
    new Promise<CategoryImageMap>((resolve, reject) => {
      resolveImages = resolve;
      rejectImages = reject;
    }),
);

vi.mock("../services/roomQuery", () => ({
  getCategoryImagesOnce: (roomId: string) => getCategoryImagesOnce(roomId),
}));

import { useCategoryImages } from "./useCategoryImages";

/** Let the pending promise's .then/.catch land. */
const tick = () => new Promise((r) => setTimeout(r, 0));

afterEach(() => {
  vi.clearAllMocks();
});

describe("useCategoryImages", () => {
  test("clears loading without reading when there's no room id", async () => {
    await createRoot(async (dispose) => {
      const { images, isLoading } = useCategoryImages(() => undefined);
      await tick();
      expect(isLoading()).toBe(false);
      expect(images()).toEqual({});
      expect(getCategoryImagesOnce).not.toHaveBeenCalled();
      dispose();
    });
  });

  test("delivers the image map and clears loading", async () => {
    await createRoot(async (dispose) => {
      const { images, isLoading } = useCategoryImages(() => "r1");
      await tick();
      expect(getCategoryImagesOnce).toHaveBeenCalledWith("r1");
      expect(isLoading()).toBe(true);

      resolveImages?.({ "cat-1": "data:image/webp;base64,AAA" });
      await tick();
      expect(images()).toEqual({ "cat-1": "data:image/webp;base64,AAA" });
      expect(isLoading()).toBe(false);
      dispose();
    });
  });

  test("a failed read still clears loading, so the board isn't blocked", async () => {
    await createRoot(async (dispose) => {
      const { images, isLoading } = useCategoryImages(() => "r1");
      await tick();

      rejectImages?.(new Error("permission-denied"));
      await tick();
      expect(isLoading()).toBe(false);
      // No images means every header falls back to its category name.
      expect(images()).toEqual({});
      dispose();
    });
  });

  test("re-reads and resets when the room id changes", async () => {
    await createRoot(async (dispose) => {
      const [roomId, setRoomId] = createSignal("r1");
      const { images, isLoading } = useCategoryImages(roomId);
      await tick();
      resolveImages?.({ "cat-1": "data:one" });
      await tick();
      expect(images()).toEqual({ "cat-1": "data:one" });

      setRoomId("r2");
      await tick();
      expect(getCategoryImagesOnce).toHaveBeenLastCalledWith("r2");
      // The previous room's images must not linger while r2 loads.
      expect(images()).toEqual({});
      expect(isLoading()).toBe(true);

      resolveImages?.({ "cat-9": "data:two" });
      await tick();
      expect(images()).toEqual({ "cat-9": "data:two" });
      dispose();
    });
  });

  test("a stale read that lands after a room change is dropped", async () => {
    await createRoot(async (dispose) => {
      const [roomId, setRoomId] = createSignal("r1");
      const { images } = useCategoryImages(roomId);
      await tick();
      const staleResolve = resolveImages;

      setRoomId("r2");
      await tick();
      staleResolve?.({ "cat-1": "data:stale" });
      await tick();
      expect(images()).toEqual({});
      dispose();
    });
  });
});
