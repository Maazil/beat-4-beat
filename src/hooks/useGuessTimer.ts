import { createSignal } from "solid-js";

/** Selectable guess-countdown durations in seconds; 0 = off. */
export const TIMER_CHOICES = [0, 15, 30, 45, 60];

const STORAGE_KEY = "b4b_guess_timer_sec";

/**
 * Guess-countdown setting: a persisted duration plus a run id that bumps to
 * restart the countdown at the start of each round.
 */
export function useGuessTimer() {
  const stored = Number(localStorage.getItem(STORAGE_KEY));
  const [durationSec, setDurationSec] = createSignal(TIMER_CHOICES.includes(stored) ? stored : 0);
  const [runId, setRunId] = createSignal(0);

  /** Pick a duration; 0 turns the timer off and stops any running countdown. */
  const choose = (sec: number) => {
    setDurationSec(sec);
    localStorage.setItem(STORAGE_KEY, String(sec));
    if (sec === 0) setRunId(0);
  };

  /** Restart the countdown for a new round (no-op when the timer is off). */
  const bump = () => {
    if (durationSec() > 0) setRunId((n) => n + 1);
  };

  return { choices: TIMER_CHOICES, durationSec, runId, choose, bump };
}
