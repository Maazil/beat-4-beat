import type { Component } from "solid-js";
import { For, createEffect, createSignal, onCleanup, onMount } from "solid-js";

type RandomVisualizerProps = {
  barCount?: number;
  class?: string;
};

const RandomVisualizer: Component<RandomVisualizerProps> = (props) => {
  const count = () => props.barCount ?? 48;
  const createLevels = () =>
    Array.from({ length: count() }, () => Math.random());

  const [levels, setLevels] = createSignal<number[]>(createLevels());

  let intervalId: number | undefined;

  const stop = () => {
    if (intervalId !== undefined) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
  };

  const start = () => {
    stop();
    intervalId = window.setInterval(() => {
      setLevels((previous) => {
        const snapshot =
          previous.length === count() ? previous : createLevels();
        return snapshot.map((value) => {
          const target = Math.random();
          const eased = value + (target - value) * 0.55;
          return Math.max(0, Math.min(1, eased));
        });
      });
    }, 140);
  };

  onMount(start);

  createEffect(() => {
    count();
    setLevels(createLevels());
    start();
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
              height: `${35 + level * 65}%`,
              "transition-delay": `${(index() % 6) * 18}ms`,
            }}
          />
        )}
      </For>
    </div>
  );
};

export default RandomVisualizer;
