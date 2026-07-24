import { Component } from "solid-js";

interface RoomPlayNavProps {
  roomId: string | undefined;
}

/** Top bar for the play page: back button + read-only audience-view link. */
const RoomPlayNav: Component<RoomPlayNavProps> = (props) => {
  return (
    <div class="mb-6 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => window.history.back()}
        class="flex items-center gap-2 text-muted transition hover:text-beat"
      >
        <svg
          aria-hidden="true"
          class="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        <span class="font-medium">Back</span>
      </button>

      {/* Read-only spectator screen — open on a second display or share it */}
      <a
        href={`/rooms/${props.roomId}/watch`}
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-bold text-ink transition hover:border-beat hover:bg-beat-soft"
      >
        <svg
          aria-hidden="true"
          class="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        Audience view
      </a>
    </div>
  );
};

export default RoomPlayNav;
