import { useNavigate } from "@solidjs/router";
import { Component, createSignal, For } from "solid-js";
import Input from "../../components/forms/Input";
import PublicRoomsGrid from "../../components/PublicRoomsGrid";
import { filterMarketRooms } from "../../lib/marketFilter";

const Market: Component = () => {
  const navigate = useNavigate();

  const [query, setQuery] = createSignal("");
  const [liveOnly, setLiveOnly] = createSignal(false);

  return (
    <div class="mx-auto w-full max-w-6xl px-6 py-12">
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        class="mb-6 flex items-center gap-2 text-muted transition hover:text-beat"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        <span class="font-medium">Back</span>
      </button>

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
