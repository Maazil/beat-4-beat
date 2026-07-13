import { Component, createEffect, createSignal, onCleanup, Show, untrack } from "solid-js";

interface GuessTimerProps {
  /** Countdown length. Changes apply from the next run. */
  durationSec: number;
  /** Bump to (re)start the countdown; 0 means nothing has been played yet. */
  runId: number;
}

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Floating countdown ring for the guessing phase. Restarts whenever runId
 * changes (each played song), drains clockwise, turns hot magenta for the
 * last five seconds and pulses on zero.
 */
const GuessTimer: Component<GuessTimerProps> = (props) => {
  const [remaining, setRemaining] = createSignal(0);
  const [duration, setDuration] = createSignal(1);
  const [dismissed, setDismissed] = createSignal(false);

  createEffect(() => {
    if (props.runId === 0) return;
    const total = untrack(() => props.durationSec);
    setDuration(total);
    setRemaining(total);
    setDismissed(false);

    const startedAt = performance.now();
    const interval = window.setInterval(() => {
      const left = total - (performance.now() - startedAt) / 1000;
      setRemaining(Math.max(0, left));
      if (left <= 0) window.clearInterval(interval);
    }, 100);
    onCleanup(() => window.clearInterval(interval));
  });

  const expired = () => props.runId > 0 && remaining() <= 0;
  const urgent = () => remaining() > 0 && remaining() <= 5;
  const fraction = () => Math.min(1, remaining() / duration());

  return (
    <Show when={props.runId > 0 && !dismissed()}>
      <div
        class={`fixed right-6 bottom-24 z-40 flex h-28 w-28 items-center justify-center rounded-full border border-line bg-surface shadow-[0_8px_30px_rgba(0,0,0,0.5)] ${
          expired() ? "animate-pulse" : ""
        }`}
      >
        <svg class="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke="var(--color-line)"
            stroke-width="6"
          />
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke={urgent() || expired() ? "var(--color-magenta-hot)" : "var(--color-beat)"}
            stroke-width="6"
            stroke-linecap="round"
            stroke-dasharray={`${CIRCUMFERENCE}`}
            stroke-dashoffset={`${CIRCUMFERENCE * (1 - fraction())}`}
          />
        </svg>
        <span
          class={`font-mono text-3xl font-bold ${urgent() || expired() ? "text-magenta-hot" : "text-ink"}`}
        >
          {expired() ? "0" : Math.ceil(remaining())}
        </span>
        <button
          type="button"
          title="Hide timer"
          onClick={() => setDismissed(true)}
          class="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface-2 text-muted transition hover:border-beat hover:text-beat"
        >
          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </Show>
  );
};

export default GuessTimer;
