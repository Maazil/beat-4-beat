/**
 * The shareable player-link URL for a room — the page players open to join a
 * live game. Built from the current origin so it works across environments.
 */
export function playerShareUrl(roomId: string): string {
  return `${window.location.origin}/rooms/${roomId}/play`;
}
