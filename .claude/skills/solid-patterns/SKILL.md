---
name: solid-patterns
description: SolidJS reactivity and component patterns beyond the basics — stores (path syntax, produce, reconcile, unwrap), memos vs effects, the on() utility, createResource/Suspense, lifecycle. Use when writing or reviewing any Solid component, hook/primitive, or state logic in src/.
---

# SolidJS Patterns (Solid 1.9)

CLAUDE.md covers the ground rules (call signals in JSX props, never destructure props, derive don't sync, `<Show>`/`<For>`, effects as last resort). This skill covers the next layer, distilled from the current official docs (docs.solidjs.com).

## Stores — prefer for nested data (Room → categories → items)

Signals replace whole objects; stores update surgically per property. Room-shaped data belongs in a store.

```tsx
import { createStore, produce, reconcile, unwrap } from "solid-js/store";

const [room, setRoom] = createStore<Room>(initialRoom);
```

**Reading:** store properties are accessed _without_ calling (`room.categories[0].name`), but only track inside a reactive scope (JSX, memo, effect). A bare read at component-body level runs once and never updates.

**Path syntax — reach into nesting instead of spreading:**

```tsx
// Set one nested property
setRoom("categories", 0, "items", 2, "isRevealed", true);

// Function form — compute from previous value
setRoom("categories", 0, "items", 2, "isRevealed", (r) => !r);

// Filter function as a path segment — update items matching a condition
setRoom("categories", 0, "items", (item) => item.level > 3, "isRevealed", false);

// Multiple indices / ranges at once (auto-batched)
setRoom("categories", 0, "items", [1, 3, 5], "isRevealed", false);
setRoom("categories", 0, "items", { from: 0, to: 4 }, "isRevealed", false);

// Append to an array: assign at .length (narrower reactivity than spreading)
setRoom("categories", room.categories.length, newCategory);

// Object values shallow-merge — no need to spread the existing object
setRoom("categories", 0, { name: "Renamed" });
```

**`produce`** — several changes to one target as a mutable draft, one update:

```tsx
setRoom(
  "categories",
  0,
  "items",
  idx,
  produce((item) => {
    item.isRevealed = true;
    item.startTime = 30;
  }),
);
```

Works only on plain objects/arrays (not Map/Set).

**`reconcile`** — diff an incoming snapshot into an existing store, updating only what changed. This is the right tool for Firestore `onSnapshot` payloads: without it every snapshot replaces the whole object and re-renders everything; with it, unchanged categories/items don't re-render. Array items match by `id` by default (Room, Category, SongItem all have `id`).

```tsx
subscribeToRoom(roomId, (data) => setRoom(reconcile(data)));
```

**`unwrap`** — get the raw non-proxy object when handing data to non-reactive code (e.g. writing back to Firestore): `updateRoom(unwrap(room))`.

## Memos vs derived functions vs effects

- `const isHost = () => room.hostId === user()?.uid` — cheap derivation: plain function.
- `createMemo` when the computation is expensive or fans out to many readers; it caches, recomputes once per dependency change, and skips downstream updates when the result is `===`-equal.
- Memos must be pure — setting a signal inside a memo risks infinite loops. Side effects go in `createEffect`; derived values never do.
- Deriving beats effect-sync in granularity too: an effect re-runs on every dependency change, a memo only propagates when its _output_ changes.

## Effects, when you must

- Effects run once on init, then on dependency change. Order of effect execution is not guaranteed — never rely on it.
- **`on()` for explicit deps** — decouple "what triggers" from "what runs", and skip the initial run with `defer`:

```tsx
import { on } from "solid-js";

createEffect(
  on(
    () => params.id,
    (id) => {
      /* only tracks params.id */
    },
  ),
);
createEffect(on(activeSong, scrollToSong, { defer: true })); // skip first run
```

With stores, the dep must be a thunk: `on(() => room.isActive, ...)` — `on(room.isActive, ...)` silently never fires.

- Nested effects track independently; inner signals don't become outer deps.
- `untrack(() => ...)` reads a signal inside a tracking scope without subscribing.
- `batch(() => ...)` groups multiple setter calls into one update wave (store multi-setters and event handlers already batch).

## Lifecycle

- `onMount` — run-once setup (analytics, focus, third-party init). Prefer it over a dep-less effect: intent is explicit and it's guaranteed once.
- `onCleanup` — release subscriptions/timers. Registered inside an effect, it runs _before each re-run_ of that effect as well as on disposal — which is exactly why the `useRoom` pattern (subscribe in effect + `onCleanup(unsubscribe)`) resubscribes cleanly when the id changes.

## Async data: createResource + Suspense

For one-shot async (not live subscriptions — those stay in the hooks pattern, see firestore-data-layer skill):

```tsx
const [track, { mutate, refetch }] = createResource(
  () => song.songUrl, // source: falsy → fetcher doesn't run; change → refetch
  (url) => fetchTrackMeta(url), // fetcher
);
```

- Resource states: `track.loading`, `track.error`, `track.state` (`unresolved | pending | ready | refreshing | errored`), `track.latest` (last value while refreshing — avoids flicker).
- `mutate(v)` for optimistic updates; `refetch()` to force reload.
- Wrap consumers in `<Suspense fallback={...}>` to coordinate multiple async reads without partial-content flashes; nearest boundary wins. Add `<ErrorBoundary>` if the fetcher can throw.

## Control flow, the rest of the family

- `<Switch>/<Match>` for mutually exclusive branches (loading / error / data).
- `<For>` keys by reference — right default for lists of objects. `<Index>` keys by position — better for primitives or fixed-length lists where items mutate in place.
- `<Dynamic component={...}>` for component-from-a-map rendering (e.g. icon or level-badge lookup).
- `<Portal>` for overlays/modals that must escape stacking contexts.
- `createSelector(selectedId)` when many list rows compare against one selected id — only the two affected rows update instead of every row.
