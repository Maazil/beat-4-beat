import { useNavigate } from "@solidjs/router";
import { Component, For } from "solid-js";
import type { Room } from "../model/room";

interface RoomPreviewProps {
  room: Room;
}

const RoomPreview: Component<RoomPreviewProps> = (props) => {
  const navigate = useNavigate();

  // Derive status from isActive
  const getStatus = () => (props.room.isActive ? "live" : "inactive");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live":
        return "bg-beat-soft text-beat-deep border border-beat/20";
      default:
        return "bg-sand text-muted border border-line";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "live":
        return "Live";
      case "inactive":
        return "Inactive";
      default:
        return status;
    }
  };

  return (
    <article
      class="group cursor-pointer rounded-2xl border border-line bg-paper p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-beat/40 hover:shadow-[0_16px_36px_-20px_rgba(232,38,74,0.45)]"
      onClick={() => navigate(`/rooms/${props.room.id}/play`)}
    >
      <div class="mb-3 flex items-start justify-between gap-3">
        <h2 class="font-display text-lg font-bold text-ink transition group-hover:text-beat">
          {props.room.roomName}
        </h2>
        <span
          class={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(getStatus())}`}
        >
          {getStatusLabel(getStatus())}
        </span>
      </div>
      <div class="space-y-1 font-mono text-xs text-muted">
        <p>
          <span class="font-semibold text-ink">Host:</span> {props.room.hostName}
        </p>
        {props.room.categories.length > 0 && (
          <p>
            <span class="font-semibold text-ink">Categories:</span> {props.room.categories.length}
          </p>
        )}
        {props.room.createdAt && (
          <p>
            <span class="font-semibold text-ink">Created:</span>{" "}
            {new Date(props.room.createdAt).toLocaleString("en-GB", {
              dateStyle: "short",
            })}
          </p>
        )}
      </div>
      {props.room.categories.length > 0 && props.room.showCategories && (
        <div class="mt-4 flex flex-wrap gap-1.5">
          <For each={props.room.categories.slice(0, 6)}>
            {(category) => (
              <span class="rounded-full border border-line bg-cream px-2.5 py-0.5 text-xs font-medium text-muted">
                {category.name}
              </span>
            )}
          </For>
        </div>
      )}
      <p class="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-beat opacity-0 transition duration-300 group-hover:opacity-100">
        Play now
        <svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M5.333 3.556 10.667 8l-5.334 4.444"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </p>
    </article>
  );
};

export default RoomPreview;
