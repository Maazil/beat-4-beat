import { createSignal, onCleanup } from "solid-js";

/** Outcome of the most recent copy attempt; resets to "idle" after `resetMs`. */
export type CopyStatus = "idle" | "copied" | "failed";

/**
 * Copy text to the clipboard with transient inline feedback.
 *
 * Returns a `status` accessor — "copied" after a successful write, "failed"
 * when the clipboard rejects (permission denied, insecure context), back to
 * "idle" after `resetMs` — plus a `copy(text)` action that resolves to whether
 * the write succeeded. Lets buttons report the outcome inline instead of firing
 * a native `alert()`, and never leaves a failed copy silent.
 */
export function useClipboardCopy(resetMs = 2000): {
  status: () => CopyStatus;
  copy: (text: string) => Promise<boolean>;
} {
  const [status, setStatus] = createSignal<CopyStatus>("idle");
  let timer: ReturnType<typeof setTimeout> | undefined;

  const settle = (next: Exclude<CopyStatus, "idle">) => {
    setStatus(next);
    clearTimeout(timer);
    timer = setTimeout(() => setStatus("idle"), resetMs);
  };

  const copy = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      settle("copied");
      return true;
    } catch {
      settle("failed");
      return false;
    }
  };

  onCleanup(() => clearTimeout(timer));

  return { status, copy };
}
