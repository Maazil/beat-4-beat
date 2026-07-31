// @vitest-environment jsdom
import { cleanup, render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createSignal, Show } from "solid-js";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import AppErrorBoundary from "./AppErrorBoundary";

// `globals` is off in vitest.config, so the library's auto-cleanup never registers.
afterEach(cleanup);

// The fallback logs the error on purpose; keep it out of the test output, and
// assert on it where that's the behaviour under test.
let consoleError: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => consoleError.mockRestore());

const Boom = (props: { message: string }) => {
  throw new Error(props.message);
};

describe("AppErrorBoundary", () => {
  test("renders its children when nothing throws", () => {
    const { getByText, queryByRole } = render(() => (
      <AppErrorBoundary>
        <p>all good</p>
      </AppErrorBoundary>
    ));

    expect(getByText("all good")).toBeInTheDocument();
    expect(queryByRole("alert")).toBeNull();
  });

  test("catches a render throw and offers a reload", () => {
    const { getByRole } = render(() => (
      <AppErrorBoundary>
        <Boom message="kaboom" />
      </AppErrorBoundary>
    ));

    expect(getByRole("alert")).toBeInTheDocument();
    expect(getByRole("heading", { name: "Something went wrong." })).toBeInTheDocument();
    expect(getByRole("button", { name: "Reload the page" })).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();
  });

  test("a stale-chunk error asks for a reload instead of a retry", () => {
    const { getByRole, queryByRole } = render(() => (
      <AppErrorBoundary>
        <Boom message="Failed to fetch dynamically imported module: /assets/RoomPlay-abc.js" />
      </AppErrorBoundary>
    ));

    expect(getByRole("heading", { name: "This tab is out of date" })).toBeInTheDocument();
    expect(getByRole("button", { name: "Reload the page" })).toBeInTheDocument();
    // Retrying would just re-request the chunk that's already gone.
    expect(queryByRole("button", { name: "Try again" })).toBeNull();
  });

  test("a failed CSS preload counts as a stale chunk too", () => {
    // Vite's preload helper throws this when a lazy chunk's stylesheet is the
    // file the deploy removed — same cause, same fix, so same panel.
    const { getByRole, queryByRole } = render(() => (
      <AppErrorBoundary>
        <Boom message="Unable to preload CSS for /assets/RoomPlay-abc.css" />
      </AppErrorBoundary>
    ));

    expect(getByRole("heading", { name: "This tab is out of date" })).toBeInTheDocument();
    expect(queryByRole("button", { name: "Try again" })).toBeNull();
  });

  test("an ordinary network failure is not mistaken for a stale build", () => {
    // "Failed to fetch" on its own is what a browser gives for any failed
    // request. Treating it as a stale chunk would tell the user to reload for
    // a deploy that isn't the problem, and drop the retry that would help.
    const { getByRole, queryByRole } = render(() => (
      <AppErrorBoundary>
        <Boom message="Failed to fetch" />
      </AppErrorBoundary>
    ));

    expect(getByRole("heading", { name: "Something went wrong." })).toBeInTheDocument();
    expect(queryByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  test("prints the error message in dev only", () => {
    // vitest runs with DEV true, so this asserts the block renders at all —
    // the production half of the gate is what `import.meta.env.DEV` buys.
    const { getByText } = render(() => (
      <AppErrorBoundary>
        <Boom message="internals worth hiding in prod" />
      </AppErrorBoundary>
    ));

    expect(getByText("internals worth hiding in prod")).toBeInTheDocument();
  });

  test("keeps the main landmark, with the alert on the message", () => {
    const { getByRole } = render(() => (
      <AppErrorBoundary>
        <Boom message="kaboom" />
      </AppErrorBoundary>
    ));

    // An explicit role on <main> would replace the landmark rather than add to it.
    expect(getByRole("main")).toBeInTheDocument();
    expect(getByRole("main")).toContainElement(getByRole("alert"));
  });

  test("Try again re-renders the subtree, recovering once the cause is gone", async () => {
    const [broken, setBroken] = createSignal(true);

    const { getByRole, findByText } = render(() => (
      <AppErrorBoundary>
        <Show when={broken()} fallback={<p>recovered</p>}>
          <Boom message="transient" />
        </Show>
      </AppErrorBoundary>
    ));

    expect(getByRole("alert")).toBeInTheDocument();

    setBroken(false);
    await userEvent.setup().click(getByRole("button", { name: "Try again" }));

    expect(await findByText("recovered")).toBeInTheDocument();
  });
});
