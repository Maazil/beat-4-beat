---
name: solid-testing
description: How to write and run tests in this repo — current vitest node setup for pure logic, and the recipe for adding Solid component/primitive tests (@solidjs/testing-library, renderHook, testEffect). Use when writing tests, adding test infra, or debugging test failures.
---

# Testing in beat-4-beat

## Current setup (pure logic only)

`vitest.config.ts` runs `src/**/*.test.ts` in a **node** environment — no DOM, no Solid plugin. Existing tests (`src/lib/*.test.ts`) cover pure functions (standings, roomHosts, spotify utils).

```bash
pnpm test        # vitest run (single pass)
pnpm test:watch  # vitest watch
```

**Default choice:** extract game logic / data transforms into pure functions in `src/lib/` and test those with plain vitest. This needs zero new infrastructure and covers most of what matters (scoring, standings, level math, URL parsing).

```ts
import { describe, expect, test } from "vitest";

test("computes standings with ties", () => {
  expect(computeStandings(scores)).toEqual([...]);
});
```

## Adding component / primitive tests (when logic can't be extracted)

The official Solid stack is vitest + jsdom + `@solidjs/testing-library`. Not yet installed in this repo — to add it:

1. `pnpm add -D jsdom @solidjs/testing-library @testing-library/user-event @testing-library/jest-dom`
2. Update `vitest.config.ts` — component tests need the Solid plugin and a DOM:

```ts
import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [solid()],
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "jsdom", // or keep "node" globally and put
    // // @vitest-environment jsdom  atop .tsx test files
  },
  resolve: { conditions: ["development", "browser"] },
});
```

3. `tsconfig.json` → `compilerOptions.types`: add `"@testing-library/jest-dom"`. `vite-plugin-solid` auto-loads jest-dom matchers if the package is present.

### Component test shape

```tsx
import { expect, test } from "vitest";
import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";

const user = userEvent.setup();

test("reveals the song", async () => {
  const { getByRole } = render(() => <SongCard item={item} />); // must be a thunk
  await user.click(getByRole("button", { name: /reveal/i }));
  expect(getByRole("heading")).toHaveTextContent(item.title);
});
```

- Query priority: `getByRole` > `getByLabelText` > `getByText` > … > `getByTestId` (last resort).
- `getBy*` throws if missing; `queryBy*` returns null (use to assert absence); `findBy*` is async — required as the _first_ query when using the `location` option or resource-driven components, since the router lazy-loads.
- **Routed components:** `render(() => <RoomView />, { location: "/rooms/abc" })` wraps in a router. Or render a `<Route>` definition and await `findByText`.
- **Context (AuthContext):** pass a `wrapper`: `render(() => <Comp />, { wrapper: (p) => <AuthProvider {...p} /> })`. For tests, a fake provider with a stubbed user beats mocking Firebase.
- **Portals** render outside the container — query via the `screen` export instead of the render result.
- **Fake timers** need `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })` alongside `vi.useFakeTimers()`.

### Hooks/primitives (useRoom, useGameState, …)

No component needed — `renderHook` runs the primitive under a real owner so `createEffect`/`onCleanup` work:

```tsx
import { renderHook, testEffect } from "@solidjs/testing-library";

const { result, cleanup } = renderHook(useGameState, { initialProps: [args] });
```

Mock the service layer (`vi.mock("../services/roomsService")`) and drive the subscription callback by hand — capture the callback passed to `subscribeToRoom` and invoke it with fixture rooms; assert the unsubscribe fn is called after `cleanup()`. Use `testEffect((done) => createEffect(...))` for asserting async reactive updates.

## What not to do

- Don't test Firestore itself — mock `src/services/`; the service layer exists precisely to be the seam.
- Don't add component-test infra for logic that could be a pure function in `src/lib/`.
- Don't assert on effect execution order — Solid doesn't guarantee it.
