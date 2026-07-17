import { useNavigate, useParams } from "@solidjs/router";
import { Show, type Component } from "solid-js";
import Button from "../../components/forms/Button";
import RoomStatusBadge from "../../components/RoomStatusBadge";
import { useRoom } from "../../hooks/useRoom";
import { formatRoomDate } from "../../lib/roomDates";
import { formatNameList, roomHostNames } from "../../lib/roomHosts";
import { canEditRoom, deleteRoom, isRoomHost } from "../../services/roomsService";

const RoomView: Component = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { room: currentRoom, isLoading } = useRoom(() => params.id);

  const handleDelete = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    try {
      await deleteRoom(roomId);
      navigate("/dashboard");
    } catch (err) {
      console.error("Failed to delete room:", err);
      alert("Could not delete the room. Please try again.");
    }
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
              <RoomStatusBadge active={room.isActive} />
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
                    <dd class="mt-1 text-muted">{formatRoomDate(room.createdAt)}</dd>
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
                  <Button class="w-full" onClick={() => navigate("play")}>
                    Start
                  </Button>
                  <Button
                    variant="secondary"
                    class="w-full"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/rooms/${room.id}/play`;
                      navigator.clipboard.writeText(shareUrl);
                      alert("Link copied! Share it with players: " + shareUrl);
                    }}
                  >
                    Copy player link
                  </Button>
                  <Show when={canEditRoom(room)}>
                    <Button
                      variant="secondary"
                      class="w-full"
                      onClick={() => navigate(`/dashboard/create?edit=${room.id}`)}
                    >
                      Edit settings
                    </Button>
                  </Show>
                  <Show when={isRoomHost(room)}>
                    <Button
                      variant="destructive"
                      class="w-full"
                      onClick={() => void handleDelete(room.id)}
                    >
                      Delete room
                    </Button>
                  </Show>
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
