/**
 * Format a room's createdAt timestamp for cards and detail views.
 */
export function formatRoomDate(createdAt: Date | number): string {
  const date = createdAt instanceof Date ? createdAt : new Date(createdAt);
  return date.toLocaleString("en-GB", { dateStyle: "short" });
}
