import { useNavigate } from "@solidjs/router";
import type { Component } from "solid-js";

const Dashboard: Component = () => {
  const navigate = useNavigate();
  return (
    <>
      <main class="mx-auto w-full max-w-6xl px-6 py-12">
        <section id="overview" class="mb-12 flex sm:flex-row flex-col sm:items-center items-start justify-between gap-4">
          <div>
          <h1 class="text-3xl font-semibold text-neutral-900">Dashbord</h1>
          <p class="mt-2 max-w-2xl text-sm text-neutral-500">
            Administrer spillets rom, hold styr på deltakere, og finjuster pulsen for
            din neste økt.
          </p>
          </div>

          <button type="button" class="inline-flex items-center justify-center rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700"
          onClick={() => navigate("create")}
          >
            Lag et nytt rom +
          </button>
        </section>

        <section
          id="rooms"
          class="grid gap-6 lg:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]"
        >
          <article class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-neutral-900">Mine rom</h2>
            <p class="mt-2 text-sm text-neutral-500">Følg levende sesjoner og deltakere.</p>
            <button
              type="button"
              class="hover:cursor-pointer mt-6 inline-flex items-center justify-center rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700"
            onClick={() => navigate("rooms")}
            >
              Se mine rom
            </button>
          </article>

          <article class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-neutral-900">Lag nytt rom</h2>
            <p class="mt-2 text-sm text-neutral-500">
              Lag ett nytt rom fra bunnen av for din neste Beat 4 Beat økt.
            </p>
            <button
              type="button"
              class="mt-6 inline-flex items-center justify-center rounded-full border border-neutral-900/30 px-5 py-2 text-sm font-semibold text-neutral-800 transition hover:border-neutral-900 hover:text-neutral-900"
              onClick={() => navigate("create")}
            >
              Opprett et nytt rom
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
    </>
  );
};

export default Dashboard;
