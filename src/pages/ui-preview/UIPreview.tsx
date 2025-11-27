import { Component, createSignal, For, Index } from "solid-js";

/**
 * UI Design Exploration Page
 *
 * This page showcases different color palette options for Beat 4 Beat.
 * Run the dev server and navigate to /ui-preview to see these options.
 */

// Color Palette Options
const palettes = {
  // Option A: Soft Rose & Berry (Light, elegant, music-friendly)
  softRose: {
    name: "Soft Rose & Berry",
    description:
      "Elegant light palette with soft pink/rose undertones. Berry purple CTAs pop beautifully against the delicate background.",
    bg: {
      primary: "#FDF8FA", // Soft rose-white
      secondary: "#FAF0F4", // Light blush
      card: "#FFFFFF", // Pure white cards
      elevated: "#FFF5F8", // Elevated surfaces
    },
    text: {
      primary: "#2D1F2D", // Deep plum
      secondary: "#5C4A5C", // Muted purple-gray
      muted: "#8C7A8C", // Light muted
    },
    accent: {
      primary: "#9D4EDD", // Berry purple (CTA)
      primaryHover: "#7B2CBF", // Darker purple
      secondary: "#C77DFF", // Soft purple
      tertiary: "#F3E8FF", // Very soft purple bg
    },
    border: "#EDE4E9", // Rose border
    success: "#4CAF79",
    info: "#5B9BD5",
  },

  // Option B: Soft Sage & Forest (Natural, calming, unique)
  softSage: {
    name: "Soft Sage & Forest",
    description:
      "Unique natural palette. Forest green CTAs stand out against sage backgrounds. Unexpected but memorable.",
    bg: {
      primary: "#F5F7F4", // Soft sage-white
      secondary: "#EEF2EB", // Light sage
      card: "#FFFFFF", // Pure white cards
      elevated: "#F8FAF7", // Elevated surfaces
    },
    text: {
      primary: "#1F2E1F", // Deep forest
      secondary: "#4A5D4A", // Muted forest
      muted: "#7A8C7A", // Light forest
    },
    accent: {
      primary: "#2D5A3D", // Forest green (CTA)
      primaryHover: "#1E4A2D", // Darker forest
      secondary: "#6B9B7A", // Soft green
      tertiary: "#E0EBE4", // Very soft green bg
    },
    border: "#DDE5DA", // Sage border
    success: "#2D5A3D",
    info: "#5B8FA8",
  },

  // Option C: Soft Amber & Gold (Warm, energetic, musical)
  softAmber: {
    name: "Soft Amber & Gold",
    description:
      "Warm golden tones reminiscent of stage lights and vinyl records. Energetic yet sophisticated.",
    bg: {
      primary: "#FFFCF5", // Cream-white
      secondary: "#FFF8EB", // Soft amber tint
      card: "#FFFFFF", // Pure white cards
      elevated: "#FFFAF2", // Elevated surfaces
    },
    text: {
      primary: "#2C2416", // Deep brown
      secondary: "#5C5040", // Muted brown
      muted: "#8C8070", // Light brown
    },
    accent: {
      primary: "#D97706", // Amber/Gold (CTA)
      primaryHover: "#B45309", // Darker amber
      secondary: "#F59E0B", // Bright gold
      tertiary: "#FEF3C7", // Very soft gold bg
    },
    border: "#EDE6D9", // Warm border
    success: "#4CAF79",
    info: "#5B9BD5",
  },

  // Option D: Light & Red (Current red accent with soft background)
  lightRed: {
    name: "Light & Red",
    description:
      "Your current vibrant red accent paired with a soft, neutral light background. Clean, modern, and music-ready.",
    bg: {
      primary: "#FAFAFA", // Very soft gray-white
      secondary: "#F5F5F5", // Light gray
      card: "#FFFFFF", // Pure white cards
      elevated: "#FEFEFE", // Elevated surfaces
    },
    text: {
      primary: "#1A1A1A", // Near black
      secondary: "#525252", // Medium gray
      muted: "#8A8A8A", // Light gray
    },
    accent: {
      primary: "#DC2626", // Vibrant red (your current red)
      primaryHover: "#B91C1C", // Darker red
      secondary: "#EF4444", // Lighter red
      tertiary: "#FEE2E2", // Very soft red bg
    },
    border: "#E5E5E5", // Neutral border
    success: "#16A34A",
    info: "#2563EB",
  },

  // Option E: nx.dev Inspired (Clean whites with modern blue accent)
  nxStyle: {
    name: "nx.dev Clean",
    description:
      "Inspired by nx.dev's clean aesthetic. Pure white backgrounds with modern blue accents. Professional and inviting.",
    bg: {
      primary: "#FFFFFF", // Pure white
      secondary: "#F8FAFC", // Slate 50
      card: "#FFFFFF", // Pure white cards
      elevated: "#F1F5F9", // Slate 100 for elevated
    },
    text: {
      primary: "#0F172A", // Slate 900
      secondary: "#475569", // Slate 600
      muted: "#94A3B8", // Slate 400
    },
    accent: {
      primary: "#0EA5E9", // Sky 500 (nx.dev blue)
      primaryHover: "#0284C7", // Sky 600
      secondary: "#38BDF8", // Sky 400
      tertiary: "#E0F2FE", // Sky 100
    },
    border: "#E2E8F0", // Slate 200
    success: "#22C55E",
    info: "#0EA5E9",
  },
};

