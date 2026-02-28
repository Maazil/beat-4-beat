import type { Component } from "solid-js";

interface SeekBarProps {
  positionMs: number;
  durationMs: number;
  onSeek: (ms: number) => void;
}

const formatTime = (ms: number) => {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
};

const SeekBar: Component<SeekBarProps> = (props) => {
  const progressPct = () => {
    return props.durationMs > 0
      ? (props.positionMs / props.durationMs) * 100
      : 0;
  };

  const handleClick = (e: MouseEvent) => {
    const bar = e.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width),
    );
    props.onSeek(Math.round(pct * props.durationMs));
  };

  return (
    <div class="flex items-center gap-2 px-6 pt-3">
      <span class="w-10 text-right text-xs tabular-nums text-neutral-500">
        {formatTime(props.positionMs)}
      </span>
      <div
        class="group relative h-1.5 flex-1 cursor-pointer rounded-full bg-neutral-200"
        onClick={handleClick}
      >
        <div
          class="absolute top-0 left-0 h-full rounded-full bg-neutral-900 transition-[width] duration-200"
          style={{ width: `${progressPct()}%` }}
        />
        <div
          class="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-neutral-900 opacity-0 shadow transition group-hover:opacity-100"
          style={{ left: `${progressPct()}%` }}
        />
      </div>
      <span class="w-10 text-xs tabular-nums text-neutral-500">
        {formatTime(props.durationMs)}
      </span>
    </div>
  );
};

export default SeekBar;
