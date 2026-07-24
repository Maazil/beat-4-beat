import {
  Component,
  createContext,
  createSignal,
  For,
  onCleanup,
  type ParentComponent,
  useContext,
} from "solid-js";
import { Portal } from "solid-js/web";

export type ToastVariant = "error" | "success" | "info";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastApi {
  /** Show a toast; defaults to the "info" variant. */
  show: (message: string, variant?: ToastVariant) => void;
  error: (message: string) => void;
  success: (message: string) => void;
  info: (message: string) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi>();

/** How long a toast stays up before auto-dismissing. */
const TOAST_DURATION_MS = 4000;

/** Newest win — a burst of failures shouldn't paper over the screen. */
const MAX_VISIBLE_TOASTS = 3;

/** Border + accent-dot classes per variant, using the Stage Night tokens. */
const VARIANT_STYLE: Record<ToastVariant, { border: string; dot: string }> = {
  error: { border: "border-magenta-hot/50", dot: "bg-magenta-hot" },
  success: { border: "border-beat/50", dot: "bg-beat" },
  info: { border: "border-line", dot: "bg-peri" },
};

/**
 * App-wide toast notifications — the Stage Night replacement for native
 * `alert()`. Mount once near the app root; read with `useToast()`.
 *
 * Toasts stack bottom-center (newest last, at most `MAX_VISIBLE_TOASTS`),
 * auto-dismiss after a few seconds, and can be dismissed early. Errors announce
 * assertively (`role="alert"`); success/info announce politely (`role="status"`).
 */
export const ToastProvider: ParentComponent = (props) => {
  const [toasts, setToasts] = createSignal<Toast[]>([]);
  const timers = new Map<number, ReturnType<typeof setTimeout>>();
  let nextId = 0;

  const clearTimer = (id: number) => {
    const timer = timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timers.delete(id);
    }
  };

  const dismiss = (id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    clearTimer(id);
  };

  const show = (message: string, variant: ToastVariant = "info") => {
    const id = nextId++;
    setToasts((list) => {
      const next = [...list, { id, message, variant }];
      // Cancel the timers of the ones we're about to drop off the top
      for (const stale of next.slice(0, -MAX_VISIBLE_TOASTS)) clearTimer(stale.id);
      return next.slice(-MAX_VISIBLE_TOASTS);
    });
    timers.set(
      id,
      setTimeout(() => dismiss(id), TOAST_DURATION_MS),
    );
  };

  onCleanup(() => {
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
  });

  // Errors interrupt whatever the screen reader is saying; everything else
  // waits its turn, so the two go to separate live regions.
  const errorToasts = () => toasts().filter((t) => t.variant === "error");
  const politeToasts = () => toasts().filter((t) => t.variant !== "error");

  const api: ToastApi = {
    show,
    error: (message) => show(message, "error"),
    success: (message) => show(message, "success"),
    info: (message) => show(message, "info"),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {props.children}
      <Portal>
        {/* Announcement and presentation are split on purpose. Screen readers
            reliably announce text inserted into a live region that was already
            in the DOM, but routinely miss a region that appears together with
            its content — which is what a per-toast role="alert" is. So these two
            regions are mounted for the life of the app and the toast messages
            are inserted into them; the visible cards hide their text from the
            a11y tree so nothing is announced or read twice.
            aria-atomic="false" so a second message announces on its own rather
            than re-reading every message still on screen. */}
        <div
          role="alert"
          aria-atomic="false"
          class="sr-only"
          data-testid="toast-announcer-assertive"
        >
          <For each={errorToasts()}>{(toast) => <p>{toast.message}</p>}</For>
        </div>
        <div role="status" aria-atomic="false" class="sr-only" data-testid="toast-announcer-polite">
          <For each={politeToasts()}>{(toast) => <p>{toast.message}</p>}</For>
        </div>

        {/* Positioning only — see above for why the cards carry no live region */}
        <div class="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4">
          <For each={toasts()}>
            {(toast) => <ToastCard toast={toast} onDismiss={() => dismiss(toast.id)} />}
          </For>
        </div>
      </Portal>
    </ToastContext.Provider>
  );
};

const ToastCard: Component<{ toast: Toast; onDismiss: () => void }> = (props) => (
  <div
    class={`animate-rise-in pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border bg-surface px-4 py-3 shadow-xl ${
      VARIANT_STYLE[props.toast.variant].border
    }`}
  >
    <span
      aria-hidden="true"
      class={`h-2 w-2 shrink-0 rounded-full ${VARIANT_STYLE[props.toast.variant].dot}`}
    />
    {/* Left in the a11y tree even though the announcer regions above carry the
        same text: the announcement fires once (only those regions are live),
        and without it a user landing on the dismiss button has no idea what
        they'd be dismissing. */}
    <span class="text-sm font-medium text-ink">{props.toast.message}</span>
    <button
      type="button"
      onClick={props.onDismiss}
      aria-label="Dismiss notification"
      class="-mr-1 ml-auto shrink-0 rounded-full px-1.5 text-lg leading-none text-muted transition hover:text-ink"
    >
      ×
    </button>
  </div>
);

/** Access the toast API. Must be called under a `ToastProvider`. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
