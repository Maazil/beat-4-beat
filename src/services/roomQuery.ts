import { query } from "@solidjs/router";
import { getRoom } from "./roomsService";

/**
 * Cached one-shot room read, keyed by room id — shared by route preloads,
 * useRoom's warm start, and the edit flow. The live subscription in
 * useRoom stays the source of truth; this only avoids cold round-trips
 * when navigating between pages that show the same room.
 */
export const getRoomOnce = query(getRoom, "room");
