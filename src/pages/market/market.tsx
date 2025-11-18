import { Component, For } from "solid-js";
import RoomPreview from "../../components/RoomPreview";
import { rooms } from "../../store/roomsStore";

const Market: Component = () => {
  return (
    <div class="mx-auto max-w-6xl p-6 py-12">
      <div class="mb-8">
        <h1 class="text-3xl font-semibold text-neutral-900">Market</h1>
        <p class="mt-2 text-neutral-600">Browse and join available rooms</p>
      </div>

      <div class="grid gap-6 lg:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
        <For each={rooms}>{(room) => <RoomPreview room={room} />}</For>
      </div>
    </div>
  );
};

export default Market;
