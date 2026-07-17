---
name: solid-router
description: "@solidjs/router v0.16 conventions for this repo — adding routes in src/routes.ts, params, search params, navigation, and the modern data APIs (query + createAsync/createAsyncStore, actions, preload). Use when adding/changing routes, pages, navigation, or URL state."
---

# Solid Router (v0.16) in beat-4-beat

Routes live in `src/routes.ts` as a `RouteDefinition[]` (config-based routing, not JSX `<Route>`), passed to `<Router>` in the app entry.

## Adding a route

- Lazy-load every page except the landing page: `component: lazy(() => import("./pages/foo/Foo"))`.
- Follow the existing wrapper pattern: sections that share a shell/guard use a parent route with a wrapper component (`PageWrapper`, `MarketWrapper`, …) and a `children` array whose index route has `path: "/"`. Wrapper components render `props.children` as the outlet.
- Auth-guarded pages use the `ProtectedRoute` / `RequireHost` components from `src/components/`, not router-level logic.
- Keep the `path: "**"` NotFound fallback last.

## Params, search params, navigation

```tsx
import { useParams, useSearchParams, useNavigate, useLocation, A } from "@solidjs/router";

const params = useParams(); // reactive proxy: params.id
const { room } = useRoom(() => params.id); // pass as accessor, never params.id directly

const [searchParams, setSearchParams] = useSearchParams();
searchParams.edit; // ?edit=roomId (dashboard/create edit mode)
setSearchParams({ edit: roomId }); // merges; undefined/null/"" removes the key
setSearchParams({ edit: id }, { replace: true }); // no history entry

const navigate = useNavigate();
navigate(`/rooms/${id}/play`);
```

- `useParams()` and `useSearchParams()` return reactive proxies — read properties inside a tracking scope; don't destructure them.
- Prefer `<A href=...>` over `<a>` for internal links: it resolves relative to the route and sets `active`/`inactive` classes.
- Route-matching params with validation: `path: "/rooms/:id"` supports `matchFilters` on the route definition if an id format must be enforced.
- Optional param: `path: "/rooms/:id?"`; wildcard segment: `path: "/files/*rest"`.

## Data APIs (the modern replacements for ad-hoc fetching)

These matter for one-shot reads (marketplace listings, invite lookups, Spotify metadata). Live Firestore subscriptions stay in the `src/hooks/` pattern — see the firestore-data-layer skill.

**`query` + `createAsync`** — dedupe and cache a fetch by key; pair with route `preload` so data starts loading before the page renders:

```tsx
import { query, createAsync } from "@solidjs/router";

const getRoomOnce = query(async (id: string) => {
  const room = await fetchRoom(id);
  if (!room) throw new Error("Room not found");
  return room;
}, "room"); // name + args form the dedupe key

// In routes.ts — starts the fetch on link hover / navigation intent:
{
  path: "/:id",
  component: lazy(() => import("./pages/rooms/RoomView")),
  preload: ({ params }) => getRoomOnce(params.id),
}

// In the component:
const room = createAsync(() => getRoomOnce(params.id));
```

- Errors thrown in the fetcher surface at the nearest `<ErrorBoundary>`.
- For arrays/nested objects, `createAsyncStore` returns a store instead of a signal — fine-grained updates, plays well with `<For>`.
- Deduplication: same query name + args within the same page/preload window → one network call.

**Actions** — mutations with submission tracking and automatic revalidation of queries:

```tsx
import { action, useAction, useSubmission, redirect } from "@solidjs/router";

const saveRoomAction = action(async (room: Room) => {
  await updateRoom(room);
  return redirect(`/rooms/${room.id}`); // or json(data, { revalidate: [getRoomOnce.key] })
});

const save = useAction(saveRoomAction);
const submission = useSubmission(saveRoomAction); // .pending, .error, .input, .result
```

After an action resolves, router queries revalidate automatically (customizable via `revalidate` keys). Useful for create/edit room flows; not needed where Firestore's `onSnapshot` already pushes fresh data.
