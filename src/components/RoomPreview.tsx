import { useNavigate } from "@solidjs/router";
import { Component, For } from "solid-js";
import type { RoomSnapshot } from "../store/roomsStore";

interface RoomPreviewProps {
  room: RoomSnapshot;
}

const RoomPreview: Component<RoomPreviewProps> = (props) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live":
        return "bg-green-500/20 text-green-400 border border-green-500/30";
      case "scheduled":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      case "completed":
        return "bg-neutral-700/50 text-neutral-400 border border-neutral-600";
      default:
        return "bg-neutral-700/50 text-neutral-400 border border-neutral-600";
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

  const categoryColors = [
    "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "bg-green-500/20 text-green-400 border-green-500/30",
    "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "bg-pink-500/20 text-pink-400 border-pink-500/30",
    "bg-teal-500/20 text-teal-400 border-teal-500/30",
  ];

  return (
    <div class="group relative">
      {/* Glow layer - shows on hover */}
      <div class="pointer-events-none absolute -inset-2 rounded-3xl bg-red-500/40 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60" />
      <article
        class="relative z-10 cursor-pointer rounded-2xl border border-neutral-600/60 bg-neutral-900/80 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 group-hover:border-red-500/30 group-hover:shadow-lg"
        onClick={() => navigate(`/rooms/${props.room.id}/play`)}
      >
        {/* Subtle gradient overlay on hover */}
        <div class="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.03),transparent_50%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div class="relative">
          <div class="mb-3 flex items-start justify-between">
            <h2 class="text-lg font-semibold text-neutral-100">
              {props.room.roomName}
            </h2>
            <span
              class={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(props.room.status)}`}
            >
              {getStatusLabel(props.room.status)}
            </span>
          </div>
          <div class="space-y-2 text-sm text-neutral-400">
            <p>
              <span class="font-medium text-neutral-300">Host:</span>{" "}
              {props.room.hostName}
            </p>
            {/* <p>
              <span class="font-medium text-neutral-300">Deltakere:</span>{" "}
              {props.room.participants}
            </p> */}
            {props.room.categories.length > 0 && (
              <p>
                <span class="font-medium text-neutral-300">Kategorier:</span>{" "}
                {props.room.categories.length}
              </p>
            )}
            {props.room.createdAt && (
              <p>
                <span class="font-medium text-neutral-300">Opprettet:</span>{" "}
                {new Date(props.room.createdAt).toLocaleString("no-NO", {
                  dateStyle: "short",
                })}
              </p>
            )}
          </div>
          {props.room.categories.length > 0 && props.room.showCategories && (
            <div class="mt-3 flex flex-wrap gap-1.5">
              <For each={props.room.categories.slice(0, 6)}>
                {(category, index) => (
                  <span
                    class={`rounded-md border px-2 py-0.5 text-xs font-medium ${
                      categoryColors[index() % categoryColors.length]
                    }`}
                  >
                    {category.name}
                  </span>
                )}
              </For>
            </div>
          )}
        </div>
      </article>
    </div>
  );
};

export default RoomPreview;
