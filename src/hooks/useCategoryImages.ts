import { createEffect, createSignal, onCleanup } from "solid-js";
import type { CategoryImageMap } from "../lib/categoryImages";
import { getCategoryImagesOnce } from "../services/roomQuery";

export interface UseCategoryImagesResult {
  images: () => CategoryImageMap;
  isLoading: () => boolean;
}

/**
 * A room's category header images, which live in their own document rather
 * than on the room (see lib/categoryImages).
 *
 * A one-shot read, not a subscription: header images don't change mid-game,
 * and the route preload usually has it cached before the page mounts. Callers
 * fold `isLoading` into the gate they already have on the room, so the board
 * doesn't render a name and then swap it for an image a moment later.
 *
 * A failed read resolves to no images — every consumer falls back to the
 * category name, so a missing image doc must not block the board.
 *
 * @example
 * const { images } = useCategoryImages(() => params.id);
 * <GameBoard categoryImages={images()} … />
 */
export function useCategoryImages(getRoomId: () => string | undefined): UseCategoryImagesResult {
  const [images, setImages] = createSignal<CategoryImageMap>({});
  const [isLoading, setIsLoading] = createSignal(true);

  createEffect(() => {
    const roomId = getRoomId();

    setImages({});
    setIsLoading(true);

    if (!roomId) {
      setIsLoading(false);
      return;
    }

    let disposed = false;
    onCleanup(() => {
      disposed = true;
    });

    getCategoryImagesOnce(roomId)
      .then((map) => {
        if (disposed) return;
        setImages(map);
        setIsLoading(false);
      })
      .catch(() => {
        if (disposed) return;
        setIsLoading(false);
      });
  });

  return { images, isLoading };
}
