import { useNavigate, useParams } from "@solidjs/router";
import { Show, type Component } from "solid-js";
import { useRoom } from "../../hooks/useRoom";
import { formatNameList, roomHostNames } from "../../lib/roomHosts";

const RoomView: Component = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { room: currentRoom, isLoading } = useRoom(() => params.id);

  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? "bg-beat-soft text-beat-bright border border-beat/30"
      : "bg-surface-2 text-muted border border-line";
  };

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? "Live" : "Inactive";
  };

  return (
    <div class="mx-auto w-full max-w-6xl px-6 py-12">
      <Show when={isLoading()}>
        <div class="flex items-center justify-center py-24">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-line border-t-beat" />
        </div>
      </Show>

      <Show when={!isLoading() && !currentRoom()}>
        <div class="rounded-2xl border border-beat/30 bg-beat-soft p-8 text-center">
          <p class="text-beat-bright">Room not found</p>
          <button
            class="mt-4 text-sm text-muted hover:text-beat"
            onClick={() => navigate("/rooms")}
          >
            ← Back to all rooms
          </button>
        </div>
      </Show>

      <Show when={!isLoading() && currentRoom()} keyed>
        {(room) => (
          <div class="flex w-full flex-col">
            <button
              class="mb-6 inline-flex items-center gap-2 self-start text-sm font-medium text-muted transition hover:text-beat"
              onClick={() => navigate("/dashboard")}
            >
              ← Back to dashboard
            </button>
            <div class="mb-8 flex items-start justify-between gap-4">
              <div>
                <h1 class="font-display text-3xl font-bold tracking-tight text-ink">
                  {room.roomName}
                </h1>
                <p class="mt-2 text-sm text-muted">Manage room settings and players.</p>
              </div>
              <span
                class={`rounded-full px-3 py-1 font-mono text-xs ${getStatusBadge(room.isActive)}`}
              >
                {getStatusLabel(room.isActive)}
              </span>
            </div>

            <div class="grid gap-6 lg:grid-cols-2">
              <section class="rounded-2xl border border-line bg-surface p-6">
                <h2 class="font-display mb-4 text-lg font-bold text-ink">Room info</h2>
                <dl class="space-y-3 text-sm">
                  <div>
                    <dt class="font-semibold text-ink">
                      {roomHostNames(room).length > 1 ? "Hosts" : "Host"}
                    </dt>
                    <dd class="mt-1 text-muted">{formatNameList(roomHostNames(room))}</dd>
                  </div>
                  <div>
                    <dt class="font-semibold text-ink">Number of categories</dt>
                    <dd class="mt-1 text-muted">{room.categories.length}</dd>
                  </div>
                  <div>
                    <dt class="font-semibold text-ink">Created</dt>
                    <dd class="mt-1 text-muted">
                      {room.createdAt instanceof Date
                        ? room.createdAt.toLocaleString("en-GB", {
                            dateStyle: "short",
                          })
                        : new Date(room.createdAt).toLocaleString("en-GB", {
                            dateStyle: "short",
                          })}
                    </dd>
                  </div>
                </dl>
              </section>

              <section class="rounded-2xl border border-line bg-surface p-6">
                <h2 class="font-display mb-2 text-lg font-bold text-ink">Actions</h2>
                <p class="mb-4 text-sm text-muted">
                  Share the link:{" "}
                  <code class="rounded bg-surface-2 px-2 py-1 font-mono text-xs text-ink">
                    /rooms/{room.id}/play
                  </code>
                </p>
                <div class="flex flex-col gap-3">
                  <button
                    class="w-full rounded-full bg-beat px-4 py-2.5 text-sm font-bold text-night shadow-[0_8px_30px_rgba(234,196,53,0.28)] transition hover:bg-beat-bright"
                    onClick={() => navigate("play")}
                  >
                    Start
                  </button>
                  <button
                    class="w-full rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-beat hover:bg-beat-soft"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/rooms/${room.id}/play`;
                      navigator.clipboard.writeText(shareUrl);
                      alert("Link copied! Share it with players: " + shareUrl);
                    }}
                  >
                    Copy player link
                  </button>
                  <button class="w-full rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-beat hover:bg-beat-soft">
                    Edit settings
                  </button>
                  <button class="w-full rounded-full border border-magenta-hot/40 px-4 py-2.5 text-sm font-semibold text-magenta-hot transition hover:border-magenta-hot hover:bg-magenta-hot/10">
                    Delete room
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
