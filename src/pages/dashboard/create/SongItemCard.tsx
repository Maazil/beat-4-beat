import { Component, createEffect, createSignal, Show } from "solid-js";
import type { SongItem } from "../../../model/songItem";
import type { CategoryColorScheme } from "./categoryColors";
import SongItemEditModal from "./SongItemEditModal";

interface SongItemCardProps {
  item: SongItem;
  colorScheme: CategoryColorScheme;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (
    songUrl: string,
    title?: string,
    artist?: string,
    startTime?: number,
    durationMs?: number,
    imageUrl?: string,
  ) => void;
  onBlur: () => void;
  onRemove: () => void;
}

const SongItemCard: Component<SongItemCardProps> = (props) => {
  const [originRect, setOriginRect] = createSignal<DOMRect | null>(null);
  let cardRef: HTMLDivElement | undefined;

  // Capture card position when entering edit mode — the modal's FLIP animation
  // expands out of / collapses back into this tile.
  createEffect(() => {
    if (props.isEditing && cardRef) {
      setOriginRect(cardRef.getBoundingClientRect());
    }
  });

  return (
    <div class="group relative flex w-full flex-col">
      {/* In-place card — always visible */}
      <div
        ref={cardRef}
        class="stage-card flex h-16 w-full items-center justify-center rounded-lg sm:h-20"
        style={{
          "--stage-ink": props.colorScheme.border,
          "--stage-tint": props.colorScheme.itemBg,
          "--stage-tint-hover": props.colorScheme.itemBgHover,
          opacity: props.isEditing ? 0.5 : 1,
        }}
      >
        <button
          type="button"
          class="flex h-full w-full flex-col items-center justify-center"
          onClick={() => !props.isEditing && props.onEdit()}
        >
          <span class="font-mono text-2xl font-bold" style={{ color: "var(--color-ink)" }}>
            {props.item.level}
          </span>
          <Show when={props.item.title && !props.isEditing}>
            <span
              class="max-w-full truncate px-1 text-[10px] leading-tight opacity-70"
              style={{ color: "var(--color-ink)" }}
            >
              {props.item.title}
            </span>
          </Show>
          <Show when={props.item.title && props.item.artist && !props.isEditing}>
            <span
              class="max-w-full truncate px-1 text-[9px] leading-tight opacity-60"
              style={{ color: "var(--color-ink)" }}
            >
              {props.item.artist}
            </span>
          </Show>
        </button>

        {/* Song URL indicator */}
        <Show when={props.item.songUrl && !props.isEditing}>
          <div class="absolute right-1 bottom-1">
            <svg class="h-4 w-4 text-spotify" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>
        </Show>

        {/* Delete item button */}
        <Show when={!props.isEditing}>
          <button
            type="button"
            onClick={() => props.onRemove()}
            class="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-night transition hover:bg-beat md:hidden md:group-hover:flex md:group-focus-within:flex"
          >
            <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </Show>
      </div>

      <SongItemEditModal
        item={props.item}
        colorScheme={props.colorScheme}
        isEditing={props.isEditing}
        enterRect={originRect}
        exitRect={() => cardRef?.getBoundingClientRect() ?? originRect()}
        onUpdate={props.onUpdate}
        onBlur={props.onBlur}
      />
    </div>
  );
};

export default SongItemCard;
