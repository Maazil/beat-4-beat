import { createSignal, onCleanup } from "solid-js";

/**
 * Copy text to the clipboard with transient "Copied!" feedback.
 *
 * Returns a `copied` accessor that flips to `true` on a successful copy and
 * back to `false` after `resetMs`, plus a `copy(text)` action that resolves to
 * whether the write succeeded. Lets buttons confirm a copy inline instead of
 * firing a native `alert()`.
 */
export function useClipboardCopy(resetMs = 2000): {
  copied: () => boolean;
  copy: (text: string) => Promise<boolean>;
} {
  const [copied, setCopied] = createSignal(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  const copy = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(timer);
      timer = setTimeout(() => setCopied(false), resetMs);
      return true;
    } catch {
      return false;
    }
  };

  onCleanup(() => clearTimeout(timer));

  return { copied, copy };
}
