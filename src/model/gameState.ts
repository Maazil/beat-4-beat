import type { Score } from "./score";

/**
 * Live state of a game in progress. Stored on the room document so a
 * refresh (or a second screen) picks up where the game left off.
 *
 * A song is "revealed" exactly when it appears in playOrder, so the board
 * state is fully derivable from playOrder — no separate revealed list.
 */
export interface GameState {
  playOrder: string[]; // Song item ids in the order they were played; each one is a scoring round
  currentItemId: string | null; // Song currently in play (awards land on its round)
  scores: Score[]; // Team scores, round by round
}

export const defaultGameState = (): GameState => ({
  playOrder: [],
  currentItemId: null,
  scores: [],
});
