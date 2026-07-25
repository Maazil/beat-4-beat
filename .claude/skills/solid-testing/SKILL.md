---
name: solid-testing
description: How to write and run tests in this repo — the vitest + jsdom + @solidjs/testing-library setup, when to prefer a pure-logic test, and the recipes for component/primitive tests (render, renderHook, testEffect). Use when writing tests, adding test infra, or debugging test failures.
---

# Testing in beat-4-beat

## Current setup

`vitest.config.ts` runs `src/**/*.test.{ts,tsx}` through the Solid plugin in a
**jsdom** environment, with `vitest.setup.ts` registering the jest-dom matchers.
Both pure-logic tests (`src/lib/*.test.ts`) and component/primitive tests
(`*.test.tsx` via `@solidjs/testing-library`) already exist and run together.

```bash
pnpm test        # vitest run (single pass)
pnpm test:watch  # vitest watch
```

`pnpm test` runs in CI on every PR (`.github/workflows/typescript.yml`).

`globals` is off, so every file imports its own `describe`/`test`/`expect` from
`vitest` — and component tests must register `afterEach(cleanup)` themselves,
since the testing library's auto-cleanup hooks onto globals that aren't there.

**Default choice:** extract game logic / data transforms into pure functions in `src/lib/` and test those with plain vitest. This needs zero new infrastructure and covers most of what matters (scoring, standings, level math, URL parsing).

```ts
import { describe, expect, test } from "vitest";

test("computes standings with ties", () => {
  expect(computeStandings(scores)).toEqual([...]);
});
```

## Component / primitive tests (when logic can't be extracted)

The infrastructure is already in place — `jsdom`, `@solidjs/testing-library`,
`@testing-library/user-event` and `@testing-library/jest-dom` are all installed,
and `vitest.setup.ts`'s `import "@testing-library/jest-dom/vitest"` both registers
the matchers and augments vitest's `expect` types (so nothing needs to go in
`tsconfig.json`'s `types`). Just add a `*.test.tsx` next to the thing under test.
Working examples to copy from:
`src/components/Scoreboard.test.tsx`, `src/pages/dashboard/PageWrapper.test.tsx`,
`src/hooks/useCategoryImages.test.tsx`.

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
