import type { Component } from 'solid-js';
import Logo from './components/Logo';
import RandomVisualizer from './components/RandomVisualizer';

const App: Component = () => {
  return (
    <main class="relative min-h-screen overflow-hidden bg-ambient text-neutral-100">
      <div class="pointer-events-none absolute inset-0">
        <div class="animate-ambient-float absolute -left-28 top-24 h-72 w-72 rounded-full bg-red-500/25 blur-[120px]" />
        <div class="animate-ambient-float absolute -right-24 bottom-24 h-80 w-80 rounded-full bg-red-700/15 blur-[140px]" />
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,48,64,0.12)_0,rgba(10,10,14,0)_70%)]" />
        <div class="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,25,70,0.08)_0%,rgba(9,9,13,0)_40%,rgba(255,25,70,0.06)_75%,rgba(9,9,13,0)_100%)]" />
        <div class="absolute left-0 top-0 h-full w-full bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[0.5px_32px] opacity-30" />
      </div>

      <div class="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-6 py-20 pt-7 sm:pt-20">
        <header class="mb-16 flex items-center gap-4 text-neutral-300 sm:gap-6">
          <Logo class="h-10 w-auto text-red-400" />
          {/* <span class="text-xs uppercase tracking-[0.55em] text-neutral-500 sm:text-sm">
            Beat 4 Beat
          </span> */}
        </header>

        <section class="flex w-full max-w-3xl flex-col items-center gap-12 text-center">
          <div class="beat-circle w-72 max-w-[80vw] sm:w-80">
            <div class="beat-circle-inner flex aspect-square w-full items-center justify-center">
              <div class="flex flex-col items-center gap-4 text-4xl font-semibold uppercase tracking-[0.35em] text-red-400 sm:text-5xl">
                <span class="beat-word">Beat</span>
                <span class="beat-word">4</span>
                <span class="beat-word">Beat</span>
              </div>
            </div>
          </div>

          <RandomVisualizer class="mt-4" />

          <p class="max-w-[46ch] text-pretty text-base text-neutral-400 sm:text-lg">
            Hvor rytme møter reaksjon. Beat 4 Beat er den sosiale lydlege, hvor du dyster i takt,
            timing og nerves styrke. Trå inn i pulsen, og merk slagene før alle andre.
          </p>

          <button
            type="button"
            class="group relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-red-500/60 bg-red-500/10 px-9 py-3 text-sm font-semibold uppercase tracking-[0.5em] text-red-300 transition duration-300 hover:border-red-400/80 hover:bg-red-500/15 hover:text-red-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-500 hover:cursor-pointer"
          >
            <span>Start spillet</span>
            <span class="relative flex h-6 w-6 items-center justify-center rounded-full bg-red-500/60 text-neutral-950 transition duration-300 group-hover:bg-red-400/90">
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
        </section>
      </div>
    </main>
  );
};

export default App;
