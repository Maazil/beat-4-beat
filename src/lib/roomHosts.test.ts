import { describe, expect, it } from "vitest";
import { formatNameList, roomHostNames } from "./roomHosts";
import type { Room } from "../model/room";

const room = (overrides: Partial<Room>): Room => ({
  id: "r1",
  roomName: "Test room",
  hostId: "host-uid",
  hostName: "Host",
  categories: [],
  isActive: true,
  isPublic: false,
  createdAt: 0,
  ...overrides,
});

describe("roomHostNames", () => {
  it("returns just the host when there are no co-owners", () => {
    expect(roomHostNames(room({ hostName: "DJ Matt" }))).toEqual(["DJ Matt"]);
  });

  it("lists co-owners after the host, in editorIds order", () => {
    const r = room({
      hostName: "Host",
      editorIds: ["u2", "u1"],
      editorNames: { u1: "Alice", u2: "Bob" },
    });
    expect(roomHostNames(r)).toEqual(["Host", "Bob", "Alice"]);
  });

  it("skips editors with no denormalized name and blank names", () => {
    const r = room({
      hostName: "Host",
      editorIds: ["u1", "u2"],
      editorNames: { u1: "  " },
    });
    expect(roomHostNames(r)).toEqual(["Host"]);
  });

  it("omits a blank host name", () => {
    const r = room({ hostName: "  ", editorIds: ["u1"], editorNames: { u1: "Alice" } });
    expect(roomHostNames(r)).toEqual(["Alice"]);
  });
});

describe("formatNameList", () => {
  it("handles zero, one, two and many names", () => {
    expect(formatNameList([])).toBe("");
    expect(formatNameList(["A"])).toBe("A");
    expect(formatNameList(["A", "B"])).toBe("A and B");
    expect(formatNameList(["A", "B", "C"])).toBe("A, B and C");
  });
});
