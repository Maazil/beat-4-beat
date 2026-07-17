import { useNavigate } from "@solidjs/router";
import { Component } from "solid-js";
import PublicRoomsGrid from "../../components/PublicRoomsGrid";

const Rooms: Component = () => {
  const navigate = useNavigate();

  return (
    <div class="mx-auto w-full max-w-6xl px-6 py-12">
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        class="mb-6 flex items-center gap-2 text-muted transition hover:cursor-pointer hover:text-beat"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        <span class="font-medium">Back to dashboard</span>
      </button>

      <h1 class="font-display mb-8 text-3xl font-bold tracking-tight text-ink">All rooms</h1>

      <PublicRoomsGrid />
    </div>
  );
};

export default Rooms;
