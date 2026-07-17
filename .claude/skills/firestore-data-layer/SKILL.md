---
name: firestore-data-layer
description: This repo's Firestore conventions — service functions in src/services/, subscription hooks in src/hooks/ (createEffect + onCleanup pattern), and when to use signals vs stores/reconcile for snapshot data. Use when adding or modifying anything that reads/writes Firestore.
---

# Firestore Data Layer Conventions

Two layers, strictly separated:

- **`src/services/`** — the only place that imports `firebase/firestore`. Plain async CRUD functions plus `subscribeToX(id, callback): Unsubscribe` wrappers around `onSnapshot`.
- **`src/hooks/`** — Solid primitives that turn a subscription into reactive state. Components never call the SDK or services' subscribe functions directly; they use hooks.

## The subscription hook pattern (canonical: `src/hooks/useRoom.ts`)

Every live-data hook follows this shape:

```tsx
export function useThing(getId: () => string | undefined) {
  const [data, setData] = createSignal<Thing | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  createEffect(() => {
    const id = getId(); // tracked — effect re-runs when id changes
    setData(null);
    setIsLoading(true);
    setError(null); // reset on id change
    if (!id) {
      setIsLoading(false);
      setError("No id");
      return;
    }

    const unsubscribe = subscribeToThing(id, (d) => {
      setData(d);
      setIsLoading(false);
      setError(d ? null : "Not found");
    });
    onCleanup(() => unsubscribe()); // runs before each re-run AND on unmount
  });

  return { data, isLoading, error };
}
```

Non-negotiables when writing a new hook:

- **Take ids as accessors** (`getId: () => string | undefined`), never plain values — callers pass `() => params.id` so the subscription follows navigation.
- **`onCleanup` inside the effect** — that placement is what makes resubscription leak-free; it fires before every re-run, not just unmount.
- **Reset state when the source changes** so stale data from the previous id never flashes.
- **Return `{ data, isLoading, error }` accessors** — match `useRoom`/`useMyRooms`/`usePublicRooms`.
- Snapshot callbacks deliver `null` for missing docs — map that to an error string, don't throw.

## Signal vs store for snapshot data

`createSignal` (the current hooks) replaces the whole object per snapshot — every subscriber re-renders. For deeply nested, frequently-updating data (a Room mid-game: reveals, scores), prefer a store + `reconcile` so only changed leaves update:

```tsx
import { createStore, reconcile } from "solid-js/store";

const [room, setRoom] = createStore<{ value: Room | null }>({ value: null });
subscribeToRoom(id, (data) => setRoom("value", reconcile(data)));
```

`reconcile` diffs by `id` (Room/Category/SongItem all have one), so an unchanged category doesn't re-render when a sibling's item is revealed. Use this for `RoomPlay`-scale reactivity; plain signals are fine for lists of summaries (dashboard cards).

## Writes

- Writes go through service functions (`createRoom`, `updateRoom`, …) — never inline `setDoc`/`updateDoc` in components.
- When writing store-held data back, `unwrap(room)` first — Firestore rejects proxies' odd shapes and you don't want tracking on the write path.
- Firestore rejects `undefined` field values — strip optional fields (`title?`, `songUrl?`, `startTime?`) or convert to `null` in the service before writing.
- Don't optimistically mutate local state after a write; the `onSnapshot` subscription delivers the authoritative update (locally-originated writes fire the listener immediately from cache).
- Security rules live in `firestore.rules` — new fields or collections need rules updates in the same change.