// CTA Button Variations for each palette
const ctaVariations = {
  softRose: [
    {
      name: "Berry Solid",
      class: "bg-[#9D4EDD] hover:bg-[#7B2CBF] text-white",
    },
    {
      name: "Berry Outline",
      class:
        "border-2 border-[#9D4EDD] text-[#9D4EDD] hover:bg-[#9D4EDD] hover:text-white",
    },
    {
      name: "Dark Contrast",
      class: "bg-[#2D1F2D] hover:bg-[#1a1218] text-white",
    },
  ],
  softSage: [
    {
      name: "Forest Solid",
      class: "bg-[#2D5A3D] hover:bg-[#1E4A2D] text-white",
    },
    {
      name: "Forest Outline",
      class:
        "border-2 border-[#2D5A3D] text-[#2D5A3D] hover:bg-[#2D5A3D] hover:text-white",
    },
    {
      name: "Gold Accent",
      class: "bg-[#C9A227] hover:bg-[#A8871E] text-white",
    },
  ],
  softAmber: [
    {
      name: "Amber Solid",
      class: "bg-[#D97706] hover:bg-[#B45309] text-white",
    },
    {
      name: "Amber Outline",
      class:
        "border-2 border-[#D97706] text-[#D97706] hover:bg-[#D97706] hover:text-white",
    },
    {
      name: "Dark Contrast",
      class: "bg-[#2C2416] hover:bg-[#1a1610] text-white",
    },
  ],
  lightRed: [
    {
      name: "Red Solid",
      class: "bg-[#DC2626] hover:bg-[#B91C1C] text-white",
    },
    {
      name: "Red Outline",
      class:
        "border-2 border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626] hover:text-white",
    },
    {
      name: "Dark Contrast",
      class: "bg-[#1A1A1A] hover:bg-[#0a0a0a] text-white",
    },
  ],
  nxStyle: [
    {
      name: "Sky Solid",
      class: "bg-[#0EA5E9] hover:bg-[#0284C7] text-white",
    },
    {
      name: "Sky Outline",
      class:
        "border-2 border-[#0EA5E9] text-[#0EA5E9] hover:bg-[#0EA5E9] hover:text-white",
    },
    {
      name: "Dark Contrast",
      class: "bg-[#0F172A] hover:bg-[#1E293B] text-white",
    },
  ],
};

