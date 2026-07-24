import { Component } from "solid-js";
import BackLink from "../../components/BackLink";
import PublicRoomsGrid from "../../components/PublicRoomsGrid";

const Rooms: Component = () => {
  return (
    <div class="mx-auto w-full max-w-6xl px-6 py-12">
      <BackLink href="/dashboard" label="Back to dashboard" class="mb-6" />

      <h1 class="font-display mb-8 text-3xl font-bold tracking-tight text-ink">All rooms</h1>

      <PublicRoomsGrid />
    </div>
  );
};

export default Rooms;
