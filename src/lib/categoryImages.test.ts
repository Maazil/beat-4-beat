import { describe, expect, test } from "vitest";
import type { Category } from "../model/category";
import { mergeCategoryImages, splitCategoryImages } from "./categoryImages";

const category = (id: string, imageUrl?: string): Category => ({
  id,
  name: `Category ${id}`,
  items: [{ id: `${id}-item`, level: 1, isRevealed: false }],
  ...(imageUrl ? { imageUrl } : {}),
});

describe("splitCategoryImages", () => {
  test("moves images into the map and off the categories", () => {
    const { categories, images } = splitCategoryImages([
      category("a", "data:image/webp;base64,AAA"),
      category("b"),
      category("c", "data:image/webp;base64,CCC"),
    ]);

    expect(images).toEqual({
      a: "data:image/webp;base64,AAA",
      c: "data:image/webp;base64,CCC",
    });
    expect(categories.map((c) => c.id)).toEqual(["a", "b", "c"]);
    expect(categories.every((c) => !("imageUrl" in c))).toBe(true);
  });

  test("deletes the key rather than leaving undefined behind", () => {
    // Firestore rejects undefined field values, so the key has to be gone.
    const { categories } = splitCategoryImages([category("a", "data:image/webp;base64,AAA")]);
    expect(Object.keys(categories[0])).not.toContain("imageUrl");
  });

  test("keeps everything else on the category", () => {
    const source: Category = { ...category("a", "data:x"), inkIndex: 3 };
    const { categories } = splitCategoryImages([source]);
    expect(categories[0]).toEqual({
      id: "a",
      name: "Category a",
      inkIndex: 3,
      items: source.items,
    });
  });

  test("returns an empty map for a board with no images", () => {
    const source = [category("a"), category("b")];
    const { categories, images } = splitCategoryImages(source);
    expect(images).toEqual({});
    // Untouched categories keep their identity.
    expect(categories[0]).toBe(source[0]);
  });
});

describe("mergeCategoryImages", () => {
  test("applies images by category id", () => {
    const merged = mergeCategoryImages([category("a"), category("b")], { a: "data:x" });
    expect(merged[0].imageUrl).toBe("data:x");
    expect(merged[1].imageUrl).toBeUndefined();
  });

  test("leaves an inline image in place when the map has nothing — the un-split room case", () => {
    const merged = mergeCategoryImages([category("a", "data:inline")], { b: "data:other" });
    expect(merged[0].imageUrl).toBe("data:inline");
  });

  test("the map wins over an inline leftover", () => {
    const merged = mergeCategoryImages([category("a", "data:inline")], { a: "data:fresh" });
    expect(merged[0].imageUrl).toBe("data:fresh");
  });

  test("returns the same array when there's nothing to apply", () => {
    const source = [category("a")];
    expect(mergeCategoryImages(source, {})).toBe(source);
    expect(mergeCategoryImages(source, null)).toBe(source);
    expect(mergeCategoryImages(source, undefined)).toBe(source);
  });

  test("round-trips a split board", () => {
    const source = [category("a", "data:aaa"), category("b"), category("c", "data:ccc")];
    const { categories, images } = splitCategoryImages(source);
    expect(mergeCategoryImages(categories, images)).toEqual(source);
  });
});
