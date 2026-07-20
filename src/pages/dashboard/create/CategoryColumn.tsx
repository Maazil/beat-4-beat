import { Component, createSignal, For, Show } from "solid-js";
import Input from "../../../components/forms/Input";
import { fileToCategoryImage } from "../../../lib/categoryImage";
import type { Category } from "../../../model/category";
import AddItemButton from "./AddItemButton";
import type { CategoryColorScheme } from "./categoryColors";
import SongItemCard from "./SongItemCard";

interface CategoryColumnProps {
  category: Category;
  colorScheme: CategoryColorScheme;
  isEditingName: boolean;
  editingItemId: string | null;
  maxItems?: number; // Max items allowed (5 for create, 10 for db)
  onEditName: () => void;
  onUpdateName: (name: string) => void;
  onUpdateImage: (imageUrl?: string) => void;
  onBlurName: () => void;
  onRemove: () => void;
  onAddItem: () => void;
  onEditItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, songUrl: string, title?: string, artist?: string) => void;
  onBlurItem: () => void;
  onRemoveItem: (itemId: string) => void;
}

const CategoryColumn: Component<CategoryColumnProps> = (props) => {
  // Local draft of the name, committed on blur. Seeded once per category
  // identity — the <For> row (and this component) is recreated when the
  // category object changes, so no prop-mirroring effect is needed.
  const [localName, setLocalName] = createSignal(props.category.name);

  const handleBlur = () => {
    props.onUpdateName(localName());
    props.onBlurName();
  };

  let fileInput: HTMLInputElement | undefined;

  const handleImageChange = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    try {
      props.onUpdateImage(await fileToCategoryImage(file));
    } catch (err) {
      console.error("[CategoryColumn] Image processing failed:", err);
      alert("Couldn't use that image — try a different file.");
    }
  };

  // Calculate dynamic width based on text length (min 8rem, max 14rem)
  const dynamicWidth = () => {
    const textLength = localName().length;
    const minRem = 8;
    const maxRem = 14;
    // Roughly 0.6rem per character for the font size used
    const calculatedRem = Math.max(minRem, textLength * 0.65 + 2);
    return `${Math.min(calculatedRem, maxRem)}rem`;
  };

  return (
    <div
      class="flex shrink-0 grow-0 flex-col gap-4"
      style={{
        width: dynamicWidth(),
        "min-width": "8rem",
        "max-width": "14rem",
      }}
    >
      {/* Category header — name input, or the uploaded image in its place */}
      <div
        class="group relative min-h-13 rounded-lg text-center"
        style={{ background: props.colorScheme.titleBg }}
      >
        <Show
          when={props.category.imageUrl}
          fallback={
            <div class="px-4 py-3">
              <Input
                type="text"
                variant="ghost"
                value={localName()}
                placeholder="Name"
                maxLength={22}
                onInput={(e) => setLocalName(e.currentTarget.value)}
                onBlur={handleBlur}
                onKeyPress={(e) => e.key === "Enter" && e.currentTarget.blur()}
                class="text-center text-lg font-semibold tracking-tight text-night caret-night"
              />
            </div>
          }
        >
          <img
            src={props.category.imageUrl}
            alt={localName()}
            title="Replace image"
            onClick={() => fileInput?.click()}
            class="h-20 w-full cursor-pointer rounded-lg object-cover"
          />
          <button
            type="button"
            onClick={() => props.onUpdateImage(undefined)}
            class="absolute bottom-1.5 left-1/2 block -translate-x-1/2 rounded-full bg-ink/80 px-2.5 py-0.5 text-[10px] font-bold text-night transition hover:bg-beat md:hidden md:group-hover:block md:group-focus-within:block"
          >
            Remove image
          </button>
        </Show>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          class="hidden"
          onChange={handleImageChange}
        />

        {/* Add image button — only when the header is still text */}
        <Show when={!props.category.imageUrl}>
          <button
            type="button"
            title="Use an image instead of text"
            onClick={() => fileInput?.click()}
            class="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-night transition hover:bg-beat md:hidden md:group-hover:flex md:group-focus-within:flex"
          >
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>
        </Show>

        {/* Delete category button */}
        <button
          type="button"
          onClick={() => props.onRemove()}
          class="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-night transition hover:bg-beat md:hidden md:group-hover:flex md:group-focus-within:flex"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Items */}
      <div class="flex flex-col gap-3">
        <For each={props.category.items}>
          {(item) => (
            <SongItemCard
              item={item}
              colorScheme={props.colorScheme}
              isEditing={props.editingItemId === item.id}
              onEdit={() => props.onEditItem(item.id)}
              onUpdate={(songUrl, title, artist) =>
                props.onUpdateItem(item.id, songUrl, title, artist)
              }
              onBlur={() => props.onBlurItem()}
              onRemove={() => props.onRemoveItem(item.id)}
            />
          )}
        </For>

        {/* Add item button - only show if under limit */}
        <Show when={props.category.items.length < (props.maxItems ?? 5)}>
          <AddItemButton colorScheme={props.colorScheme} onClick={() => props.onAddItem()} />
        </Show>
      </div>
    </div>
  );
};

export default CategoryColumn;
