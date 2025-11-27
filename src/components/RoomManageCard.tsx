import { useNavigate } from "@solidjs/router";
import { Component, createSignal } from "solid-js";
import type { RoomSnapshot } from "../store/roomsStore";

interface RoomManageCardProps {
  room: RoomSnapshot;
  onDelete?: (roomId: string) => void;
}

const RoomManageCard: Component<RoomManageCardProps> = (props) => {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live":
        return "bg-green-100 text-green-700 border border-green-200";
      case "scheduled":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      case "completed":
        return "bg-neutral-100 text-neutral-600 border border-neutral-200";
      default:
        return "bg-neutral-100 text-neutral-600 border border-neutral-200";
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

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/rooms/${props.room.id}/play`;
    navigator.clipboard.writeText(shareUrl);
    alert("Lenke kopiert! Del denne med spillere: " + shareUrl);
  };

  const handleDelete = () => {
    if (props.onDelete) {
      props.onDelete(props.room.id);
    }
    setShowDeleteConfirm(false);
  };

  return (
    <article class="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      {/* Header */}
      <div class="mb-3 flex items-start justify-between">
        <h3 class="text-lg font-semibold text-neutral-900">
          {props.room.roomName}
        </h3>
        <span
          class={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(props.room.status)}`}
        >
          {getStatusLabel(props.room.status)}
        </span>
      </div>

      {/* Info */}
      <div class="mb-4 space-y-1 text-sm text-neutral-500">
        <p>
          <span class="font-medium text-neutral-700">Kategorier:</span>{" "}
          {props.room.categories.length}
        </p>
        {props.room.createdAt && (
          <p>
            <span class="font-medium text-neutral-700">Opprettet:</span>{" "}
            {new Date(props.room.createdAt).toLocaleString("no-NO", {
              dateStyle: "short",
            })}
          </p>
        )}
      </div>

      {/* Actions */}
      {showDeleteConfirm() ? (
        <div class="rounded-lg border border-red-200 bg-red-50 p-3">
          <p class="mb-3 text-sm text-red-700">
            Er du sikker på at du vil slette dette rommet?
          </p>
          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
              onClick={handleDelete}
            >
              Ja, slett
            </button>
            <button
              type="button"
              class="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Avbryt
            </button>
          </div>
        </div>
      ) : (
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="flex-1 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
            onClick={() => navigate(`/rooms/${props.room.id}/play`)}
          >
            Start
          </button>
          <button
            type="button"
            class="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50"
            onClick={handleCopyLink}
            title="Kopier spillerlenke"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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
            class="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50"
            onClick={() => navigate(`/dashboard/create?edit=${props.room.id}`)}
            title="Rediger rom"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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
            class="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50"
            onClick={() => setShowDeleteConfirm(true)}
            title="Slett rom"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      )}
    </article>
  );
};

export default RoomManageCard;
