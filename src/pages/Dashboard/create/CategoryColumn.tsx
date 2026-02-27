import { Component, createEffect, createSignal, For, Show } from "solid-js";
import Input from "../../../components/forms/Input";
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
  onBlurName: () => void;
  onRemove: () => void;
  onAddItem: () => void;
  onEditItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, songUrl: string, title?: string, artist?: string) => void;
  onBlurItem: () => void;
  onRemoveItem: (itemId: string) => void;
}

const CategoryColumn: Component<CategoryColumnProps> = (props) => {
  // Local state for editing to avoid re-renders on every keystroke
  const [localName, setLocalName] = createSignal("");

  // Sync local state when category name changes (including initial value)
  createEffect(() => {
    setLocalName(props.category.name);
  });

  const handleBlur = () => {
    props.onUpdateName(localName());
    props.onBlurName();
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
      {/* Category header - always show input in edit mode */}
      <div
        class="group relative min-h-13 rounded-lg border px-4 py-3 text-center shadow-sm"
        style={{
          background: `linear-gradient(to right, ${props.colorScheme.titleBg}, ${props.colorScheme.titleBgHover})`,
          "border-color": props.colorScheme.border,
        }}
      >
        <Input
          type="text"
          variant="ghost"
          value={localName()}
          placeholder="Navn"
          maxLength={22}
          onInput={(e) => setLocalName(e.currentTarget.value)}
          onBlur={handleBlur}
          onKeyPress={(e) => e.key === "Enter" && e.currentTarget.blur()}
          class="text-center text-lg font-semibold tracking-tight text-white caret-white"
        />

        {/* Delete category button */}
        <button
          type="button"
          onClick={() => props.onRemove()}
          class="absolute -top-2 -right-2 hidden h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition group-hover:flex hover:bg-red-600"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
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
              onUpdate={(songUrl, title, artist) => props.onUpdateItem(item.id, songUrl, title, artist)}
              onBlur={() => props.onBlurItem()}
              onRemove={() => props.onRemoveItem(item.id)}
            />
          )}
        </For>

        {/* Add item button - only show if under limit */}
        <Show when={props.category.items.length < (props.maxItems ?? 5)}>
          <AddItemButton
            colorScheme={props.colorScheme}
            onClick={() => props.onAddItem()}
          />
        </Show>
      </div>
    </div>
  );
};

export default CategoryColumn;
