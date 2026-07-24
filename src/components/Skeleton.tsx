import type { Component } from "solid-js";

interface SkeletonProps {
  /**
   * Size and shape: height, width, and a `rounded-*` — the radius has to come
   * from here rather than a default, because two competing radius utilities
   * resolve by stylesheet order, not by the order they're written in.
   */
  class?: string;
}

/**
 * One placeholder block. Shape comes from the caller; the tint and the pulse
 * live here so every loading state in the app reads as the same thing.
 *
 * Purely decorative — the container that holds a group of these owns the
 * `role="status"` and the label a screen reader actually hears.
 */
const Skeleton: Component<SkeletonProps> = (props) => (
  <div aria-hidden="true" class={`animate-pulse bg-peri/10 ${props.class ?? ""}`} />
);

export default Skeleton;
