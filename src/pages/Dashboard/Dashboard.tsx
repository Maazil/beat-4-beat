import { useNavigate } from "@solidjs/router";
import {
  createEffect,
  createSignal,
  For,
  onCleanup,
  type Component,
} from "solid-js";
import RoomManageCard from "../../components/RoomManageCard";
import { useAuth } from "../../context/AuthContext";
import type { Room } from "../../model/room";
import { deleteRoom, subscribeToMyRooms } from "../../services/roomsService";
import type { RoomSnapshot } from "../../store/roomsStore";

const Dashboard: Component = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [myRooms, setMyRooms] = createSignal<RoomSnapshot[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  // Convert Room from Firestore to RoomSnapshot for the UI
  const roomToSnapshot = (room: Room): RoomSnapshot => ({
    ...room,
    status: room.isActive ? "live" : "scheduled",
    participants: 0, // Could be fetched from a subcollection later
  });

  // Wait for auth to be ready, then subscribe to rooms
  createEffect(() => {
    // Don't do anything while auth is still loading
    if (auth.state.isLoading) return;

    // If not authenticated, don't try to fetch
    if (!auth.isAuthenticated()) {
      setIsLoading(false);
      return;
    }

    try {
      const unsubscribe = subscribeToMyRooms((rooms) => {
        setMyRooms(rooms.map(roomToSnapshot));
        setIsLoading(false);
        setError(null);
      });

      onCleanup(() => unsubscribe());
    } catch (_err) {
      setError("Kunne ikke hente rom. Prøv igjen senere.");
      setIsLoading(false);
    }
  });

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await deleteRoom(roomId);
      // The subscription will automatically update the list
    } catch (err) {
      console.error("Failed to delete room:", err);
      alert("Kunne ikke slette rommet. Prøv igjen.");
    }
  };

  return (
    <>
      <main class="mx-auto w-full max-w-6xl px-6 py-12">
        <section
          id="overview"
          class="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
        >
          <div>
            <h1 class="text-3xl font-semibold text-neutral-900">Dashbord</h1>
            <p class="mt-2 max-w-2xl text-sm text-neutral-500">
              Administrer spillets rom, hold styr på deltakere, og finjuster
              pulsen for din neste økt.
            </p>
          </div>

          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700"
            onClick={() => navigate("create")}
          >
            Lag et nytt rom +
          </button>
        </section>

        {/* My Rooms Section */}
        <section id="my-rooms" class="mb-12">
          <h2 class="mb-4 text-xl font-semibold text-neutral-900">Mine rom</h2>

          {error() && (
            <div class="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {error()}
            </div>
          )}

          {isLoading() || auth.state.isLoading ? (
            <div class="flex items-center justify-center py-12">
              <div class="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-900" />
            </div>
          ) : (
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <For
                each={myRooms()}
                fallback={
                  <div class="col-span-full rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
                    <p class="text-neutral-500">
                      Du har ingen rom ennå.{" "}
                      <button
                        type="button"
                        class="font-medium text-neutral-900 underline hover:no-underline"
                        onClick={() => navigate("create")}
                      >
                        Opprett ditt første rom
                      </button>
                    </p>
                  </div>
                }
              >
                {(room) => (
                  <RoomManageCard room={room} onDelete={handleDeleteRoom} />
                )}
              </For>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section
          id="quick-actions"
          class="grid gap-6 lg:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]"
        >
          <article class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-neutral-900">Lag nytt rom</h2>
            <p class="mt-2 text-sm text-neutral-500">
              Lag ett nytt rom fra bunnen av for din neste Beat 4 Beat økt.
            </p>
            <button
              type="button"
              class="mt-6 inline-flex items-center justify-center rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:cursor-pointer hover:bg-neutral-700"
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

        <section
          id="analytics"
          class="mt-12 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
        >
          <h2 class="text-lg font-semibold text-neutral-900">
            Seneste aktivitet
          </h2>
          <ul class="mt-4 space-y-3 text-sm text-neutral-600">
            <li>
              • Beat Battle «Nord Pulse» ble avsluttet for 18 minutter siden.
            </li>
            <li>• «Team Echo» planla en ny sesjon til fredag kl. 20:00.</li>
            <li>• 4 nye spillere sluttet seg til fellesskapet i dag.</li>
          </ul>
        </section>
      </main>
    </>
  );
};

export default Dashboard;
