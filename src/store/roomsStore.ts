import { createStore } from "solid-js/store";
import { demoRoom, type Room } from "../model/room";

export type RoomSnapshot = Room & {
  status: "scheduled" | "live" | "completed";
  startsAt?: string;
  participants: number;
};

export const [rooms, setRooms] = createStore<RoomSnapshot[]>([
  // {
  //   ...drakeRoom,
  //   status: "live",
  //   startsAt: new Date(Date.now()).toISOString(),
  //   participants: 30,
  // },
  {
    ...demoRoom,
    status: "live",
    participants: 24,
  },
  {
    id: "1",
    roomName: "Nord Pulse",
    hostId: "demo-host-001",
    hostName: "DJ Nord",
    categories: [
      {
        id: "cat-001",
        name: "House",
        items: [
          { id: "item-001", level: 1, isRevealed: false },
          { id: "item-002", level: 2, isRevealed: false },
          { id: "item-003", level: 3, isRevealed: false },
        ],
      },
      {
        id: "cat-002",
        name: "Techno",
        items: [
          { id: "item-004", level: 1, isRevealed: false },
          { id: "item-005", level: 2, isRevealed: false },
          { id: "item-006", level: 3, isRevealed: false },
        ],
      },
      {
        id: "cat-003",
        name: "Drum and Bass",
        items: [
          { id: "item-007", level: 1, isRevealed: false },
          { id: "item-008", level: 2, isRevealed: false },
          { id: "item-009", level: 3, isRevealed: false },
        ],
      },
    ],
    status: "completed",
    startsAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    participants: 12,
    isActive: false,
    isPublic: true,
    createdAt: Date.now() - 1000 * 60 * 60,
  },
  {
    id: "2",
    roomName: "Fjell Takt",
    hostId: "demo-host-002",
    hostName: "DJ Fjell",
    categories: [
      {
        id: "cat-004",
        name: "Pop",
        items: [
          { id: "item-010", level: 1, isRevealed: false },
          { id: "item-011", level: 2, isRevealed: false },
          { id: "item-012", level: 3, isRevealed: false },
        ],
      },
      {
        id: "cat-005",
        name: "Rock",
        items: [
          { id: "item-013", level: 1, isRevealed: false },
          { id: "item-014", level: 2, isRevealed: false },
          { id: "item-015", level: 3, isRevealed: false },
        ],
      },
    ],
    status: "scheduled",
    startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    participants: 8,
    isActive: false,
    isPublic: true,
    createdAt: Date.now() - 1000 * 60 * 45,
  },
  {
    id: "3",
    roomName: "Fjord Echo",
    hostId: "demo-host-003",
    hostName: "DJ Fjord",
    categories: [
      {
        id: "cat-006",
        name: "Jazz",
        items: [
          { id: "item-016", level: 1, isRevealed: false },
          { id: "item-017", level: 2, isRevealed: false },
          { id: "item-018", level: 3, isRevealed: false },
        ],
      },
      {
        id: "cat-007",
        name: "Classical",
        items: [
          { id: "item-019", level: 1, isRevealed: false },
          { id: "item-020", level: 2, isRevealed: false },
          { id: "item-021", level: 3, isRevealed: false },
        ],
      },
      {
        id: "cat-008",
        name: "Ambient",
        items: [
          { id: "item-022", level: 1, isRevealed: false },
          { id: "item-023", level: 2, isRevealed: false },
          { id: "item-024", level: 3, isRevealed: false },
        ],
      },
      {
        id: "cat-009",
        name: "Hip Hop",
        items: [
          { id: "item-025", level: 1, isRevealed: false },
          { id: "item-026", level: 2, isRevealed: false },
          { id: "item-027", level: 3, isRevealed: false },
        ],
      },
    ],
    status: "live",
    participants: 16,
    isActive: true,
    isPublic: true,
    createdAt: Date.now() - 1000 * 60 * 15,
  },
]);

export const addRoom = (room: RoomSnapshot) =>
  setRooms((prev) => [...prev, room]);

export const updateRoom = (roomId: string, updater: Partial<RoomSnapshot>) =>
  setRooms((list) =>
    list.map((room) => (room.id === roomId ? { ...room, ...updater } : room))
  );

export const removeRoom = (roomId: string) =>
  setRooms((list) => list.filter((room) => room.id !== roomId));
