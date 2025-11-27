import { useNavigate, useParams } from "@solidjs/router";
import { Show, createMemo, type Component } from "solid-js";
import { rooms } from "../../store/roomsStore";

const Room: Component = () => {
  const params = useParams();
  const navigate = useNavigate();

  const currentRoom = createMemo(() => rooms.find((r) => r.id === params.id));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-neutral-100 text-neutral-600";
      default:
        return "bg-neutral-100 text-neutral-600";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "live":
        return "Live";
      case "scheduled":
        return "Planlagt";
      case "completed":
        return "Fullført";
      default:
        return status;
    }
  };

  return (
    <div class="mx-auto w-full max-w-6xl px-6 py-12">
      <Show when={currentRoom()} keyed>
        {(room) => (
          <div class="flex w-full flex-col">
            <button
              class="mb-6 inline-flex items-center gap-2 self-start text-sm font-medium text-neutral-600 hover:text-neutral-900"
              onClick={() => navigate("/rooms")}
            >
              ← Tilbake til alle rom
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
                class={`rounded-full px-3 py-1 text-sm font-medium ${getStatusBadge(room.status)}`}
              >
                {getStatusLabel(room.status)}
              </span>
            </div>

            <div class="grid gap-6 lg:grid-cols-2">
              <section class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 class="mb-4 text-lg font-semibold text-neutral-900">
                  Rominformasjon
                </h2>
                <dl class="space-y-3 text-sm">
                  {/* <div>
                    <dt class="font-medium text-neutral-700">Rom ID</dt>
                    <dd class="text-neutral-500 mt-1">{room.id}</dd>
                  </div> */}
                  <div>
                    <dt class="font-medium text-neutral-700">Vertskap</dt>
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
                  {/* <div>
                    <dt class="font-medium text-neutral-700">Deltakere</dt>
                    <dd class="text-neutral-500 mt-1">{room.participants}</dd>
                  </div> */}
                  {room.startsAt && (
                    <div>
                      <dt class="font-medium text-neutral-700">
                        Starttidspunkt
                      </dt>
                      <dd class="mt-1 text-neutral-500">
                        {new Date(room.startsAt).toLocaleString("no-NO", {
                          dateStyle: "full",
                        })}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt class="font-medium text-neutral-700">Opprettet</dt>
                    <dd class="mt-1 text-neutral-500">
                      {new Date(room.createdAt).toLocaleString("no-NO", {
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
                    /play/{room.id}
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
                      const shareUrl = `${window.location.origin}/play/${room.id}`;
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

export default Room;
