import { Component } from "solid-js";

interface RoomStatusBadgeProps {
  active: boolean;
}

/** Live/Inactive status pill shared by every room card and detail view. */
const RoomStatusBadge: Component<RoomStatusBadgeProps> = (props) => {
  return (
    <span
      class={`shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-xs ${
        props.active
          ? "border-beat/30 bg-beat-soft text-beat-bright"
          : "border-line bg-surface-2 text-muted"
      }`}
    >
      {props.active ? "Live" : "Inactive"}
    </span>
  );
};

export default RoomStatusBadge;
