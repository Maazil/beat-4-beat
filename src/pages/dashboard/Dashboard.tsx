import { useNavigate } from "@solidjs/router";
import { createSignal, For, onMount, Show, type Component } from "solid-js";
import RoomManageCard from "../../components/RoomManageCard";
import { useMyRooms } from "../../hooks/useMyRooms";
import { deleteRoom } from "../../services/roomsService";
import {
  handleSpotifyCallback,
  isSpotifyLoggedIn,
  loginWithSpotify,
  logoutSpotify,
} from "../../lib/spotify";

const Dashboard: Component = () => {
  const navigate = useNavigate();
  const { rooms: myRooms, isLoading, error } = useMyRooms();
  const [spotifyConnected, setSpotifyConnected] = createSignal(false);

  onMount(async () => {
    // Handle Spotify redirect callback if returning from auth flow
    const handled = await handleSpotifyCallback();
    if (handled) {
      setSpotifyConnected(true);
      return;
    }
    setSpotifyConnected(isSpotifyLoggedIn());
  });

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await deleteRoom(roomId);
      // The subscription will automatically update the list
    } catch (err) {
      console.error("Failed to delete room:", err);
      alert("Could not delete the room. Please try again.");
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
            <h1 class="font-display text-3xl font-bold tracking-tight text-ink">Dashboard</h1>
            <p class="mt-2 max-w-2xl text-sm text-muted">
              Manage your game rooms, keep track of players, and fine-tune the beat for your next
              session.
            </p>
          </div>

          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-full bg-beat px-5 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_var(--color-ink)] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-beat-deep hover:shadow-[4px_4px_0_var(--color-ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            onClick={() => navigate("create")}
          >
            New room
            <span class="text-base leading-none">+</span>
          </button>
        </section>

        {/* My Rooms Section */}
        <section id="my-rooms" class="mb-12">
          <h2 class="font-display mb-4 text-xl font-bold text-ink">My rooms</h2>

          {error() && (
            <div class="mb-4 rounded-xl border border-beat/30 bg-beat-soft p-4 text-beat-deep">
              {error()}
            </div>
          )}

          {isLoading() ? (
            <div class="flex items-center justify-center py-12">
              <div class="h-8 w-8 animate-spin rounded-full border-4 border-line border-t-beat" />
            </div>
          ) : (
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <For
                each={myRooms()}
                fallback={
                  <div class="col-span-full rounded-2xl border border-dashed border-line bg-paper/60 p-8 text-center">
                    <p class="text-muted">
                      You don't have any rooms yet.{" "}
                      <button
                        type="button"
                        class="font-semibold text-beat underline hover:no-underline"
                        onClick={() => navigate("create")}
                      >
                        Create your first room
                      </button>
                    </p>
                  </div>
                }
              >
                {(room) => <RoomManageCard room={room} onDelete={handleDeleteRoom} />}
              </For>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section
          id="quick-actions"
          class="grid gap-6 lg:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]"
        >
          <article class="rounded-2xl border border-line bg-paper p-6 shadow-sm">
            <h2 class="font-display text-lg font-bold text-ink">Spotify</h2>
            <p class="mt-2 text-sm text-muted">
              Connect your Spotify Premium account to play music directly in the browser during the
              game.
            </p>
            <Show
              when={spotifyConnected()}
              fallback={
                <button
                  type="button"
                  class="mt-6 inline-flex items-center justify-center rounded-full bg-spotify px-5 py-2 text-sm font-bold text-white shadow-[3px_3px_0_var(--color-ink)] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[4px_4px_0_var(--color-ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  onClick={() => loginWithSpotify()}
                >
                  Connect Spotify
                </button>
              }
            >
              <div class="mt-6 flex items-center gap-3">
                <span class="inline-block h-2.5 w-2.5 rounded-full bg-spotify" />
                <span class="text-sm font-semibold text-ink">Spotify connected</span>
                <button
                  type="button"
                  class="ml-auto text-sm text-muted transition hover:text-beat"
                  onClick={() => {
                    logoutSpotify();
                    setSpotifyConnected(false);
                  }}
                >
                  Disconnect
                </button>
              </div>
            </Show>
          </article>

          <article class="rounded-2xl border border-line bg-paper p-6 shadow-sm">
            <h2 class="font-display text-lg font-bold text-ink">Marketplace</h2>
            <p class="mt-2 text-sm text-muted">
              Explore public rooms made by other players and jump into a session.
            </p>
            <button
              type="button"
              class="mt-6 inline-flex items-center justify-center rounded-full border-2 border-line bg-cream px-5 py-2 text-sm font-semibold text-ink transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-ink hover:shadow-[3px_3px_0_var(--color-ink)] active:translate-x-0 active:translate-y-0 active:shadow-none"
              onClick={() => navigate("/market")}
            >
              Explore rooms
            </button>
          </article>
        </section>
      </main>
    </>
  );
};

export default Dashboard;
