import type { Component } from "solid-js";
import Logo from "../../components/Logo";

const Dashboard: Component = () => {
  return (
    <div class="min-h-screen bg-[#f4f6f8] text-neutral-900">
      <header class="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div class="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <div class="flex items-center gap-3">
            <Logo class="h-8 w-auto" />
          </div>
          <nav class="flex items-center gap-5 text-sm font-medium text-neutral-600">
            <a class="hover:text-neutral-900" href="#overview">
              Oversikt
            </a>
            <a class="hover:text-neutral-900" href="#rooms">
              Rom
            </a>
            <a class="hover:text-neutral-900" href="#analytics">
              Analyse
            </a>
          </nav>
        </div>
      </header>

      <main class="mx-auto w-full max-w-6xl px-6 py-12">
        <section id="overview" class="mb-12 flex sm:flex-row flex-col sm:items-center items-start justify-between gap-4">
          <div>
          <h1 class="text-3xl font-semibold text-neutral-900">Dashbord</h1>
          <p class="mt-2 max-w-2xl text-sm text-neutral-500">
            Administrer spillets rom, hold styr på deltakere, og finjuster pulsen for
            din neste økt.
          </p>
          </div>

          <button type="button" class="inline-flex items-center justify-center rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700">
            Lag et nytt rom +
          </button>
        </section>

        <section
          id="rooms"
          class="grid gap-6 lg:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]"
        >
          <article class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-neutral-900">Aktive rom</h2>
            <p class="mt-2 text-sm text-neutral-500">Følg levende sesjoner og deltakere.</p>
            <button
              type="button"
              class="mt-6 inline-flex items-center justify-center rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700"
            >
              Administrer rom
            </button>
          </article>

          <article class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-neutral-900">Planlagte arrangementer</h2>
            <p class="mt-2 text-sm text-neutral-500">
              Planlegg kommende runder, og inviter nye deltakere.
            </p>
            <button
              type="button"
              class="mt-6 inline-flex items-center justify-center rounded-full border border-neutral-900/30 px-5 py-2 text-sm font-semibold text-neutral-800 transition hover:border-neutral-900 hover:text-neutral-900"
            >
              Opret nyt event
            </button>
          </article>

          <article class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-neutral-900">Statistikk</h2>
            <p class="mt-2 text-sm text-neutral-500">
              Få innblikk i engasjement og prestasjon fra tidligere runder.
            </p>
            <button
              type="button"
              class="mt-6 inline-flex items-center justify-center rounded-full border border-neutral-900/30 px-5 py-2 text-sm font-semibold text-neutral-800 transition hover:border-neutral-900 hover:text-neutral-900"
            >
              Se analyser
            </button>
          </article>
        </section>

        <section id="analytics" class="mt-12 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-neutral-900">Seneste aktivitet</h2>
          <ul class="mt-4 space-y-3 text-sm text-neutral-600">
            <li>• Beat Battle «Nord Pulse» ble avsluttet for 18 minutter siden.</li>
            <li>• «Team Echo» planla en ny sesjon til fredag kl. 20:00.</li>
            <li>• 4 nye spillere sluttet seg til fellesskapet i dag.</li>
          </ul>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
