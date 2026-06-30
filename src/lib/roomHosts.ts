import type { Room } from "../model/room";

/**
 * The full list of host names for a room: the host first, followed by any
 * co-owners (in join order, taken from editorIds). Co-owner names are read
 * from the denormalized editorNames map so they're available to anyone who
 * can read the room — co-owner display names otherwise live in the host-only
 * joinRequests subcollection.
 */
export function roomHostNames(room: Room): string[] {
  const names: string[] = [];

  const host = room.hostName?.trim();
  if (host) names.push(host);

  const editorNames = room.editorNames ?? {};
  for (const uid of room.editorIds ?? []) {
    const name = editorNames[uid]?.trim();
    if (name) names.push(name);
  }

  return names;
}

/**
 * Join names into a natural-language list:
 * [] -> "", [a] -> "a", [a, b] -> "a and b", [a, b, c] -> "a, b and c".
 */
export function formatNameList(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
