import { Meta, Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import { For, type Component } from "solid-js";
import Logo from "../components/Logo";
import RandomVisualizer from "../components/RandomVisualizer";

const marqueeWords = [
  "Guess the track",
  "Steal the points",
  "Pick your team",
  "Hit play",
  "Beat the room",
  "One more round",
];

const App: Component = () => {
  const navigate = useNavigate();

  return (
    <>
      <Title>Beat 4 Beat — The music quiz party game</Title>
      <Meta
        name="description"
        content="Beat 4 Beat is the ultimate music quiz party game. Build game boards from your Spotify playlists, gather your friends, guess the track, and beat the room."
      />

      <main class="bg-stage relative flex min-h-screen flex-col overflow-hidden">
        {/* Texture + soft floating glows */}
        <div class="pointer-events-none absolute inset-0">
          <div class="bg-halftone absolute inset-0 opacity-60" />
          <div class="animate-ambient-float absolute top-24 -left-28 h-72 w-72 rounded-full bg-beat/10 blur-[120px]" />
          <div class="animate-ambient-float absolute -right-24 bottom-32 h-80 w-80 rounded-full bg-beat/8 blur-[140px]" />
        </div>

        {/* Header */}
        <header class="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-8">
          <Logo class="animate-rise-in h-9 w-auto" />
          <button
            type="button"
            onClick={() => navigate("/login")}
            class="animate-rise-in rounded-full border border-line bg-paper px-5 py-2 text-sm font-semibold text-ink transition hover:border-beat hover:text-beat"
            style={{ "animation-delay": "80ms" }}
          >
            Sign in
          </button>
        </header>

        {/* Hero */}
        <section class="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-16">
          <p
            class="animate-rise-in mb-6 font-mono text-xs font-semibold tracking-[0.35em] text-beat uppercase"
            style={{ "animation-delay": "120ms" }}
          >
            ♪ The music quiz party game
          </p>

          <h1
            class="animate-rise-in font-display max-w-4xl text-6xl leading-[0.95] font-extrabold tracking-tight text-balance text-ink sm:text-7xl lg:text-8xl"
            style={{ "animation-delay": "200ms" }}
          >
            Guess the track.
            <br />
            <span class="text-beat">Beat the room.</span>
          </h1>

          <p
            class="animate-rise-in mt-8 max-w-[52ch] text-lg text-pretty text-muted"
            style={{ "animation-delay": "320ms" }}
          >
            Build a game board from your Spotify playlists, gather your friends, and find out who
            really knows their music. First to name the tune takes the points.
          </p>

          <div
            class="animate-rise-in mt-10 flex flex-wrap items-center gap-4"
            style={{ "animation-delay": "440ms" }}
          >
            <button
              type="button"
              onClick={() => navigate("/login")}
              class="group inline-flex items-center gap-3 rounded-full bg-beat px-8 py-3.5 text-base font-bold text-white shadow-[0_12px_30px_-10px_rgba(232,38,74,0.55)] transition duration-300 hover:bg-beat-deep focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-beat"
            >
              <span>Start playing</span>
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition duration-300 group-hover:translate-x-0.5">
                <svg
                  class="h-3.5 w-3.5"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M5.333 3.556 10.667 8l-5.334 4.444"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/market")}
              class="rounded-full border border-line bg-paper px-7 py-3.5 text-base font-semibold text-ink transition hover:border-beat hover:text-beat"
            >
              Explore public rooms
            </button>
          </div>

          <div class="animate-rise-in mt-14 max-w-xl" style={{ "animation-delay": "560ms" }}>
            <RandomVisualizer />
          </div>
        </section>

        {/* Marquee footer */}
        <div
          class="animate-rise-in relative z-10 border-t border-line bg-paper/80 py-4 backdrop-blur-sm"
          style={{ "animation-delay": "680ms" }}
        >
          <div class="flex overflow-hidden" aria-hidden="true">
            <div class="animate-marquee flex shrink-0 items-center gap-8 pr-8 whitespace-nowrap">
              <For each={[...marqueeWords, ...marqueeWords]}>
                {(word) => (
                  <span class="flex items-center gap-8 font-mono text-sm font-medium tracking-[0.25em] text-muted uppercase">
                    {word}
                    <span class="text-beat">♪</span>
                  </span>
                )}
              </For>
            </div>
            <div class="animate-marquee flex shrink-0 items-center gap-8 pr-8 whitespace-nowrap">
              <For each={[...marqueeWords, ...marqueeWords]}>
                {(word) => (
                  <span class="flex items-center gap-8 font-mono text-sm font-medium tracking-[0.25em] text-muted uppercase">
                    {word}
                    <span class="text-beat">♪</span>
                  </span>
                )}
              </For>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default App;
