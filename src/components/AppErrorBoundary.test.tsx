// @vitest-environment jsdom
import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
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

  test("Try again re-renders the subtree, recovering once the cause is gone", async () => {
    const [broken, setBroken] = createSignal(true);

    const { getByRole, findByText } = render(() => (
      <AppErrorBoundary>
        {broken() ? <Boom message="transient" /> : <p>recovered</p>}
      </AppErrorBoundary>
    ));

    expect(getByRole("alert")).toBeInTheDocument();

    setBroken(false);
    getByRole("button", { name: "Try again" }).click();

    expect(await findByText("recovered")).toBeInTheDocument();
  });
});
