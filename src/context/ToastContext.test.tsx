// @vitest-environment jsdom
import { cleanup, render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { ToastProvider, useToast } from "./ToastContext";

/** Mounts the provider with a probe that hands the toast API to the test. */
const renderToasts = () => {
  let api!: ReturnType<typeof useToast>;
  const Probe = () => {
    api = useToast();
    return null;
  };
  render(() => (
    <ToastProvider>
      <Probe />
    </ToastProvider>
  ));
  // Toasts live in a Portal, so queries go through `screen`, not the container
  return api;
};

afterEach(() => {
  // `globals` is off in vitest.config, so the library's auto-cleanup never
  // registers — without this, portalled toasts leak into the next test.
  cleanup();
  vi.useRealTimers();
});

describe("ToastProvider", () => {
  test("shows a message and auto-dismisses it", () => {
    vi.useFakeTimers();
    const toast = renderToasts();

    toast.info("Playlist imported");
    expect(screen.getByText("Playlist imported")).toBeTruthy();

    vi.advanceTimersByTime(4000);
    expect(screen.queryByText("Playlist imported")).toBeNull();
  });

  test("dismisses early on the dismiss button", async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const toast = renderToasts();

    toast.error("Could not save");
    await user.click(screen.getByRole("button", { name: /dismiss notification/i }));

    expect(screen.queryByText("Could not save")).toBeNull();
  });

  test("announces errors assertively and everything else politely", () => {
    const toast = renderToasts();

    toast.error("Broken");
    toast.success("Saved");

    expect(screen.getByRole("alert").textContent).toContain("Broken");
    expect(screen.getByRole("status").textContent).toContain("Saved");
  });

  test("keeps only the newest toasts when they pile up", () => {
    const toast = renderToasts();

    for (const message of ["first", "second", "third", "fourth"]) toast.info(message);

    expect(screen.queryByText("first")).toBeNull();
    expect(screen.getAllByRole("status")).toHaveLength(3);
    expect(screen.getByText("fourth")).toBeTruthy();
  });

  test("useToast outside a provider is a programming error", () => {
    expect(() => render(() => <>{useToast().info("nope")}</>)).toThrow(/ToastProvider/);
  });
});
