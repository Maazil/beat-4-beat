import type { Component } from "solid-js";
import { For, createEffect, createSignal, onCleanup, onMount } from "solid-js";

type RandomVisualizerProps = {
  barCount?: number;
  bpm?: number;
  class?: string;
};

const RandomVisualizer: Component<RandomVisualizerProps> = (props) => {
  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));
  const count = () => props.barCount ?? 48;
  const tempo = () => clamp(props.bpm ?? 150, 120, 200);
  const stepInterval = () =>
    Math.max(60, Math.round(60000 / tempo() / 4));
  const createLevels = (bars: number) =>
    Array.from({ length: bars }, () => Math.random());

  const [levels, setLevels] = createSignal<number[]>(createLevels(count()));

  let intervalId: number | undefined;

  const stop = () => {
    if (intervalId !== undefined) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
  };

  const start = (delay: number, bars: number) => {
    stop();
    intervalId = window.setInterval(() => {
      setLevels((previous) => {
        const snapshot =
          previous.length === bars ? previous : createLevels(bars);
        return snapshot.map((value) => {
          const target = Math.random();
          const eased = value + (target - value) * 0.55;
          return Math.max(0, Math.min(1, eased));
        });
      });
    }, delay);
  };

  onMount(() => start(stepInterval(), count()));

  createEffect(() => {
    const bars = count();
    const delay = stepInterval();
    setLevels(createLevels(bars));
    start(delay, bars);
  });

  onCleanup(stop);

  const combinedClass = () =>
    props.class ? `random-visualizer ${props.class}` : "random-visualizer";

  return (
    <div class={combinedClass()} role="presentation" aria-hidden="true">
      <div class="random-visualizer__glow" />
      <For each={levels()}>
        {(level, index) => (
          <span
            class="random-visualizer__bar"
            style={{
              transform: `translateZ(0) scaleY(${(0.45 + level * 0.55).toFixed(3)})`,
              opacity: `${(0.6 + level * 0.35).toFixed(3)}`,
              'transition-delay': `${(index() % 6) * 18}ms`,
            }}
          />
        )}
      </For>
    </div>
  );
};

export default RandomVisualizer;
