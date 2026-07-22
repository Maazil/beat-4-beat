// ── Safe post-sign-in redirect targets ────────────────────────────────
// The `?redirect=` param is attacker-influenceable (it comes from the URL a
// user can be handed), so it must never be used as an open redirect. Only
// in-app absolute paths are allowed: "//host" and "/\host" are
// protocol-relative external URLs, and anything without a leading "/" could
// be an absolute URL like "https://evil.example".

/**
 * Return `target` when it is a safe in-app path, otherwise `fallback`.
 * A safe target starts with a single "/" (not "//" or "/\").
 */
export function safeRedirectTarget(target: unknown, fallback = "/dashboard"): string {
  return typeof target === "string" &&
    target.startsWith("/") &&
    !target.startsWith("//") &&
    !target.startsWith("/\\")
    ? target
    : fallback;
}
