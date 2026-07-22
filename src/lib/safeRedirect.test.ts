import { describe, expect, it } from "vitest";
import { safeRedirectTarget } from "./safeRedirect";

describe("safeRedirectTarget", () => {
  it("allows in-app absolute paths", () => {
    expect(safeRedirectTarget("/dashboard")).toBe("/dashboard");
    expect(safeRedirectTarget("/invite/abc/tok?x=1")).toBe("/invite/abc/tok?x=1");
    expect(safeRedirectTarget("/")).toBe("/");
  });

  it("rejects protocol-relative external URLs", () => {
    expect(safeRedirectTarget("//evil.example")).toBe("/dashboard");
    expect(safeRedirectTarget("/\\evil.example")).toBe("/dashboard");
  });

  it("rejects absolute and non-path targets", () => {
    expect(safeRedirectTarget("https://evil.example")).toBe("/dashboard");
    expect(safeRedirectTarget("dashboard")).toBe("/dashboard");
    expect(safeRedirectTarget("javascript:alert(1)")).toBe("/dashboard");
  });

  it("rejects non-string values", () => {
    expect(safeRedirectTarget(undefined)).toBe("/dashboard");
    expect(safeRedirectTarget(null)).toBe("/dashboard");
    expect(safeRedirectTarget(["/dashboard", "/other"])).toBe("/dashboard");
  });

  it("honours a custom fallback", () => {
    expect(safeRedirectTarget(undefined, "/login")).toBe("/login");
    expect(safeRedirectTarget("//evil.example", "/")).toBe("/");
  });
});
