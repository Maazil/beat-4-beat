# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important

Never add Claude Code as a co-author on commits or pull requests.

## Commands

```bash
pnpm dev          # Start dev server (localhost:3000) + TypeScript check in parallel
pnpm build        # Production build to /dist via Vite
pnpm serve        # Preview production build
pnpm ts           # TypeScript type check (no emit)
pnpm format       # Format code with oxfmt
pnpm lint         # ESLint check
pnpm lint:fix     # ESLint auto-fix
```

## Architecture

### Tech Stack

- **Solid.js** v1.9 — Reactive UI framework (NOT React)
- **Vite** v7 — Build tool and dev server
- **Firebase** v12 — Auth (Google OAuth, Anonymous), Firestore (real-time NoSQL), Analytics
- **TypeScript** — Strict mode enabled
- **Tailwind CSS** v4 — Utility-first styling via `@tailwindcss/vite` plugin
- **@solidjs/router** v0.15 — Client-side routing with lazy loading

### Routing

SolidJS Router. Route definitions in `src/routes.ts`:

- `/` — Landing page
- `/login`, `/guest` — Authentication pages
- `/market` — Public room marketplace
- `/rooms`, `/rooms/:id`, `/rooms/:id/play` — Browse, view, and play rooms
- `/dashboard` — Authenticated user dashboard
- `/dashboard/create` — Create or edit room (`?edit=roomId` for edit mode)
- `/profile` — User profile
- `/ui-preview`, `/forms-preview` — Development-only component showcases

### Data Layer

**Firestore collections:** `rooms/` and `users/`

**Service layer** in `src/services/`:
- `roomsService.ts` — Room CRUD + real-time subscriptions (`onSnapshot`)
- `usersService.ts` — User profile sync to Firestore on auth state change

**Custom hooks** in `src/hooks/`:
- `useRoom(getRoomId)` — Subscribe to single room (reactive)
- `useMyRooms()` — Subscribe to current user's rooms
- `usePublicRooms()` — Subscribe to all public rooms
- All return `{ data/rooms, isLoading, error }` pattern with `onCleanup` for unsubscribing

### Authentication

Firebase Auth via `src/context/AuthContext.tsx`:
- **Google OAuth** — Full users, can create/manage rooms
- **Anonymous/Guest** — Can view/play rooms only
- Computed accessors: `isGuest()`, `isFullUser()`, `canCreateRooms()`, `isRoomHost()`
- Route guards: `ProtectedRoute`, `RequireFullUser`, `RequireHost` components

### Key Directories

- `src/services/` — Firebase CRUD operations + real-time subscriptions
- `src/hooks/` — Custom Solid.js primitives for data fetching
- `src/context/` — AuthContext (global auth state)
- `src/model/` — TypeScript interfaces (Room, Category, SongItem, Score)
- `src/pages/` — Route page components
- `src/components/` — Shared UI components (RoomManageCard, RoomPreview, ProtectedRoute, forms)
- `src/lib/` — Firebase SDK initialization

### Data Model

```typescript
Room { id, roomName, hostId, hostName, categories: Category[], isActive, isPublic, createdAt }
Category { id, name, items: SongItem[] }
SongItem { id, level, title?, artist?, songUrl?, startTime?, isRevealed }
```

### Styling

Tailwind CSS v4 via Vite plugin. Dark theme with red accents. Custom animations in `src/index.css` (`beat-pulse`, `gradient-orbit`, `ambient-float`). Prettier sorts Tailwind classes via `prettier-plugin-tailwindcss`.

### Environment Variables

Firebase config via Vite env vars (`.env.local`):
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID`

## SolidJS Best Practices (MUST follow)

Source: https://www.brenelz.com/posts/solid-js-best-practices/

### 1. Call signals when passing to JSX props

Props should always be plain values, not accessors. Call the signal at the call site so components don't need to know whether a value is reactive.

```tsx
// WRONG — passing an accessor as a prop
<User id={id} />  // id is Accessor<number>

// RIGHT — call the signal
<User id={id()} />  // id() is number
```

### 2. Never destructure props

Destructuring extracts the value and breaks reactivity. Access props via `props.x` or use `splitProps`.

```tsx
// WRONG
function User({ name }: { name: string }) { ... }

// RIGHT
function User(props: { name: string }) {
  return <h1>{props.name}</h1>;
}

// ALSO RIGHT — when you need to separate local vs forwarded props
const [local, rest] = splitProps(props, ["name"]);
```

### 3. Wrap derived values in functions (or createMemo)

Signals only track dependencies when read inside a reactive scope (JSX, createEffect, createMemo). A bare `count() * 2` outside a reactive scope runs once and never updates.

```tsx
// WRONG — runs once, never updates
const doubled = count() * 2;

// RIGHT — derived function, re-evaluated in JSX
const doubled = () => count() * 2;

// RIGHT — cached derived value
const doubled = createMemo(() => count() * 2);
```

### 4. Use `<Show>` and `<For>` control-flow components

Prefer Solid's control-flow components over JS conditionals and `.map()`.

```tsx
// WRONG
{open() && <Sidebar />}
{items().map(item => <Item item={item} />)}

// RIGHT
<Show when={open()} fallback={<EmptyState />}><Sidebar /></Show>
<For each={items()}>{item => <Item item={item} />}</For>
```

### 5. Use createEffect sparingly — last resort only

Effects are for external side-effects (DOM manipulation, third-party libs). Never use them to sync state or fetch data.

```tsx
// WRONG — fetching in an effect
createEffect(async () => {
  const data = await fetch("/api/posts").then(r => r.json());
  setPosts(data);
});

// RIGHT — use createResource
const [posts] = createResource(() => fetch("/api/posts").then(r => r.json()));

// WRONG — syncing derived state via effect
createEffect(() => setFullName(`${firstName()} ${lastName()}`));

// RIGHT — derive it
const fullName = () => `${firstName()} ${lastName()}`;
```

### 6. Derive as much as possible

Never use a signal + effect to mirror another signal. Use `createMemo` or a derived function instead.

```tsx
// WRONG
const [double, setDouble] = createSignal(0);
createEffect(() => setDouble(count() * 2));

// RIGHT
const double = createMemo(() => count() * 2);
```

### 7. Use stores for complex/nested objects

Signals replace entire objects on update. Stores provide fine-grained reactivity at the property level — better for nested data like Room categories.

```tsx
// Signal — must spread entire object
setBoard({ ...board(), notes: [...board().notes, "Note 3"] });

// Store — surgical update
setBoard("notes", notes => [...notes, "Note 3"]);
```
