import { useNavigate, useParams } from "@solidjs/router";
import { Show, type Component } from "solid-js";
import { useRoom } from "../../hooks/useRoom";

const RoomView: Component = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { room: currentRoom, isLoading } = useRoom(() => params.id);

  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800"
      : "bg-neutral-100 text-neutral-600";
  };

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? "Live" : "Ikke aktiv";
  };

  return (
    <div class="mx-auto w-full max-w-6xl px-6 py-12">
      <Show when={isLoading()}>
        <div class="flex items-center justify-center py-24">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-900" />
        </div>
      </Show>

      <Show when={!isLoading() && !currentRoom()}>
        <div class="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p class="text-red-700">Rom ikke funnet</p>
          <button
            class="mt-4 text-sm text-neutral-600 hover:text-neutral-900"
            onClick={() => navigate("/rooms")}
          >
            ← Tilbake til alle rom
          </button>
        </div>
      </Show>

      <Show when={!isLoading() && currentRoom()} keyed>
        {(room) => (
          <div class="flex w-full flex-col">
            <button
              class="mb-6 inline-flex items-center gap-2 self-start text-sm font-medium text-neutral-600 hover:text-neutral-900"
              onClick={() => navigate("/dashboard")}
            >
              ← Tilbake til dashboard
            </button>
            <div class="mb-8 flex items-start justify-between">
              <div>
                <h1 class="text-3xl font-semibold text-neutral-900">
                  {room.roomName}
                </h1>
                <p class="mt-2 text-sm text-neutral-500">
                  Administrer rominnstillinger og deltakere.
                </p>
              </div>
              <span
                class={`rounded-full px-3 py-1 text-sm font-medium ${getStatusBadge(room.isActive)}`}
              >
                {getStatusLabel(room.isActive)}
              </span>
            </div>

            <div class="grid gap-6 lg:grid-cols-2">
              <section class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 class="mb-4 text-lg font-semibold text-neutral-900">
                  Rominformasjon
                </h2>
                <dl class="space-y-3 text-sm">
                  <div>
                    <dt class="font-medium text-neutral-700">Host</dt>
                    <dd class="mt-1 text-neutral-500">{room.hostName}</dd>
                  </div>
                  <div>
                    <dt class="font-medium text-neutral-700">
                      Antall kategorier
                    </dt>
                    <dd class="mt-1 text-neutral-500">
                      {room.categories.length}
                    </dd>
                  </div>
                  <div>
                    <dt class="font-medium text-neutral-700">Opprettet</dt>
                    <dd class="mt-1 text-neutral-500">
                      {room.createdAt instanceof Date
                        ? room.createdAt.toLocaleString("no-NO", {
                            dateStyle: "short",
                          })
                        : new Date(room.createdAt).toLocaleString("no-NO", {
                            dateStyle: "short",
                          })}
                    </dd>
                  </div>
                </dl>
              </section>

              <section class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 class="mb-2 text-lg font-semibold text-neutral-900">
                  Handlinger
                </h2>
                <p class="mb-4 text-sm text-neutral-600">
                  Del lenken:{" "}
                  <code class="rounded bg-neutral-100 px-2 py-1 text-xs">
                    /rooms/{room.id}/play
                  </code>
                </p>
                <div class="flex flex-col gap-3">
                  <button
                    class="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700"
                    onClick={() => navigate("play")}
                  >
                    Start
                  </button>
                  <button
                    class="w-full rounded-lg border-2 border-blue-600 px-4 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/rooms/${room.id}/play`;
                      navigator.clipboard.writeText(shareUrl);
                      alert(
                        "Lenke kopiert! Del denne med spillere: " + shareUrl
                      );
                    }}
                  >
                    Kopier spillerlenke
                  </button>
                  <button class="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400">
                    Rediger innstillinger
                  </button>
                  <button class="w-full rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:border-red-400 hover:bg-red-50">
                    Slett rom
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}
      </Show>
    </div>
  );
};

export default RoomView;
