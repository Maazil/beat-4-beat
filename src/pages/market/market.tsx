import { Component, createSignal, For } from "solid-js";
import BackLink from "../../components/BackLink";
import Input from "../../components/forms/Input";
import PublicRoomsGrid from "../../components/PublicRoomsGrid";
import { filterMarketRooms } from "../../lib/marketFilter";

const Market: Component = () => {
  const [query, setQuery] = createSignal("");
  const [liveOnly, setLiveOnly] = createSignal(false);

  return (
    <div class="mx-auto w-full max-w-6xl px-6 py-12">
      <BackLink href="/dashboard" class="mb-6" />

      <div class="mb-8">
        <h1 class="font-display text-3xl font-bold tracking-tight text-ink">Marketplace</h1>
        <p class="mt-2 text-muted">Pick a community room and start playing instantly.</p>
      </div>

      <div class="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div class="sm:max-w-xs sm:flex-1">
          <Input
            type="search"
            value={query()}
            onInput={(e) => setQuery(e.currentTarget.value)}
            placeholder="Search by room or host…"
            aria-label="Search rooms"
          />
        </div>
        <div class="flex gap-2" role="group" aria-label="Filter by status">
          <For
            each={
              [
                { label: "All", live: false },
                { label: "Live", live: true },
              ] as const
            }
          >
            {(option) => (
              <button
                type="button"
                onClick={() => setLiveOnly(option.live)}
                aria-pressed={liveOnly() === option.live}
                class={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                  liveOnly() === option.live
                    ? "border-beat bg-beat text-night"
                    : "border-line text-muted hover:border-beat hover:text-beat"
                }`}
              >
                {option.label}
              </button>
            )}
          </For>
        </div>
      </div>

      <PublicRoomsGrid
        filter={(rooms) => filterMarketRooms(rooms, { query: query(), liveOnly: liveOnly() })}
        emptyFilteredLabel="No rooms match your search."
      />
    </div>
  );
};

export default Market;
