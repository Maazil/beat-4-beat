import { describe, expect, it } from "vitest";
import type { Room } from "../model/room";
import { filterMarketRooms } from "./marketFilter";

const room = (over: Partial<Room>): Room => ({
  id: "r",
  roomName: "Room",
  hostId: "h",
  hostName: "Host",
  categories: [],
  isActive: false,
  isPublic: true,
  createdAt: 0,
  ...over,
});

describe("filterMarketRooms", () => {
  const rooms = [
    room({ id: "1", roomName: "80s Bangers", hostName: "DJ Sam", isActive: true }),
    room({ id: "2", roomName: "Rock Legends", hostName: "Alex", isActive: false }),
    room({ id: "3", roomName: "Pop Party", hostName: "Sam Jones", isActive: true }),
  ];

  it("returns all rooms with an empty query and liveOnly off", () => {
    expect(filterMarketRooms(rooms, { query: "", liveOnly: false })).toHaveLength(3);
  });

  it("matches room name case-insensitively", () => {
    const result = filterMarketRooms(rooms, { query: "rock", liveOnly: false });
    expect(result.map((r) => r.id)).toEqual(["2"]);
  });

  it("matches host name", () => {
    const result = filterMarketRooms(rooms, { query: "sam", liveOnly: false });
    expect(result.map((r) => r.id)).toEqual(["1", "3"]);
  });

  it("ignores surrounding whitespace in the query", () => {
    expect(filterMarketRooms(rooms, { query: "  pop  ", liveOnly: false })).toHaveLength(1);
  });

  it("keeps only active rooms when liveOnly is set", () => {
    const result = filterMarketRooms(rooms, { query: "", liveOnly: true });
    expect(result.map((r) => r.id)).toEqual(["1", "3"]);
  });

  it("combines query and liveOnly", () => {
    const result = filterMarketRooms(rooms, { query: "sam", liveOnly: true });
    expect(result.map((r) => r.id)).toEqual(["1", "3"]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterMarketRooms(rooms, { query: "jazz", liveOnly: false })).toEqual([]);
  });
});
