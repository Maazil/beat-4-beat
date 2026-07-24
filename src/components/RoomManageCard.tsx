import { useNavigate } from "@solidjs/router";
import { Component, createSignal, Show } from "solid-js";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useClipboardCopy } from "../hooks/useClipboardCopy";
import { formatRoomDate } from "../lib/roomDates";
import { playerShareUrl } from "../lib/roomLinks";
import type { Room } from "../model/room";
import { duplicateRoom } from "../services/roomsService";
import RoomStatusBadge from "./RoomStatusBadge";

interface RoomManageCardProps {
  room: Room;
  onDelete?: (roomId: string) => void;
}

const RoomManageCard: Component<RoomManageCardProps> = (props) => {
  const navigate = useNavigate();
  const auth = useAuth();
  const toast = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);
  const [isDuplicating, setIsDuplicating] = createSignal(false);

  // The copy shows up on the dashboard by itself via the my-rooms subscription
  const handleDuplicate = async () => {
    if (isDuplicating()) return;
    setIsDuplicating(true);
    try {
      await duplicateRoom(props.room.id);
    } catch (err) {
      console.error("[RoomManageCard] Duplicate failed:", err);
      toast.error("Could not duplicate the room. Please try again.");
    } finally {
      setIsDuplicating(false);
    }
  };

  const isHost = () => auth.isRoomHost(props.room.hostId);

  const { status: copyStatus, copy } = useClipboardCopy();
  const handleCopyLink = () => copy(playerShareUrl(props.room.id));

  /** Icon-only button, so the outcome has to ride on the name + tooltip. */
  const copyLabel = () => {
    switch (copyStatus()) {
      case "copied":
        return "Player link copied";
      case "failed":
        return "Couldn't copy the player link";
      default:
        return "Copy player link";
    }
  };

  const handleDelete = () => {
    if (props.onDelete) {
      props.onDelete(props.room.id);
    }
    setShowDeleteConfirm(false);
  };

  return (
    <article class="rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-beat/40">
      {/* Header */}
      <div class="mb-3 flex items-start justify-between">
        <div class="flex min-w-0 flex-wrap items-center gap-2">
          <h3 class="font-display text-lg font-bold text-ink">{props.room.roomName}</h3>
          <Show when={!isHost()}>
            <span class="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-muted uppercase">
              Co-owner
            </span>
          </Show>
        </div>
        <RoomStatusBadge active={props.room.isActive} />
      </div>

      {/* Info */}
      <div class="mb-4 space-y-1 font-mono text-xs text-muted">
        <p>
          <span class="font-semibold text-ink">Categories:</span> {props.room.categories.length}
        </p>
        {props.room.createdAt && (
          <p>
            <span class="font-semibold text-ink">Created:</span>{" "}
            {formatRoomDate(props.room.createdAt)}
          </p>
        )}
      </div>

      {/* Actions */}
      {showDeleteConfirm() ? (
        <div class="rounded-xl border border-magenta-hot/40 bg-magenta-hot/10 p-3">
          <p class="mb-3 text-sm text-ink">Are you sure you want to delete this room?</p>
          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 rounded-full bg-magenta-hot px-3 py-2 text-sm font-bold text-ink transition hover:brightness-110"
              onClick={handleDelete}
            >
              Yes, delete
            </button>
            <button
              type="button"
              class="flex-1 rounded-full border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink transition hover:bg-surface-2"
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
            class="flex-1 rounded-full bg-beat px-3 py-2 text-sm font-bold text-night transition hover:bg-beat-bright"
            onClick={() => navigate(`/rooms/${props.room.id}/play`)}
          >
            Start
          </button>
          <button
            type="button"
            class="rounded-full border px-3 py-2 text-sm font-medium transition"
            classList={{
              "border-beat text-beat": copyStatus() === "copied",
              "border-magenta-hot text-magenta-hot": copyStatus() === "failed",
              "border-line text-muted hover:border-beat hover:text-beat": copyStatus() === "idle",
            }}
            onClick={handleCopyLink}
            title={copyLabel()}
            aria-label={copyLabel()}
          >
            <Show
              when={copyStatus() === "copied"}
              fallback={
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              }
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </Show>
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
          <button
            type="button"
            class="rounded-full border border-line px-3 py-2 text-sm font-medium text-muted transition hover:border-beat hover:text-beat disabled:opacity-50"
            onClick={handleDuplicate}
            disabled={isDuplicating()}
            title="Duplicate room"
          >
            <svg
              class={`h-4 w-4 ${isDuplicating() ? "animate-pulse" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
          <Show when={isHost()}>
            <button
              type="button"
              class="rounded-full border border-magenta-hot/40 px-3 py-2 text-sm font-medium text-magenta-hot transition hover:border-magenta-hot hover:bg-magenta-hot/10"
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
