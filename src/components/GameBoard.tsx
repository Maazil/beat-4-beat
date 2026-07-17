import { Component, For, Show } from "solid-js";
import type { Category } from "../model/category";
import { stageInk } from "../theme/palette";
import type { StageInk } from "../theme/palette";

/** Tile CSS vars for the stage-card treatment. */
const stageVars = (ink: StageInk) => ({
  "--stage-ink": ink.ink,
  "--stage-tint": ink.tint,
  "--stage-tint-hover": ink.tintHover,
});

interface GameBoardProps {
  categories: Category[];
  isItemRevealed: (id: string) => boolean;
  onItemClick: (itemId: string, songUrl?: string, startTime?: number) => void;
}

/**
 * The category × level tile grid: a full-width grid for single-category
 * boards, snap-scrolling columns with category headers otherwise.
 */
const GameBoard: Component<GameBoardProps> = (props) => {
  return (
    <>
      {/* Single-category: full-width grid, one ink for the whole board */}
      <Show when={props.categories.length === 1}>
        <div class="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          <For each={props.categories[0]?.items}>
            {(item) => {
              const ink = stageInk(0);
              return (
                <button
                  type="button"
                  class={`flex h-20 w-full cursor-pointer items-center justify-center rounded-xl sm:h-24 ${
                    props.isItemRevealed(item.id)
                      ? "border border-dashed border-line bg-night/50"
                      : "stage-card"
                  }`}
                  style={props.isItemRevealed(item.id) ? undefined : stageVars(ink)}
                  onClick={() => props.onItemClick(item.id, item.songUrl, item.startTime)}
                >
                  <span
                    class="font-mono text-2xl font-bold"
                    style={{
                      color: props.isItemRevealed(item.id)
                        ? "var(--color-muted)"
                        : "var(--color-ink)",
                    }}
                  >
                    {item.level}
                  </span>
                </button>
              );
            }}
          </For>
        </div>
      </Show>

      {/* Multi-category: column grid with category headers */}
      <Show when={props.categories.length > 1}>
        {/* Phones: horizontally scrollable snap columns (equal-width
            columns would crush with 4+ categories). md+: the grid. */}
        <div
          class="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:gap-6 md:overflow-x-visible md:px-0 md:pb-0"
          style={`grid-template-columns: repeat(${props.categories.length}, minmax(0, 1fr))`}
        >
          <For each={props.categories}>
            {(category, index) => {
              const ink = () => stageInk(index());
              return (
                <div class="flex w-40 shrink-0 snap-start flex-col gap-4 md:w-auto md:shrink">
                  <Show
                    when={category.imageUrl}
                    fallback={
                      <div
                        class="rounded-lg px-4 py-3 text-center"
                        style={{ background: ink().ink }}
                      >
                        <h2 class="font-display text-lg font-bold tracking-tight text-night">
                          {category.name}
                        </h2>
                      </div>
                    }
                  >
                    <img
                      src={category.imageUrl}
                      alt={category.name}
                      class="h-20 w-full rounded-lg border border-line object-cover"
                    />
                  </Show>

                  <div class="flex flex-col gap-3">
                    <For each={category.items}>
                      {(item) => (
                        <button
                          type="button"
                          class={`flex h-16 w-full cursor-pointer items-center justify-center rounded-lg ${
                            props.isItemRevealed(item.id)
                              ? "border border-dashed border-line bg-night/50"
                              : "stage-card"
                          }`}
                          style={props.isItemRevealed(item.id) ? undefined : stageVars(ink())}
                          onClick={() => props.onItemClick(item.id, item.songUrl, item.startTime)}
                        >
                          <span
                            class="font-mono text-2xl font-bold"
                            style={{
                              color: props.isItemRevealed(item.id)
                                ? "var(--color-muted)"
                                : "var(--color-ink)",
                            }}
                          >
                            {item.level}
                          </span>
                        </button>
                      )}
                    </For>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </Show>
    </>
  );
};

export default GameBoard;
