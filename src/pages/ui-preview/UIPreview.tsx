import { Component, For } from "solid-js";
import Input from "../../components/forms/Input";
import { STAGE_INKS } from "../../theme/palette";

/**
 * Stage Night design system preview.
 *
 * Dev-only living style guide for the Stage Night theme. Run the dev
 * server and navigate to /ui-preview to see it.
 */

const TOKENS = [
  { name: "night", class: "bg-night", desc: "page background" },
  { name: "surface", class: "bg-surface", desc: "card / panel fill" },
  { name: "surface-2", class: "bg-surface-2", desc: "inputs, tiles, hover fills" },
  { name: "line", class: "bg-line", desc: "hairline borders" },
  { name: "ink", class: "bg-ink", desc: "primary text" },
  { name: "muted", class: "bg-muted", desc: "secondary text" },
  { name: "peri", class: "bg-peri", desc: "cool support hue" },
  { name: "beat", class: "bg-beat", desc: "the gold accent" },
  { name: "beat-bright", class: "bg-beat-bright", desc: "gold hover / bright text" },
  { name: "beat-soft", class: "bg-beat-soft", desc: "translucent gold wash" },
  { name: "magenta", class: "bg-magenta", desc: "support accent" },
  { name: "magenta-hot", class: "bg-magenta-hot", desc: "hot / destructive moments" },
  { name: "spotify", class: "bg-spotify", desc: "Spotify connection states" },
];

const STATUS_BADGES = [
  { label: "Live", class: "border border-beat/40 bg-beat-soft text-beat-bright" },
  { label: "Scheduled", class: "border border-line text-muted" },
  { label: "Ended", class: "border border-magenta-hot/40 bg-magenta-hot/10 text-magenta-hot" },
];

const UIPreview: Component = () => {
  return (
    <div class="min-h-screen bg-stage px-6 py-16">
      <div class="mx-auto max-w-5xl space-y-12">
        {/* Header */}
        <div>
          <p class="font-mono text-xs tracking-wide text-beat uppercase">Design system</p>
          <h1 class="mt-2 text-4xl font-bold text-ink">Stage Night</h1>
          <p class="mt-2 text-muted">Tokens and recipes used across Beat 4 Beat.</p>
        </div>

        {/* Color tokens */}
        <section class="stage-card rounded-2xl border border-line bg-surface p-6">
          <h2 class="mb-4 font-mono text-xs tracking-wide text-muted uppercase">Color tokens</h2>
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            <For each={TOKENS}>
              {(token) => (
                <div class="flex items-center gap-3">
                  <div class={`h-10 w-10 shrink-0 rounded-lg border border-line ${token.class}`} />
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium text-ink">{token.name}</p>
                    <p class="truncate text-xs text-muted">{token.desc}</p>
                  </div>
                </div>
              )}
            </For>
          </div>
        </section>

        {/* Buttons */}
        <section class="stage-card rounded-2xl border border-line bg-surface p-6">
          <h2 class="mb-4 font-mono text-xs tracking-wide text-muted uppercase">Buttons</h2>
          <div class="flex flex-wrap items-center gap-4">
            <button
              type="button"
              class="rounded-full bg-beat px-6 py-2.5 font-semibold text-night transition hover:bg-beat-bright"
            >
              Primary
            </button>
            <button
              type="button"
              class="rounded-full border border-line px-6 py-2.5 font-semibold text-ink transition hover:border-beat hover:bg-beat-soft"
            >
              Secondary
            </button>
            <button
              type="button"
              class="rounded-full border border-magenta-hot/40 px-6 py-2.5 font-semibold text-magenta-hot transition hover:bg-magenta-hot/10"
            >
              Destructive
            </button>
            <button
              type="button"
              disabled
              class="rounded-full bg-beat px-6 py-2.5 font-semibold text-night opacity-40"
            >
              Disabled
            </button>
          </div>
        </section>

        {/* Chips & badges */}
        <section class="stage-card rounded-2xl border border-line bg-surface p-6">
          <h2 class="mb-4 font-mono text-xs tracking-wide text-muted uppercase">
            Chips &amp; badges
          </h2>
          <div class="flex flex-wrap items-center gap-3">
            <span class="rounded-full border border-beat/30 bg-beat-soft px-3 py-1 font-mono text-xs text-beat-bright">
              12 rounds
            </span>
            <For each={STATUS_BADGES}>
              {(badge) => (
                <span class={`rounded-full px-3 py-1 text-sm font-medium ${badge.class}`}>
                  {badge.label}
                </span>
              )}
            </For>
          </div>
        </section>

        {/* Category inks */}
        <section class="stage-card rounded-2xl border border-line bg-surface p-6">
          <h2 class="mb-4 font-mono text-xs tracking-wide text-muted uppercase">Category inks</h2>
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            <For each={STAGE_INKS}>
              {(stageInk, i) => (
                <div class="flex flex-col gap-2">
                  <div
                    class="rounded-lg px-3 py-2 text-center text-sm font-semibold text-night"
                    style={{ background: stageInk.ink }}
                  >
                    {stageInk.name}
                  </div>
                  <div
                    class="flex h-12 items-center justify-center rounded-lg border font-mono text-lg font-bold"
                    style={{
                      "background-color": stageInk.tint,
                      "border-color": stageInk.ink,
                      color: stageInk.bright,
                    }}
                  >
                    {i() + 1}
                  </div>
                </div>
              )}
            </For>
          </div>
        </section>

        {/* Form elements */}
        <section class="stage-card rounded-2xl border border-line bg-surface p-6">
          <h2 class="mb-4 font-mono text-xs tracking-wide text-muted uppercase">Form elements</h2>
          <div class="grid max-w-2xl gap-4 sm:grid-cols-2">
            <Input label="Room name" placeholder="Friday Beat Battle" />
            <Input label="Guess" placeholder="Type your answer" error="That's not quite it" />
          </div>
        </section>
      </div>
    </div>
  );
};

export default UIPreview;
