import { createStore } from "solid-js/store";
import type { Room } from "../model/room";

export type RoomSnapshot = Room & {
  status: "scheduled" | "live" | "completed";
  startsAt?: string;
  participants: number;
};

export const [rooms, setRooms] = createStore<RoomSnapshot[]>([
  {
    id: "1",
    name: "Nord Pulse",
    hostId: "demo-host-001",
    categories: [],
    status: "completed",
    startsAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    participants: 12,
    isActive: false,
    createdAt: Date.now() - 1000 * 60 * 60,
  },
  {
    id: "2",
    name: "Fjell Takt",
    hostId: "demo-host-002",
    categories: [],
    status: "scheduled",
    startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    participants: 8,
    isActive: false,
    createdAt: Date.now() - 1000 * 60 * 45,
  },
  {
    id: "3",
    name: "Fjord Echo",
    hostId: "demo-host-003",
    categories: [],
    status: "live",
    participants: 16,
    isActive: true,
    createdAt: Date.now() - 1000 * 60 * 15,
  },
]);

export const addRoom = (room: RoomSnapshot) =>
  setRooms((prev) => [...prev, room]);

export const updateRoom = (roomId: string, updater: Partial<RoomSnapshot>) =>
  setRooms((list) =>
    list.map((room) => (room.id === roomId ? { ...room, ...updater } : room)),
  );

export const removeRoom = (roomId: string) =>
  setRooms((list) => list.filter((room) => room.id !== roomId));
