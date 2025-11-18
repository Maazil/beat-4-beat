import { Component, For } from "solid-js";
import RoomPreview from "../../components/RoomPreview";
import { rooms, type RoomSnapshot } from "../../store/roomsStore";

const Market: Component = () => {
  // Sample room data
  const sampleRooms: RoomSnapshot[] = [
    {
      id: "sample-1",
      name: "Pop Hits 2024",
      hostId: "host-1",
      hostName: "DJ Sarah",
      status: "live",
      participants: 42,
      isActive: true,
      createdAt: Date.now(),
      isPublic: true,
      categories: [
        {
          id: "cat-1",
          name: "Top 40",
          items: [
            { id: "item-1-1", level: 1, isRevealed: false },
            { id: "item-1-2", level: 2, isRevealed: false },
            { id: "item-1-3", level: 3, isRevealed: false },
          ],
        },
        {
          id: "cat-2",
          name: "Dance",
          items: [
            { id: "item-2-1", level: 1, isRevealed: false },
            { id: "item-2-2", level: 2, isRevealed: false },
            { id: "item-2-3", level: 3, isRevealed: false },
          ],
        },
        {
          id: "cat-3",
          name: "Indie",
          items: [
            { id: "item-3-1", level: 1, isRevealed: false },
            { id: "item-3-2", level: 2, isRevealed: false },
            { id: "item-3-3", level: 3, isRevealed: false },
          ],
        },
        {
          id: "cat-4",
          name: "Electronic",
          items: [
            { id: "item-4-1", level: 1, isRevealed: false },
            { id: "item-4-2", level: 2, isRevealed: false },
            { id: "item-4-3", level: 3, isRevealed: false },
          ],
        },
      ],
    },
    {
      id: "sample-2",
      name: "Hip-Hop Legends",
      hostId: "host-2",
      hostName: "MC Beats",
      status: "live",
      participants: 28,
      isActive: true,
      createdAt: Date.now(),
      isPublic: true,
      categories: [
        {
          id: "cat-5",
          name: "90s Classics",
          items: [
            { id: "item-5-1", level: 1, isRevealed: false },
            { id: "item-5-2", level: 2, isRevealed: false },
            { id: "item-5-3", level: 3, isRevealed: false },
          ],
        },
        {
          id: "cat-6",
          name: "Modern",
          items: [
            { id: "item-6-1", level: 1, isRevealed: false },
            { id: "item-6-2", level: 2, isRevealed: false },
            { id: "item-6-3", level: 3, isRevealed: false },
          ],
        },
        {
          id: "cat-7",
          name: "Underground",
          items: [
            { id: "item-7-1", level: 1, isRevealed: false },
            { id: "item-7-2", level: 2, isRevealed: false },
            { id: "item-7-3", level: 3, isRevealed: false },
          ],
        },
        {
          id: "cat-8",
          name: "Trap",
          items: [
            { id: "item-8-1", level: 1, isRevealed: false },
            { id: "item-8-2", level: 2, isRevealed: false },
            { id: "item-8-3", level: 3, isRevealed: false },
          ],
        },
        {
          id: "cat-9",
          name: "Drill",
          items: [
            { id: "item-9-1", level: 1, isRevealed: false },
            { id: "item-9-2", level: 2, isRevealed: false },
            { id: "item-9-3", level: 3, isRevealed: false },
          ],
        },
        {
          id: "cat-10",
          name: "West Coast",
          items: [
            { id: "item-10-1", level: 1, isRevealed: false },
            { id: "item-10-2", level: 2, isRevealed: false },
            { id: "item-10-3", level: 3, isRevealed: false },
          ],
        },
      ],
    },
    {
      id: "sample-3",
      name: "Rock Anthems",
      hostId: "host-3",
      hostName: "Guitar Hero",
      status: "live",
      participants: 35,
      isActive: true,
      createdAt: Date.now(),
      isPublic: true,
      categories: [
        {
          id: "cat-11",
          name: "Classic Rock",
          items: [
            { id: "item-11-1", level: 1, isRevealed: false },
            { id: "item-11-2", level: 2, isRevealed: false },
            { id: "item-11-3", level: 3, isRevealed: false },
          ],
        },
        {
          id: "cat-12",
          name: "Alt Rock",
          items: [
            { id: "item-12-1", level: 1, isRevealed: false },
            { id: "item-12-2", level: 2, isRevealed: false },
            { id: "item-12-3", level: 3, isRevealed: false },
          ],
        },
        {
          id: "cat-13",
          name: "Metal",
          items: [
            { id: "item-13-1", level: 1, isRevealed: false },
            { id: "item-13-2", level: 2, isRevealed: false },
            { id: "item-13-3", level: 3, isRevealed: false },
          ],
        },
      ],
    },
  ];

  return (
    <div class="min-h-screen bg-[#f4f6f8] p-6">
      <div class="mx-auto max-w-6xl">
        <div class="mb-8">
          <h1 class="text-3xl font-semibold text-neutral-900">Market</h1>
          <p class="mt-2 text-neutral-600">Browse and join available rooms</p>
        </div>

        <div class="grid gap-6 lg:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
          <For each={rooms}>{(room) => <RoomPreview room={room} />}</For>
        </div>
      </div>
    </div>
  );
};

export default Market;
