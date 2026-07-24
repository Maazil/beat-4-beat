import {
  Component,
  createContext,
  createSignal,
  onCleanup,
  onMount,
  Show,
  type ParentComponent,
  useContext,
} from "solid-js";
import { Portal } from "solid-js/web";

export interface ConfirmOptions {
  /** Body text — what the user is agreeing to. */
  message: string;
  /** Optional heading above the message. */
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" paints the confirm button magenta for destructive actions. */
  tone?: "default" | "danger";
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>();

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

/**
 * App-wide confirmation dialog — the Stage Night, accessible replacement for
 * native `confirm()`. Mount once near the app root; read with `useConfirm()`,
 * which returns a function resolving to the user's choice:
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ message: "Delete this room?", tone: "danger" }))) return;
 */
export const ConfirmProvider: ParentComponent = (props) => {
  const [pending, setPending] = createSignal<PendingConfirm | null>(null);

  const confirm: ConfirmFn = (options) =>
    new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });

  const settle = (value: boolean) => {
    const current = pending();
    if (!current) return;
    current.resolve(value);
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {props.children}
      <Show when={pending()}>
        {(current) => (
          <ConfirmDialog
            options={current()}
            onConfirm={() => settle(true)}
            onCancel={() => settle(false)}
          />
        )}
      </Show>
    </ConfirmContext.Provider>
  );
};

const ConfirmDialog: Component<{
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
}> = (props) => {
  let dialogRef: HTMLDivElement | undefined;
  let confirmRef: HTMLButtonElement | undefined;
  // Return focus to whatever opened the dialog once it closes.
  const previouslyFocused = document.activeElement as HTMLElement | null;

  onMount(() => confirmRef?.focus());
  onCleanup(() => previouslyFocused?.focus?.());

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      props.onCancel();
      return;
    }
    if (e.key === "Tab") {
      // Two-button focus trap — keep Tab / Shift+Tab inside the dialog.
      const buttons = dialogRef?.querySelectorAll<HTMLElement>("button");
      if (!buttons || buttons.length === 0) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const isDanger = () => props.options.tone === "danger";

  return (
    <Portal>
      <div
        class="animate-backdrop-fade fixed inset-0 z-[110] flex items-center justify-center bg-night/70 p-4 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) props.onCancel();
        }}
        onKeyDown={onKeyDown}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={props.options.title ? "confirm-dialog-title" : undefined}
          aria-describedby="confirm-dialog-message"
          class="animate-card-expand w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-2xl"
        >
          <Show when={props.options.title}>
            <h2 id="confirm-dialog-title" class="font-display mb-2 text-lg font-bold text-ink">
              {props.options.title}
            </h2>
          </Show>
          <p id="confirm-dialog-message" class="text-sm text-muted">
            {props.options.message}
          </p>
          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={props.onCancel}
              class="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface-2"
            >
              {props.options.cancelLabel ?? "Cancel"}
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={props.onConfirm}
              class={`rounded-full px-4 py-2 text-sm font-bold transition ${
                isDanger()
                  ? "bg-magenta-hot text-ink hover:brightness-110"
                  : "bg-beat text-night hover:bg-beat-bright"
              }`}
            >
              {props.options.confirmLabel ?? "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

/** Access the confirm function. Must be called under a `ConfirmProvider`. */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return ctx;
}
