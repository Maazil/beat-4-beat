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

// A live toast's message is in the DOM twice — on its visible card, and in the
// announcer region that reads it out — so presence is a count, not a lookup.
const isShowing = (message: string) => screen.queryAllByText(message).length > 0;

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
    expect(isShowing("Playlist imported")).toBe(true);

    vi.advanceTimersByTime(4000);
    expect(isShowing("Playlist imported")).toBe(false);
  });

  test("dismisses early on the dismiss button", async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const toast = renderToasts();

    toast.error("Could not save");
    await user.click(screen.getByRole("button", { name: /dismiss notification/i }));

    expect(isShowing("Could not save")).toBe(false);
  });

  test("announces errors assertively and everything else politely", () => {
    const toast = renderToasts();

    toast.error("Broken");
    toast.success("Saved");

    expect(screen.getByRole("alert").textContent).toBe("Broken");
    expect(screen.getByRole("status").textContent).toBe("Saved");
  });

  test("mounts both announcer regions before any toast exists", () => {
    // Screen readers routinely miss a live region that appears together with its
    // content, so the regions have to be in the DOM ahead of the first message.
    renderToasts();

    expect(screen.getByRole("alert").textContent).toBe("");
    expect(screen.getByRole("status").textContent).toBe("");
  });

  test("keeps only the newest toasts when they pile up", () => {
    const toast = renderToasts();

    for (const message of ["first", "second", "third", "fourth"]) toast.info(message);

    expect(isShowing("first")).toBe(false);
    expect(screen.getAllByRole("button", { name: /dismiss notification/i })).toHaveLength(3);
    expect(screen.getByRole("status").textContent).toBe("secondthirdfourth");
  });

  test("useToast outside a provider is a programming error", () => {
    expect(() => render(() => <>{useToast().info("nope")}</>)).toThrow(/ToastProvider/);
  });
});
