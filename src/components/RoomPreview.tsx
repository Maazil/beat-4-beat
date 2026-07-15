import { useNavigate } from "@solidjs/router";
import { Component, createSignal, For, Show } from "solid-js";
import { useAuth } from "../context/AuthContext";
import { formatNameList, roomHostNames } from "../lib/roomHosts";
import type { Room } from "../model/room";
import { duplicateRoom } from "../services/roomsService";
import { stageInk } from "../theme/palette";

interface RoomPreviewProps {
  room: Room;
}

const RoomPreview: Component<RoomPreviewProps> = (props) => {
  const navigate = useNavigate();
  const auth = useAuth();

  const hostNames = () => roomHostNames(props.room);

  const [saveState, setSaveState] = createSignal<"idle" | "saving" | "saved">("idle");

  const handleSave = async (e: MouseEvent) => {
    e.stopPropagation(); // the whole card navigates to play on click
    if (saveState() !== "idle") return;
    setSaveState("saving");
    try {
      await duplicateRoom(props.room.id);
      setSaveState("saved");
    } catch (err) {
      console.error("[RoomPreview] Save to my rooms failed:", err);
      alert("Could not save the room. Please try again.");
      setSaveState("idle");
    }
  };

  // Derive status from isActive
  const getStatus = () => (props.room.isActive ? "live" : "inactive");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live":
        return "bg-beat-soft text-beat-bright border border-beat/30";
      default:
        return "bg-surface-2 text-muted border border-line";
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
      class="group cursor-pointer rounded-2xl border border-line bg-surface p-6 transition duration-300 hover:-translate-y-0.5 hover:border-beat hover:shadow-[0_8px_24px_rgba(234,196,53,0.18)]"
      onClick={() => navigate(`/rooms/${props.room.id}/play`)}
    >
      <div class="mb-3 flex items-start justify-between gap-3">
        <h2 class="font-display text-lg font-bold text-ink transition group-hover:text-beat">
          {props.room.roomName}
        </h2>
        <span
          class={`shrink-0 rounded-full px-2.5 py-0.5 font-mono text-xs ${getStatusBadge(getStatus())}`}
        >
          {getStatusLabel(getStatus())}
        </span>
      </div>
      <div class="space-y-1 font-mono text-xs text-muted">
        <p>
          <span class="font-semibold text-ink">{hostNames().length > 1 ? "Hosts:" : "Host:"}</span>{" "}
          {formatNameList(hostNames())}
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
            {(category, index) => {
              const ink = stageInk(index());
              return (
                <span
                  class="rounded-full border px-2.5 py-0.5 text-xs font-medium text-ink"
                  style={{ "background-color": ink.tint, "border-color": ink.ink }}
                >
                  {category.name}
                </span>
              );
            }}
          </For>
        </div>
      )}
      <div class="mt-5 flex items-center justify-between gap-3">
        <p class="inline-flex items-center gap-1.5 text-sm font-bold text-beat">
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
        <Show when={auth.isAuthenticated()}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saveState() !== "idle"}
            class={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              saveState() === "saved"
                ? "border-beat/30 bg-beat-soft text-beat-bright"
                : "border-line bg-surface-2 text-ink hover:border-beat hover:bg-beat-soft hover:text-beat disabled:opacity-60"
            }`}
          >
            {saveState() === "saved"
              ? "Saved to my rooms ✓"
              : saveState() === "saving"
                ? "Saving…"
                : "Save to my rooms"}
          </button>
        </Show>
      </div>
    </article>
  );
};

export default RoomPreview;
