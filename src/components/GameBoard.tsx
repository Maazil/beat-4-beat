import { Component, createMemo, For, Show } from "solid-js";
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
  // Mobile songitem grid is near-square, sized from the largest category so
  // every category shares one column count: cols = ceil(sqrt(maxItems)).
  const itemCols = createMemo(() => {
    const max = Math.max(1, ...props.categories.map((c) => c.items.length));
    return Math.ceil(Math.sqrt(max));
  });

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
        {/* Phones: full-width categories stacked vertically, each with its
            songitems in a near-square grid. md+: the side-by-side column grid. */}
        <div
          class="flex flex-col gap-6 md:grid"
          style={`grid-template-columns: repeat(${props.categories.length}, minmax(0, 1fr))`}
        >
          <For each={props.categories}>
            {(category, index) => {
              const ink = () => stageInk(index());
              return (
                <div class="flex w-full flex-col gap-4 md:w-auto">
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

                  <div
                    class="grid gap-2 md:flex md:flex-col md:gap-3"
                    style={`grid-template-columns: repeat(${itemCols()}, minmax(0, 1fr))`}
                  >
                    <For each={category.items}>
                      {(item) => (
                        <button
                          type="button"
                          class={`flex h-14 w-full cursor-pointer items-center justify-center rounded-lg md:h-16 ${
                            props.isItemRevealed(item.id)
                              ? "border border-dashed border-line bg-night/50"
                              : "stage-card"
                          }`}
                          style={props.isItemRevealed(item.id) ? undefined : stageVars(ink())}
                          onClick={() => props.onItemClick(item.id, item.songUrl, item.startTime)}
                        >
                          <span
                            class="font-mono text-xl font-bold sm:text-2xl"
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
