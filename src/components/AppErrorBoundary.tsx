import { ErrorBoundary, ParentComponent, Show } from "solid-js";
import Button from "./forms/Button";

/** Message to show for an error whose own message isn't worth reading. */
const GENERIC = "Something went wrong.";

/**
 * A failed `lazy()` chunk usually means the deploy moved underneath a
 * long-lived tab: the HTML this session loaded points at hashed files that no
 * longer exist. Reloading is the actual fix, so say so instead of offering
 * "try again", which would just re-request the same missing chunk.
 *
 * Both patterns require the words that name a *module* load — Vite throws
 * "Failed to fetch dynamically imported module: <url>", Safari "Importing a
 * module script failed". Matching a bare "Failed to fetch" would swallow every
 * ordinary network failure that reaches render (a Firestore read, a Spotify
 * call) and tell the user to reload for a stale build that isn't the problem,
 * while hiding the "Try again" that would actually help a transient blip.
 */
function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /dynamically imported module|Importing a module script failed/i.test(message);
}

/**
 * Last-resort error boundary around the whole app.
 *
 * Without one, a throw while rendering takes the page to blank white with the
 * error only in the console — no way back except the browser's reload button.
 *
 * Scope worth knowing: Solid's `ErrorBoundary` catches throws from rendering
 * and from the computations beneath it. It does NOT catch rejected promises in
 * event handlers or `setTimeout` callbacks — those still need their own
 * try/catch at the call site, which is why the services and hooks keep theirs.
 */
const AppErrorBoundary: ParentComponent = (props) => (
  <ErrorBoundary
    fallback={(error: unknown, reset: () => void) => {
      // The console entry is what a bug report gets pasted from — the panel
      // deliberately shows very little.
      console.error("[AppErrorBoundary] Unhandled error:", error);
      const stale = isChunkLoadError(error);

      return (
        <main class="bg-stage relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6 text-center">
          <div class="bg-halftone pointer-events-none absolute inset-0 opacity-60" />
          {/* The role goes on the message, not on <main> — an explicit role
              replaces the implicit landmark, and the page would lose its
              `main` entirely. A real flex column rather than `display:
              contents`, which browsers have dropped from the accessibility
              tree and would take the alert with it. */}
          <div role="alert" class="relative flex flex-col items-center">
            <p class="font-mono text-xs font-semibold tracking-[0.35em] text-beat uppercase">
              ♪ Needle skipped
            </p>
            <h1 class="font-display mt-4 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
              {stale ? "This tab is out of date" : GENERIC}
            </h1>
            <p class="mt-4 max-w-sm text-muted">
              {stale
                ? "A new version shipped while this tab was open. Reloading picks it up."
                : "The page hit an error it couldn't recover from on its own."}
            </p>
          </div>

          {/* Dev-only: production users get nothing they could act on, and the
              message can carry internals worth not printing on screen. */}
          <Show when={import.meta.env.DEV && error instanceof Error}>
            <pre class="relative mt-6 max-w-xl overflow-x-auto rounded-xl border border-line bg-surface p-4 text-left font-mono text-xs text-muted">
              {(error as Error).message}
            </pre>
          </Show>

          <div class="relative mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={() => window.location.reload()}>
              Reload the page
            </Button>
            {/* `reset` re-renders the subtree that threw. Worth offering for a
                transient failure, but not for a stale chunk — that would just
                re-request the file that's already gone. */}
            <Show when={!stale}>
              <Button variant="secondary" size="lg" onClick={reset}>
                Try again
              </Button>
            </Show>
          </div>
        </main>
      );
    }}
  >
    {props.children}
  </ErrorBoundary>
);

export default AppErrorBoundary;
