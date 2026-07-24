import type { Component } from "solid-js";
import Skeleton from "./Skeleton";

/**
 * Placeholder for a room card while the rooms subscription delivers its first
 * snapshot. Matches the shape both card types share — title + status badge,
 * a couple of mono info lines, a row of controls — so the grid doesn't jump
 * when the real cards land.
 *
 * @see RoomManageCard (dashboard) and RoomPreview (marketplace)
 */
const RoomCardSkeleton: Component = () => (
  <article class="rounded-2xl border border-line bg-surface p-6">
    <div class="mb-4 flex items-start justify-between gap-3">
      <Skeleton class="h-6 w-1/2 rounded-md" />
      <Skeleton class="h-5 w-20 rounded-full" />
    </div>
    <div class="space-y-2">
      <Skeleton class="h-3 w-2/3 rounded-md" />
      <Skeleton class="h-3 w-2/5 rounded-md" />
    </div>
    <div class="mt-6 flex items-center gap-2">
      <Skeleton class="h-9 flex-1 rounded-full" />
      <Skeleton class="h-9 w-9 rounded-full" />
      <Skeleton class="h-9 w-9 rounded-full" />
    </div>
  </article>
);

export default RoomCardSkeleton;
