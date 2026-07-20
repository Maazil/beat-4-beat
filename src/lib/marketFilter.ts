import type { Room } from "../model/room";

export interface MarketFilters {
  /** Free-text search matched against room name and host name (case-insensitive). */
  query: string;
  /** When true, only rooms with `isActive` are kept. */
  liveOnly: boolean;
}

/**
 * Filter public rooms for the marketplace grid.
 *
 * Pure so the marketplace search/filter behaviour is unit-testable without a
 * component or Firestore. Pagination stays in the component (a simple slice).
 */
export function filterMarketRooms(rooms: Room[], filters: MarketFilters): Room[] {
  const query = filters.query.trim().toLowerCase();

  return rooms.filter((room) => {
    if (filters.liveOnly && !room.isActive) return false;
    if (!query) return true;
    return `${room.roomName} ${room.hostName}`.toLowerCase().includes(query);
  });
}
