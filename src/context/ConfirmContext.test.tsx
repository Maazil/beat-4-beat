// @vitest-environment jsdom
import { cleanup, render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "vitest";
import { ConfirmProvider, useConfirm } from "./ConfirmContext";

// `globals` is off in vitest.config, so the library's auto-cleanup never
// registers — the portalled dialog would leak into the next test.
afterEach(cleanup);

const user = userEvent.setup();

/** Mounts the provider with an opener button + the confirm fn for the test. */
const renderConfirm = () => {
  let confirm!: ReturnType<typeof useConfirm>;
  const Probe = () => {
    confirm = useConfirm();
    return (
      <button type="button" data-testid="opener">
        Open
      </button>
    );
  };
  render(() => (
    <ConfirmProvider>
      <Probe />
    </ConfirmProvider>
  ));
  // The dialog is portalled, so it's queried through `screen`
  return confirm;
};

describe("ConfirmProvider", () => {
  test("resolves true when confirmed and false when cancelled", async () => {
    const confirm = renderConfirm();

    const accepted = confirm({ title: "Delete room", message: "Sure?" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await expect(accepted).resolves.toBe(true);
    expect(screen.queryByRole("dialog")).toBeNull();

    const declined = confirm({ message: "Sure?" });
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await expect(declined).resolves.toBe(false);
  });

  test("uses the given labels and describes itself for assistive tech", async () => {
    const confirm = renderConfirm();

    const answer = confirm({
      title: "New game",
      message: "The board resets.",
      confirmLabel: "Start new game",
      cancelLabel: "Keep playing",
    });

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAccessibleName("New game");
    expect(dialog).toHaveAccessibleDescription("The board resets.");
    await user.click(screen.getByRole("button", { name: "Keep playing" }));
    await expect(answer).resolves.toBe(false);
  });

  test("cancels on Escape", async () => {
    const confirm = renderConfirm();

    const answer = confirm({ message: "Sure?" });
    await user.keyboard("{Escape}");

    await expect(answer).resolves.toBe(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("settles a displaced ask as cancelled instead of hanging it", async () => {
    const confirm = renderConfirm();

    const first = confirm({ message: "First?" });
    const second = confirm({ message: "Second?" });

    // The first caller must not be left awaiting a promise nobody resolves
    await expect(first).resolves.toBe(false);
    expect(screen.getByText("Second?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await expect(second).resolves.toBe(true);
  });

  test("takes focus, locks the page, then hands both back", async () => {
    const confirm = renderConfirm();
    const opener = screen.getByTestId("opener");
    opener.focus();

    const answer = confirm({ message: "Sure?" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Confirm" }));
    expect(document.body.style.overflow).toBe("hidden");

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await answer;

    expect(document.activeElement).toBe(opener);
    expect(document.body.style.overflow).toBe("");
  });

  test("useConfirm outside a provider is a programming error", () => {
    expect(() => render(() => <>{String(useConfirm())}</>)).toThrow(/ConfirmProvider/);
  });
});
