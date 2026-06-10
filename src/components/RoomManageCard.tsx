import { useNavigate } from "@solidjs/router";
import { Component, createSignal, Show } from "solid-js";
import { useAuth } from "../context/AuthContext";
import type { Room } from "../model/room";

interface RoomManageCardProps {
  room: Room;
  onDelete?: (roomId: string) => void;
}

const RoomManageCard: Component<RoomManageCardProps> = (props) => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);

  const isHost = () => auth.isRoomHost(props.room.hostId);

  const statusBadge = () =>
    props.room.isActive
      ? "bg-beat-soft text-beat-deep border border-beat/20"
      : "bg-sand text-muted border border-line";

  const statusLabel = () => (props.room.isActive ? "Active" : "Inactive");

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/rooms/${props.room.id}/play`;
    navigator.clipboard.writeText(shareUrl);
    alert("Link copied! Share it with players: " + shareUrl);
  };

  const handleDelete = () => {
    if (props.onDelete) {
      props.onDelete(props.room.id);
    }
    setShowDeleteConfirm(false);
  };

  return (
    <article class="rounded-2xl border-2 border-line bg-paper p-5 transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-ink hover:shadow-[4px_4px_0_var(--color-ink)]">
      {/* Header */}
      <div class="mb-3 flex items-start justify-between">
        <div class="flex min-w-0 flex-wrap items-center gap-2">
          <h3 class="font-display text-lg font-bold text-ink">{props.room.roomName}</h3>
          <Show when={!isHost()}>
            <span class="rounded-full border border-line bg-cream px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-muted uppercase">
              Co-owner
            </span>
          </Show>
        </div>
        <span
          class={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wide uppercase ${statusBadge()}`}
        >
          {statusLabel()}
        </span>
      </div>

      {/* Info */}
      <div class="mb-4 space-y-1 font-mono text-xs text-muted">
        <p>
          <span class="font-semibold text-ink">Categories:</span> {props.room.categories.length}
        </p>
        {props.room.createdAt && (
          <p>
            <span class="font-semibold text-ink">Created:</span>{" "}
            {new Date(props.room.createdAt).toLocaleString("en-GB", {
              dateStyle: "short",
            })}
          </p>
        )}
      </div>

      {/* Actions */}
      {showDeleteConfirm() ? (
        <div class="rounded-xl border border-beat/30 bg-beat-soft p-3">
          <p class="mb-3 text-sm text-beat-deep">Are you sure you want to delete this room?</p>
          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 rounded-full bg-beat px-3 py-2 text-sm font-bold text-white transition hover:bg-beat-deep"
              onClick={handleDelete}
            >
              Yes, delete
            </button>
            <button
              type="button"
              class="flex-1 rounded-full border border-line bg-paper px-3 py-2 text-sm font-semibold text-ink transition hover:bg-sand"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="flex-1 rounded-full bg-beat px-3 py-2 text-sm font-bold text-white shadow-[2px_2px_0_var(--color-beat-deep)] transition hover:bg-beat-deep active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            onClick={() => navigate(`/rooms/${props.room.id}/play`)}
          >
            Start
          </button>
          <button
            type="button"
            class="rounded-full border border-line px-3 py-2 text-sm font-medium text-muted transition hover:border-beat hover:text-beat"
            onClick={handleCopyLink}
            title="Copy player link"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </button>
          <button
            type="button"
            class="rounded-full border border-line px-3 py-2 text-sm font-medium text-muted transition hover:border-beat hover:text-beat"
            onClick={() => navigate(`/dashboard/create?edit=${props.room.id}`)}
            title="Edit room"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <Show when={isHost()}>
            <button
              type="button"
              class="rounded-full border border-beat/30 px-3 py-2 text-sm font-medium text-beat transition hover:bg-beat-soft"
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete room"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </Show>
        </div>
      )}
    </article>
  );
};

export default RoomManageCard;
