// @vitest-environment jsdom
import { MemoryRouter, Route } from "@solidjs/router";
import { cleanup, render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    state: { user: { photoURL: null }, isLoading: false },
    userNameSplit: () => "Matt",
    isAuthenticated: () => true,
  }),
}));

// The guard needs auth + navigation of its own; the header is what's under test.
vi.mock("../../components/ProtectedRoute", () => ({
  default: (props: { children: JSX.Element }) => props.children,
}));

import PageWrapper from "./PageWrapper";

// `globals` is off in vitest.config, so the library's auto-cleanup never registers.
afterEach(cleanup);

const scrollTo = (y: number) => {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true, writable: true });
  window.dispatchEvent(new Event("scroll"));
};

const renderWrapper = () => {
  const { container } = render(() => (
    <MemoryRouter>
      <Route path="/" component={() => <PageWrapper>content</PageWrapper>} />
    </MemoryRouter>
  ));
  return () => container.querySelector("header")!.style.transform;
};

describe("PageWrapper header", () => {
  afterEach(() => scrollTo(0));

  test("shows at the top, hides on the way down, and returns on the way up", () => {
    const transform = renderWrapper();
    expect(transform()).toBe("translateY(0)");

    scrollTo(400);
    expect(transform()).toBe("translateY(-100%)");

    // The point of the fix: it comes back here, not only at scrollY 0.
    scrollTo(320);
    expect(transform()).toBe("translateY(0)");
  });

  test("starts from the restored scroll position rather than assuming the top", () => {
    scrollTo(500);
    const transform = renderWrapper();
    expect(transform()).toBe("translateY(0)");

    // Without the mount-time sync this 20px nudge would read as a 520px jump down.
    scrollTo(480);
    expect(transform()).toBe("translateY(0)");
    scrollTo(520);
    expect(transform()).toBe("translateY(-100%)");
  });
});