const UIPreview: Component = () => {
  const [activePalette, setActivePalette] =
    createSignal<keyof typeof palettes>("softRose");
  const currentPalette = () => palettes[activePalette()];
  const currentCTAs = () => ctaVariations[activePalette()];

  return (
    <div
      class="min-h-screen p-8 transition-colors duration-300"
      style={{ "background-color": currentPalette().bg.primary }}
    >
      <div class="mx-auto max-w-6xl">
        {/* Header */}
        <div class="mb-8 text-center">
          <h1
            class="mb-2 text-4xl font-bold"
            style={{ color: currentPalette().text.primary }}
          >
            Beat 4 Beat — UI Color Exploration
          </h1>
          <p style={{ color: currentPalette().text.secondary }}>
            Click the palette tabs below to preview different options
          </p>
        </div>

        {/* Palette Selector */}
        <div class="mb-8 flex flex-wrap justify-center gap-2">
          <For each={Object.entries(palettes)}>
            {([key, palette]) => (
              <button
                type="button"
                onClick={() => setActivePalette(key as keyof typeof palettes)}
                class={`rounded-full px-6 py-3 font-medium transition-all ${
                  activePalette() === key
                    ? "scale-105 shadow-lg ring-2 ring-offset-2"
                    : "opacity-70 hover:opacity-100"
                }`}
                style={{
                  "background-color":
                    activePalette() === key
                      ? currentPalette().accent.primary
                      : currentPalette().bg.card,
                  color:
                    activePalette() === key
                      ? "white"
                      : currentPalette().text.primary,
                  "border-color": currentPalette().border,
                  "border-width": "1px",
                }}
              >
                {palette.name}
              </button>
            )}
          </For>
        </div>

        {/* Palette Info */}
        <div
          class="mb-8 rounded-2xl border p-6"
          style={{
            "background-color": currentPalette().bg.card,
            "border-color": currentPalette().border,
          }}
        >
          <h2
            class="mb-2 text-2xl font-semibold"
            style={{ color: currentPalette().text.primary }}
          >
            {currentPalette().name}
          </h2>
          <p style={{ color: currentPalette().text.secondary }}>
            {currentPalette().description}
          </p>
        </div>

        {/* CTA Button Variations */}
        <div
          class="mb-8 rounded-2xl border p-6"
          style={{
            "background-color": currentPalette().bg.card,
            "border-color": currentPalette().border,
          }}
        >
          <h3
            class="mb-4 text-xl font-semibold"
            style={{ color: currentPalette().text.primary }}
          >
            CTA Button Variations
          </h3>
          <div class="flex flex-wrap gap-4">
            <For each={currentCTAs()}>
              {(cta) => (
                <div class="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    class={`rounded-full px-8 py-3 font-semibold transition-all ${cta.class}`}
                  >
                    Start Game
                  </button>
                  <span
                    class="text-sm"
                    style={{ color: currentPalette().text.muted }}
                  >
                    {cta.name}
                  </span>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* Sample Dashboard Cards */}
        <div class="mb-8 grid gap-6 md:grid-cols-3">
          <Index each={["My Rooms", "Create Room", "Statistics"]}>
            {(title, i) => (
              <div
                class="rounded-2xl border p-6 transition-shadow hover:shadow-md"
                style={{
                  "background-color": currentPalette().bg.card,
                  "border-color": currentPalette().border,
                }}
              >
                <h3
                  class="mb-2 text-lg font-semibold"
                  style={{ color: currentPalette().text.primary }}
                >
                  {title()}
                </h3>
                <p
                  class="mb-4 text-sm"
                  style={{ color: currentPalette().text.secondary }}
                >
                  Sample card description text that explains the feature.
                </p>
                <button
                  type="button"
                  class={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                    i === 1 ? currentCTAs()[0].class : ""
                  }`}
                  style={
                    i !== 1
                      ? {
                          "background-color": currentPalette().bg.secondary,
                          color: currentPalette().text.primary,
                          border: `1px solid ${currentPalette().border}`,
                        }
                      : {}
                  }
                >
                  {i === 1 ? "Create +" : "View"}
                </button>
              </div>
            )}
          </Index>
        </div>

        {/* Sample Category Colors (Always Varied) */}
        <div
          class="mb-8 rounded-2xl border p-6"
          style={{
            "background-color": currentPalette().bg.card,
            "border-color": currentPalette().border,
          }}
        >
          <h3
            class="mb-4 text-xl font-semibold"
            style={{ color: currentPalette().text.primary }}
          >
            Category Colors (Remain Varied)
          </h3>
          <p
            class="mb-4 text-sm"
            style={{ color: currentPalette().text.secondary }}
          >
            These stay distinct regardless of palette choice. Future: Replace
            with uploaded images.
          </p>
          <div class="grid grid-cols-6 gap-3">
            <For
              each={[
                { name: "Pop", bg: "bg-blue-500", border: "border-blue-300" },
                {
                  name: "Rock",
                  bg: "bg-purple-500",
                  border: "border-purple-300",
                },
                {
                  name: "Jazz",
                  bg: "bg-green-500",
                  border: "border-green-300",
                },
                {
                  name: "Hip-Hop",
                  bg: "bg-orange-500",
                  border: "border-orange-300",
                },
                { name: "R&B", bg: "bg-pink-500", border: "border-pink-300" },
                {
                  name: "Electronic",
                  bg: "bg-teal-500",
                  border: "border-teal-300",
                },
              ]}
            >
              {(cat) => (
                <div class="flex flex-col gap-2">
                  <div
                    class={`${cat.bg} rounded-lg px-3 py-2 text-center text-sm font-semibold text-white`}
                  >
                    {cat.name}
                  </div>
                  <div
                    class={`border-2 ${cat.border} flex h-12 items-center justify-center rounded-lg bg-white/50 text-lg font-bold`}
                    style={{ color: currentPalette().text.secondary }}
                  >
                    100
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* Sample Form Elements */}
        <div
          class="mb-8 rounded-2xl border p-6"
          style={{
            "background-color": currentPalette().bg.card,
            "border-color": currentPalette().border,
          }}
        >
          <h3
            class="mb-4 text-xl font-semibold"
            style={{ color: currentPalette().text.primary }}
          >
            Form Elements
          </h3>
          <div class="max-w-md space-y-4">
            <div>
              <label
                class="mb-2 block text-sm font-medium"
                style={{ color: currentPalette().text.primary }}
              >
                Room Name
              </label>
              <input
                type="text"
                placeholder="Friday Beat Battle"
                class="w-full rounded-lg px-4 py-2.5 transition-all outline-none focus:ring-2"
                style={{
                  "background-color": currentPalette().bg.primary,
                  color: currentPalette().text.primary,
                  border: `1px solid ${currentPalette().border}`,
                  "--tw-ring-color": currentPalette().accent.primary,
                }}
              />
            </div>
            <div class="flex gap-3">
              <button
                type="button"
                class={`flex-1 rounded-lg px-6 py-2.5 font-semibold transition-all ${currentCTAs()[0].class}`}
              >
                Create Room
              </button>
              <button
                type="button"
                class="rounded-lg px-6 py-2.5 font-medium transition-all"
                style={{
                  "background-color": currentPalette().bg.secondary,
                  color: currentPalette().text.secondary,
                  border: `1px solid ${currentPalette().border}`,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div
          class="rounded-2xl border p-6"
          style={{
            "background-color": currentPalette().bg.card,
            "border-color": currentPalette().border,
          }}
        >
          <h3
            class="mb-4 text-xl font-semibold"
            style={{ color: currentPalette().text.primary }}
          >
            Status Badges
          </h3>
          <div class="flex flex-wrap gap-3">
            <span class="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              Live
            </span>
            <span class="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              Scheduled
            </span>
            <span
              class="rounded-full px-3 py-1 text-sm font-medium"
              style={{
                "background-color": currentPalette().bg.secondary,
                color: currentPalette().text.secondary,
              }}
            >
              Completed
            </span>
          </div>
        </div>

        {/* Color Swatches */}
        <div
          class="mt-8 rounded-2xl border p-6"
          style={{
            "background-color": currentPalette().bg.card,
            "border-color": currentPalette().border,
          }}
        >
          <h3
            class="mb-4 text-xl font-semibold"
            style={{ color: currentPalette().text.primary }}
          >
            Full Color Palette
          </h3>
          <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p
                class="mb-2 text-sm font-medium"
                style={{ color: currentPalette().text.secondary }}
              >
                Backgrounds
              </p>
              <div class="space-y-2">
                <For each={Object.entries(currentPalette().bg)}>
                  {([name, color]) => (
                    <div class="flex items-center gap-2">
                      <div
                        class="h-8 w-8 rounded border"
                        style={{
                          "background-color": color,
                          "border-color": currentPalette().border,
                        }}
                      />
                      <span
                        class="text-xs"
                        style={{ color: currentPalette().text.muted }}
                      >
                        {name}: {color}
                      </span>
                    </div>
                  )}
                </For>
              </div>
            </div>
            <div>
              <p
                class="mb-2 text-sm font-medium"
                style={{ color: currentPalette().text.secondary }}
              >
                Text
              </p>
              <div class="space-y-2">
                <For each={Object.entries(currentPalette().text)}>
                  {([name, color]) => (
                    <div class="flex items-center gap-2">
                      <div
                        class="h-8 w-8 rounded border"
                        style={{
                          "background-color": color,
                          "border-color": currentPalette().border,
                        }}
                      />
                      <span
                        class="text-xs"
                        style={{ color: currentPalette().text.muted }}
                      >
                        {name}: {color}
                      </span>
                    </div>
                  )}
                </For>
              </div>
            </div>
            <div>
              <p
                class="mb-2 text-sm font-medium"
                style={{ color: currentPalette().text.secondary }}
              >
                Accents
              </p>
              <div class="space-y-2">
                <For each={Object.entries(currentPalette().accent)}>
                  {([name, color]) => (
                    <div class="flex items-center gap-2">
                      <div
                        class="h-8 w-8 rounded border"
                        style={{
                          "background-color": color,
                          "border-color": currentPalette().border,
                        }}
                      />
                      <span
                        class="text-xs"
                        style={{ color: currentPalette().text.muted }}
                      >
                        {name}: {color}
                      </span>
                    </div>
                  )}
                </For>
              </div>
            </div>
            <div>
              <p
                class="mb-2 text-sm font-medium"
                style={{ color: currentPalette().text.secondary }}
              >
                Utility
              </p>
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <div
                    class="h-8 w-8 rounded border"
                    style={{
                      "background-color": currentPalette().border,
                      "border-color": currentPalette().border,
                    }}
                  />
                  <span
                    class="text-xs"
                    style={{ color: currentPalette().text.muted }}
                  >
                    border: {currentPalette().border}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <div
                    class="h-8 w-8 rounded border"
                    style={{
                      "background-color": currentPalette().success,
                      "border-color": currentPalette().border,
                    }}
                  />
                  <span
                    class="text-xs"
                    style={{ color: currentPalette().text.muted }}
                  >
                    success: {currentPalette().success}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <div
                    class="h-8 w-8 rounded border"
                    style={{
                      "background-color": currentPalette().info,
                      "border-color": currentPalette().border,
                    }}
                  />
                  <span
                    class="text-xs"
                    style={{ color: currentPalette().text.muted }}
                  >
                    info: {currentPalette().info}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vite-style Glow Effect Demo */}
        <div
          class="mt-8 rounded-2xl border p-6"
          style={{
            "background-color": currentPalette().bg.card,
            "border-color": currentPalette().border,
          }}
        >
          <h3
            class="mb-2 text-xl font-semibold"
            style={{ color: currentPalette().text.primary }}
          >
            ✨ Vite-style Hover Glow Effect
          </h3>
          <p
            class="mb-6 text-sm"
            style={{ color: currentPalette().text.secondary }}
          >
            Hover over the items below to see the colored glow effect (works
            great on light backgrounds!)
          </p>

          <div class="flex flex-wrap justify-center gap-6">
            {/* Glow items - each with different accent color */}
            <For
              each={[
                {
                  name: "Pop",
                  color: "#3B82F6",
                  hoverBg: "rgba(59, 130, 246, 0.15)",
                },
                {
                  name: "Rock",
                  color: "#8B5CF6",
                  hoverBg: "rgba(139, 92, 246, 0.15)",
                },
                {
                  name: "Jazz",
                  color: "#10B981",
                  hoverBg: "rgba(16, 185, 129, 0.15)",
                },
                {
                  name: "Hip-Hop",
                  color: "#F59E0B",
                  hoverBg: "rgba(245, 158, 11, 0.15)",
                },
                {
                  name: "R&B",
                  color: "#EC4899",
                  hoverBg: "rgba(236, 72, 153, 0.15)",
                },
                {
                  name: "Electronic",
                  color: "#06B6D4",
                  hoverBg: "rgba(6, 182, 212, 0.15)",
                },
              ]}
            >
              {(item) => (
                <div class="group relative flex flex-col items-center">
                  {/* Glow layer - shows on hover */}
                  <div
                    class="pointer-events-none absolute -inset-3 rounded-2xl opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"
                    style={{ "background-color": item.color }}
                  />
                  {/* Card */}
                  <div
                    class="relative z-10 flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border-2 transition-all duration-300 group-hover:scale-105 group-hover:border-transparent group-hover:shadow-lg"
                    style={{
                      "background-color": currentPalette().bg.card,
                      "border-color": currentPalette().border,
                    }}
                  >
                    <span
                      class="text-2xl font-bold transition-colors duration-300"
                      style={{ color: item.color }}
                    >
                      🎵
                    </span>
                  </div>
                  <span
                    class="mt-2 text-sm font-medium"
                    style={{ color: currentPalette().text.secondary }}
                  >
                    {item.name}
                  </span>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* Perplexity-style Clean Cards */}
        <div
          class="mt-8 rounded-2xl border p-6"
          style={{
            "background-color": currentPalette().bg.card,
            "border-color": currentPalette().border,
          }}
        >
          <h3
            class="mb-2 text-xl font-semibold"
            style={{ color: currentPalette().text.primary }}
          >
            🪐 Perplexity-style Clean UI
          </h3>
          <p
            class="mb-6 text-sm"
            style={{ color: currentPalette().text.secondary }}
          >
            Minimal, spacious cards with subtle hover interactions and soft
            shadows
          </p>

          <div class="grid gap-4 md:grid-cols-3">
            <For
              each={[
                {
                  title: "My Rooms",
                  desc: "View and manage your game rooms",
                  icon: "🎮",
                },
                {
                  title: "Create Room",
                  desc: "Start a new Beat 4 Beat session",
                  icon: "✨",
                  primary: true,
                },
                {
                  title: "Statistics",
                  desc: "Track your performance over time",
                  icon: "📊",
                },
              ]}
            >
              {(card) => (
                <div
                  class="group relative cursor-pointer overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  style={{
                    "background-color": currentPalette().bg.card,
                    "border-color": card.primary
                      ? currentPalette().accent.primary
                      : currentPalette().border,
                  }}
                >
                  {/* Subtle gradient overlay on hover */}
                  <div
                    class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background: card.primary
                        ? `linear-gradient(135deg, ${currentPalette().accent.tertiary} 0%, transparent 50%)`
                        : `linear-gradient(135deg, ${currentPalette().bg.secondary} 0%, transparent 50%)`,
                    }}
                  />
                  <div class="relative z-10">
                    <span class="mb-3 block text-3xl">{card.icon}</span>
                    <h4
                      class="mb-1 text-lg font-semibold"
                      style={{ color: currentPalette().text.primary }}
                    >
                      {card.title}
                    </h4>
                    <p
                      class="mb-4 text-sm"
                      style={{ color: currentPalette().text.secondary }}
                    >
                      {card.desc}
                    </p>
                    <button
                      type="button"
                      class={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        card.primary ? "text-white" : ""
                      }`}
                      style={
                        card.primary
                          ? {
                              "background-color":
                                currentPalette().accent.primary,
                            }
                          : {
                              "background-color": currentPalette().bg.secondary,
                              color: currentPalette().text.primary,
                            }
                      }
                    >
                      {card.primary ? "Create +" : "View →"}
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* nx.dev-inspired Audio Wave Stats Section */}
        <div
          class="mt-8 overflow-hidden rounded-2xl border"
          style={{
            "background-color": currentPalette().bg.card,
            "border-color": currentPalette().border,
          }}
        >
          <div class="relative px-6 py-12">
            {/* Audio Wave SVG Background */}
            <div class="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
              <svg
                class="absolute top-0 left-0 h-full w-full"
                viewBox="0 0 1200 400"
                preserveAspectRatio="xMidYMid slice"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Wave Line 1 - Top flowing curve */}
                <path
                  d="M0,80 C200,120 400,40 600,100 C800,160 1000,80 1200,120"
                  stroke={currentPalette().accent.primary}
                  stroke-width="2"
                  fill="none"
                  stroke-linecap="round"
                >
                  <animate
                    attributeName="d"
                    dur="8s"
                    repeatCount="indefinite"
                    values="
                      M0,80 C200,120 400,40 600,100 C800,160 1000,80 1200,120;
                      M0,100 C200,60 400,140 600,80 C800,20 1000,100 1200,60;
                      M0,80 C200,120 400,40 600,100 C800,160 1000,80 1200,120
                    "
                  />
                </path>

                {/* Wave Line 2 - Middle beat wave */}
                <path
                  d="M0,200 C150,150 300,250 450,200 C600,150 750,250 900,200 C1050,150 1200,200 1200,200"
                  stroke={currentPalette().accent.secondary}
                  stroke-width="3"
                  fill="none"
                  stroke-linecap="round"
                >
                  <animate
                    attributeName="d"
                    dur="6s"
                    repeatCount="indefinite"
                    values="
                      M0,200 C150,150 300,250 450,200 C600,150 750,250 900,200 C1050,150 1200,200 1200,200;
                      M0,200 C150,250 300,150 450,200 C600,250 750,150 900,200 C1050,250 1200,200 1200,200;
                      M0,200 C150,150 300,250 450,200 C600,150 750,250 900,200 C1050,150 1200,200 1200,200
                    "
                  />
                </path>

                {/* Wave Line 3 - Audio waveform style */}
                <path
                  d="M0,300 Q100,280 200,300 T400,300 T600,300 T800,300 T1000,300 T1200,300"
                  stroke={currentPalette().accent.primary}
                  stroke-width="2"
                  fill="none"
                  stroke-linecap="round"
                  opacity="0.6"
                >
                  <animate
                    attributeName="d"
                    dur="4s"
                    repeatCount="indefinite"
                    values="
                      M0,300 Q100,280 200,300 T400,300 T600,300 T800,300 T1000,300 T1200,300;
                      M0,300 Q100,320 200,300 T400,300 T600,300 T800,300 T1000,300 T1200,300;
                      M0,300 Q100,280 200,300 T400,300 T600,300 T800,300 T1000,300 T1200,300
                    "
                  />
                </path>

                {/* Beat dots along the wave */}
                <circle
                  cx="200"
                  cy="200"
                  r="4"
                  fill={currentPalette().accent.primary}
                >
                  <animate
                    attributeName="r"
                    dur="2s"
                    repeatCount="indefinite"
                    values="4;8;4"
                  />
                  <animate
                    attributeName="opacity"
                    dur="2s"
                    repeatCount="indefinite"
                    values="1;0.5;1"
                  />
                </circle>
                <circle
                  cx="600"
                  cy="200"
                  r="4"
                  fill={currentPalette().accent.secondary}
                >
                  <animate
                    attributeName="r"
                    dur="2s"
                    repeatCount="indefinite"
                    values="4;8;4"
                    begin="0.5s"
                  />
                  <animate
                    attributeName="opacity"
                    dur="2s"
                    repeatCount="indefinite"
                    values="1;0.5;1"
                    begin="0.5s"
                  />
                </circle>
                <circle
                  cx="1000"
                  cy="200"
                  r="4"
                  fill={currentPalette().accent.primary}
                >
                  <animate
                    attributeName="r"
                    dur="2s"
                    repeatCount="indefinite"
                    values="4;8;4"
                    begin="1s"
                  />
                  <animate
                    attributeName="opacity"
                    dur="2s"
                    repeatCount="indefinite"
                    values="1;0.5;1"
                    begin="1s"
                  />
                </circle>
              </svg>
            </div>

            {/* Content */}
            <div class="relative z-10 text-center">
              <h3
                class="mb-3 text-3xl font-bold md:text-4xl"
                style={{ color: currentPalette().text.primary }}
              >
                Drop the beat in record time
              </h3>
              <p
                class="mx-auto mb-10 max-w-2xl text-lg"
                style={{ color: currentPalette().text.secondary }}
              >
                Beat 4 Beat makes music gaming social, competitive, and fun.
                Create rooms, challenge friends, and prove your musical prowess.
              </p>

              {/* Stats Grid */}
              <div class="grid gap-8 md:grid-cols-4">
                <For
                  each={[
                    { value: "2x", label: "More Fun", subtext: "vs solo play" },
                    {
                      value: "500+",
                      label: "Songs Available",
                      subtext: "across genres",
                    },
                    {
                      value: "10s",
                      label: "Setup Time",
                      subtext: "to start playing",
                    },
                    {
                      value: "∞",
                      label: "Replay Value",
                      subtext: "always fresh",
                    },
                  ]}
                >
                  {(stat) => (
                    <div class="group">
                      <div
                        class="mb-1 text-4xl font-bold transition-transform duration-300 group-hover:scale-110 md:text-5xl"
                        style={{ color: currentPalette().accent.primary }}
                      >
                        {stat.value}
                      </div>
                      <div
                        class="text-base font-semibold"
                        style={{ color: currentPalette().text.primary }}
                      >
                        {stat.label}
                      </div>
                      <div
                        class="text-sm"
                        style={{ color: currentPalette().text.muted }}
                      >
                        {stat.subtext}
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </div>
        </div>

        {/* Room Cards with Glow */}
        <div
          class="mt-8 rounded-2xl border p-6"
          style={{
            "background-color": currentPalette().bg.card,
            "border-color": currentPalette().border,
          }}
        >
          <h3
            class="mb-2 text-xl font-semibold"
            style={{ color: currentPalette().text.primary }}
          >
            🎯 Room Cards with Hover Glow
          </h3>
          <p
            class="mb-6 text-sm"
            style={{ color: currentPalette().text.secondary }}
          >
            How room cards could look with the glow effect
          </p>

          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <For
              each={[
                {
                  name: "Friday Beat Battle",
                  host: "DJ Ola",
                  status: "Live",
                  statusColor: "#10B981",
                },
                {
                  name: "90s Nostalgia",
                  host: "RetroMix",
                  status: "Scheduled",
                  statusColor: "#3B82F6",
                },
                {
                  name: "Hip-Hop Showdown",
                  host: "MC Flow",
                  status: "Live",
                  statusColor: "#10B981",
                },
              ]}
            >
              {(room) => (
                <div class="group relative">
                  {/* Glow layer */}
                  <div
                    class="pointer-events-none absolute -inset-2 rounded-3xl opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
                    style={{
                      "background-color": currentPalette().accent.primary,
                    }}
                  />
                  {/* Card */}
                  <div
                    class="relative z-10 cursor-pointer rounded-2xl border p-5 transition-all duration-300 group-hover:border-transparent group-hover:shadow-lg"
                    style={{
                      "background-color": currentPalette().bg.card,
                      "border-color": currentPalette().border,
                    }}
                  >
                    <div class="mb-3 flex items-start justify-between">
                      <h4
                        class="font-semibold"
                        style={{ color: currentPalette().text.primary }}
                      >
                        {room.name}
                      </h4>
                      <span
                        class="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                        style={{ "background-color": room.statusColor }}
                      >
                        {room.status}
                      </span>
                    </div>
                    <p
                      class="text-sm"
                      style={{ color: currentPalette().text.secondary }}
                    >
                      Hosted by {room.host}
                    </p>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UIPreview;
