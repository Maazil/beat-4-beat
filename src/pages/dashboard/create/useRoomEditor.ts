import { createSignal } from "solid-js";
import { createStore, produce } from "solid-js/store";
import type { Category } from "../../../model/category";
import type { SongItem } from "../../../model/songItem";
import { MAX_CATEGORIES } from "./categoryColors";

/**
 * Draft state for the room builder (create + edit). Categories live in a
 * store so every edit is a fine-grained path update — typing in one card
 * never rebuilds the rest of the board.
 */
export function useRoomEditor() {
  const [roomName, setRoomName] = createSignal("");
  const [isPublic, setIsPublic] = createSignal(false);
  const [state, setState] = createStore<{ categories: Category[] }>({ categories: [] });
  const [editingCategory, setEditingCategory] = createSignal<string | null>(null);
  const [editingItem, setEditingItem] = createSignal<string | null>(null);

  const categories = () => state.categories;

  /** Replace the whole board (edit-mode load, playlist import). */
  const replaceCategories = (categories: Category[]) => setState("categories", categories);

  // Check if we've reached the maximum categories
  const canAddCategory = () => state.categories.length < MAX_CATEGORIES;

  // Check if room creation requirements are met
  const canCreateRoom = () =>
    roomName().trim().length > 0 &&
    state.categories.length > 0 &&
    state.categories.every((c) => c.items.length > 0);

  // Add a new category
  const addCategory = () => {
    if (!canAddCategory()) return;

    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: "New category",
      items: [
        {
          id: `item-${Date.now()}`,
          level: 1,
          isRevealed: false,
          songUrl: "",
        },
      ],
    };
    setState("categories", state.categories.length, newCategory);
    setEditingCategory(newCategory.id);
  };

  // Update category name
  const updateCategoryName = (categoryId: string, name: string) => {
    setState("categories", (c) => c.id === categoryId, "name", name);
  };

  // Set or clear a category's header image, plus the preset hue that drives its
  // color scheme (presets pass an inkIndex; custom uploads / removal pass none,
  // reverting to the auto-assigned color). Setting undefined deletes the key
  // from the store object — Firestore rejects undefined field values.
  const updateCategoryImage = (categoryId: string, imageUrl?: string, inkIndex?: number) => {
    setState("categories", (c) => c.id === categoryId, "imageUrl", imageUrl);
    setState("categories", (c) => c.id === categoryId, "inkIndex", inkIndex);
  };

  // Remove a category
  const removeCategory = (categoryId: string) => {
    setState("categories", (categories) => categories.filter((c) => c.id !== categoryId));
  };

  // Add item to a category
  const addItem = (categoryId: string) => {
    const newItemId = `item-${Date.now()}`;
    setState(
      "categories",
      (c) => c.id === categoryId,
      produce((category) => {
        const newItem: SongItem = {
          id: newItemId,
          level: category.items.length + 1,
          isRevealed: false,
          songUrl: "",
        };
        category.items.push(newItem);
      }),
    );
    setEditingItem(newItemId);
  };

  // Update item song URL and optional metadata (title, artist, cue point,
  // track length, album art). Undefined values leave the existing one untouched
  // — except that repointing the URL clears the old track's length and album
  // art (a manually pasted URL carries neither), so stale metadata can't linger.
  const updateItem = (
    categoryId: string,
    itemId: string,
    songUrl: string,
    title?: string,
    artist?: string,
    startTime?: number,
    durationMs?: number,
    imageUrl?: string,
  ) => {
    setState(
      "categories",
      (c) => c.id === categoryId,
      "items",
      (item) => item.id === itemId,
      produce((item) => {
        const urlChanged = songUrl !== item.songUrl;
        item.songUrl = songUrl;
        if (title !== undefined) item.title = title;
        if (artist !== undefined) item.artist = artist;
        if (startTime !== undefined) item.startTime = startTime;
        if (durationMs !== undefined) item.durationMs = durationMs;
        else if (urlChanged) delete item.durationMs;
        if (imageUrl !== undefined) item.imageUrl = imageUrl;
        else if (urlChanged) delete item.imageUrl;
      }),
    );
  };

  // Remove item from category and re-number levels
  const removeItem = (categoryId: string, itemId: string) => {
    setState(
      "categories",
      (c) => c.id === categoryId,
      "items",
      (items) =>
        items
          .filter((item) => item.id !== itemId)
          .map((item, index) => ({ ...item, level: index + 1 })),
    );
  };

  // Count empty song URLs for warning
  const countEmptySongUrls = () => {
    let count = 0;
    for (const category of state.categories) {
      for (const item of category.items) {
        if (!item.songUrl?.trim()) {
          count++;
        }
      }
    }
    return count;
  };

  return {
    roomName,
    setRoomName,
    isPublic,
    setIsPublic,
    categories,
    replaceCategories,
    editingCategory,
    setEditingCategory,
    editingItem,
    setEditingItem,
    canAddCategory,
    canCreateRoom,
    addCategory,
    updateCategoryName,
    updateCategoryImage,
    removeCategory,
    addItem,
    updateItem,
    removeItem,
    countEmptySongUrls,
  };
}
