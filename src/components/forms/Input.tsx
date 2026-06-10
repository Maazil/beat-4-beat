import { Component, JSX, Show, splitProps } from "solid-js";

type InputType =
  | "text"
  | "password"
  | "email"
  | "number"
  | "tel"
  | "url"
  | "search"
  | "date"
  | "time"
  | "datetime-local"
  | "month"
  | "week"
  | "color"
  | "file"
  | "hidden"
  | "range";

type InputVariant = "default" | "ghost";

interface InputProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "type"> {
  type?: InputType;
  label?: string;
  error?: string;
  helperText?: string;
  variant?: InputVariant;
}

const Input: Component<InputProps> = (props) => {
  const [local, inputProps] = splitProps(props, [
    "label",
    "error",
    "helperText",
    "class",
    "id",
    "variant",
  ]);

  const inputId = () => local.id || `input-${Math.random().toString(36).slice(2, 9)}`;

  const isGhost = () => local.variant === "ghost";

  // Ghost variant: transparent, no border, blends with parent
  const ghostClass = "w-full bg-transparent outline-none caret-current placeholder-current/50";

  // Default variant: standard form input styling
  const defaultClass = () =>
    `w-full rounded-xl border bg-paper px-3 py-2 text-ink placeholder-muted/60 transition-colors focus:ring-2 focus:ring-offset-1 focus:outline-none ${
      local.error
        ? "border-beat focus:border-beat focus:ring-beat/20"
        : "border-line focus:border-beat focus:ring-beat/20"
    } disabled:cursor-not-allowed disabled:bg-sand disabled:text-muted`;

  const inputClass = () => `${isGhost() ? ghostClass : defaultClass()} ${local.class || ""}`;

  return (
    <Show
      when={!isGhost()}
      fallback={<input id={inputId()} {...inputProps} class={inputClass()} />}
    >
      <div class="flex flex-col gap-1">
        <Show when={local.label}>
          <label for={inputId()} class="text-sm font-medium text-ink">
            {local.label}
            {inputProps.required && <span class="ml-1 text-beat">*</span>}
          </label>
        </Show>
        <input
          id={inputId()}
          {...inputProps}
          class={inputClass()}
          aria-invalid={local.error ? "true" : undefined}
          aria-describedby={
            local.error
              ? `${inputId()}-error`
              : local.helperText
                ? `${inputId()}-helper`
                : undefined
          }
        />
        <Show when={local.error}>
          <p id={`${inputId()}-error`} class="text-sm text-beat" role="alert">
            {local.error}
          </p>
        </Show>
        <Show when={local.helperText && !local.error}>
          <p id={`${inputId()}-helper`} class="text-sm text-muted">
            {local.helperText}
          </p>
        </Show>
      </div>
    </Show>
  );
};

export default Input;
