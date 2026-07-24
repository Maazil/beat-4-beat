// @vitest-environment jsdom
import { MemoryRouter, Route } from "@solidjs/router";
import { cleanup, render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "vitest";
import LandingNav, { type LandingNavLink } from "./LandingNav";

// `globals` is off in vitest.config, so the library's auto-cleanup never registers.
afterEach(cleanup);

const user = userEvent.setup();

const LINKS: LandingNavLink[] = [
  { label: "How it plays", href: "#how" },
  { label: "Marketplace", href: "/market" },
];

const renderNav = () =>
  render(() => (
    <MemoryRouter>
      <Route path="/" component={() => <LandingNav links={LINKS} />} />
    </MemoryRouter>
  ));

describe("LandingNav", () => {
  test("renders the links inline and keeps the menu closed", () => {
    const { getByRole, container } = renderNav();

    expect(getByRole("button", { name: "Open menu" })).toHaveAttribute("aria-expanded", "false");
    expect(container.querySelector(".navmenu")).toBeNull();
    // The inline copies are always in the DOM; CSS hides them under 720px.
    expect(container.querySelectorAll(".navlinks a")).toHaveLength(LINKS.length);
  });

  test("the hamburger toggles the menu panel", async () => {
    const { getByRole, container } = renderNav();

    await user.click(getByRole("button", { name: "Open menu" }));
    expect(container.querySelectorAll(".navmenu a")).toHaveLength(LINKS.length);

    await user.click(getByRole("button", { name: "Close menu" }));
    expect(container.querySelector(".navmenu")).toBeNull();
  });

  test("closes on a link tap, a backdrop tap, and Escape", async () => {
    const { getByRole, container } = renderNav();
    const open = () => getByRole("button", { name: "Open menu" });
    const menuLink = (label: string) =>
      [...container.querySelectorAll<HTMLAnchorElement>(".navmenu a")].find(
        (a) => a.textContent === label,
      )!;

    await user.click(open());
    await user.click(menuLink("How it plays"));
    expect(container.querySelector(".navmenu")).toBeNull();

    await user.click(open());
    await user.click(container.querySelector(".navbackdrop")!);
    expect(container.querySelector(".navmenu")).toBeNull();

    await user.click(open());
    await user.keyboard("{Escape}");
    expect(container.querySelector(".navmenu")).toBeNull();
  });
});
