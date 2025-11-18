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

  const categoryColors = [
    "bg-blue-100 text-blue-700 border-blue-200",
    "bg-purple-100 text-purple-700 border-purple-200",
    "bg-green-100 text-green-700 border-green-200",
    "bg-orange-100 text-orange-700 border-orange-200",
    "bg-pink-100 text-pink-700 border-pink-200",
    "bg-teal-100 text-teal-700 border-teal-200",
  ];

  return (
    <article
      class="group cursor-pointer rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
      onClick={() => navigate(`/rooms/${props.room.id}`)}
    >
      <div class="mb-3 flex items-start justify-between">
        <h2 class="text-lg font-semibold text-neutral-900 group-hover:text-neutral-700">
          {props.room.name}
        </h2>
        <span
          class={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(props.room.status)}`}
        >
          {getStatusLabel(props.room.status)}
        </span>
      </div>
      <div class="space-y-2 text-sm text-neutral-500">
        <p>
          <span class="font-medium text-neutral-700">Vert:</span>{" "}
          {props.room.hostName}
        </p>
        <p>
          <span class="font-medium text-neutral-700">Deltakere:</span>{" "}
          {props.room.participants}
        </p>
        {props.room.categories.length > 0 && (
          <p>
            <span class="font-medium text-neutral-700">Kategorier:</span>{" "}
            {props.room.categories.length}
          </p>
        )}
        {props.room.createdAt && (
          <p>
            <span class="font-medium text-neutral-700">Opprettet:</span>{" "}
            {new Date(props.room.createdAt).toLocaleString("no-NO", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </p>
        )}
      </div>
      {props.room.categories.length > 0 && (
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
    </article>
  );
};

export default RoomPreview;
