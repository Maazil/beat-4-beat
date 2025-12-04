import { Component, Show } from "solid-js";
import type { SongItem } from "../../../model/songItem";
import type { CategoryColorScheme } from "./categoryColors";

interface SongItemCardProps {
  item: SongItem;
  colorScheme: CategoryColorScheme;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (songUrl: string) => void;
  onBlur: () => void;
  onRemove: () => void;
}

const SongItemCard: Component<SongItemCardProps> = (props) => {
  return (
    <div
      class="group relative flex h-16 w-full items-center justify-center rounded-lg border-2 transition-colors sm:h-20"
      style={{
        "background-color": props.colorScheme.itemBg,
        "border-color": props.colorScheme.border,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = props.colorScheme.itemBgHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = props.colorScheme.itemBg;
      }}
    >
      <Show
        when={props.isEditing}
        fallback={
          <button
            type="button"
            class="flex h-full w-full items-center justify-center"
            onClick={() => props.onEdit()}
          >
            <span
              class="text-2xl font-bold"
              style={{ color: props.colorScheme.textDark }}
            >
              {props.item.level}
            </span>
          </button>
        }
      >
        <input
          type="text"
          value={props.item.songUrl || ""}
          onInput={(e) => props.onUpdate(e.currentTarget.value)}
          onBlur={() => props.onBlur()}
          onKeyPress={(e) => e.key === "Enter" && props.onBlur()}
          placeholder="Lim inn URL..."
          class="w-full bg-transparent px-2 text-center text-sm outline-none"
          autofocus
        />
      </Show>

      {/* Song URL indicator */}
      <Show when={props.item.songUrl && !props.isEditing}>
        <div class="absolute right-1 bottom-1">
          <svg
            class="h-4 w-4 text-green-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </div>
      </Show>

      {/* Delete item button */}
      <button
        type="button"
        onClick={() => props.onRemove()}
        class="absolute -top-2 -right-2 hidden h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition group-hover:flex hover:bg-red-600"
      >
        <svg
          class="h-3 w-3"
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
  );
};

export default SongItemCard;
