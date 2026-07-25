import { query } from "@solidjs/router";
import { getCategoryImages, getRoom } from "./roomsService";

/**
 * Cached one-shot room read, keyed by room id — shared by route preloads,
 * useRoom's warm start, and the edit flow. The live subscription in
 * useRoom stays the source of truth; this only avoids cold round-trips
 * when navigating between pages that show the same room.
 */
export const getRoomOnce = query(getRoom, "room");

/**
 * Cached one-shot read of a room's category header images, keyed by room id.
 * Split off the room document (see lib/categoryImages), so the views that
 * actually show a board — play, audience, editor — fetch them separately,
 * and the list views never pay for them. Warmed by the same route preload as
 * the room, so landing on a board doesn't cost an extra round trip.
 */
export const getCategoryImagesOnce = query(getCategoryImages, "categoryImages");
