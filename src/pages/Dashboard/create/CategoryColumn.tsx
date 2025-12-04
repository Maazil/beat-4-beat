import { Component, For, Show } from "solid-js";
import type { Category } from "../../../model/category";
import AddItemButton from "./AddItemButton";
import type { CategoryColorScheme } from "./categoryColors";
import SongItemCard from "./SongItemCard";

interface CategoryColumnProps {
  category: Category;
  colorScheme: CategoryColorScheme;
  isEditingName: boolean;
  editingItemId: string | null;
  onEditName: () => void;
  onUpdateName: (name: string) => void;
  onBlurName: () => void;
  onRemove: () => void;
  onAddItem: () => void;
  onEditItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, songUrl: string) => void;
  onBlurItem: () => void;
  onRemoveItem: (itemId: string) => void;
}

const CategoryColumn: Component<CategoryColumnProps> = (props) => {
  return (
    <div class="flex w-40 shrink-0 flex-col gap-4">
      {/* Category header */}
      <div
        class="group relative rounded-lg border px-4 py-3 text-center shadow-sm"
        style={{
          background: `linear-gradient(to right, ${props.colorScheme.titleBg}, ${props.colorScheme.titleBgHover})`,
          "border-color": props.colorScheme.border,
        }}
      >
        <Show
          when={props.isEditingName}
          fallback={
            <h2
              class="cursor-pointer text-lg font-semibold tracking-tight text-white"
              onClick={props.onEditName}
            >
              {props.category.name}
            </h2>
          }
        >
          <input
            type="text"
            value={props.category.name}
            onInput={(e) => props.onUpdateName(e.currentTarget.value)}
            onBlur={() => props.onBlurName()}
            onKeyPress={(e) => e.key === "Enter" && props.onBlurName()}
            class="w-full bg-transparent text-center text-lg font-semibold text-white outline-none"
            autofocus
          />
        </Show>

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
              onUpdate={(songUrl) => props.onUpdateItem(item.id, songUrl)}
              onBlur={() => props.onBlurItem()}
              onRemove={() => props.onRemoveItem(item.id)}
            />
          )}
        </For>

        {/* Add item button */}
        <AddItemButton
          colorScheme={props.colorScheme}
          onClick={() => props.onAddItem()}
        />
      </div>
    </div>
  );
};

export default CategoryColumn;
