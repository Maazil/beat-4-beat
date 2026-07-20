import { Component, For } from "solid-js";

interface GuessTimerPickerProps {
  choices: number[];
  selected: number;
  onChoose: (sec: number) => void;
}

/** Row of guess-countdown duration buttons; countdown starts on each tile click. */
const GuessTimerPicker: Component<GuessTimerPickerProps> = (props) => {
  return (
    <div class="flex items-center gap-1.5">
      <span class="mr-1 font-mono text-xs tracking-wide text-muted uppercase">Timer</span>
      <For each={props.choices}>
        {(sec) => (
          <button
            type="button"
            onClick={() => props.onChoose(sec)}
            class={`rounded-full border px-2.5 py-0.5 font-mono text-xs font-bold transition ${
              props.selected === sec
                ? "border-beat bg-beat-soft text-beat-bright"
                : "border-line text-muted hover:border-beat"
            }`}
          >
            {sec === 0 ? "Off" : `${sec}s`}
          </button>
        )}
      </For>
    </div>
  );
};

export default GuessTimerPicker;
