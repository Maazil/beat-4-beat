import { Component, JSX, splitProps } from "solid-js";

type ButtonVariant = "primary" | "secondary" | "destructive" | "spotify";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full transition " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beat " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-night " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-beat font-bold text-night shadow-[0_8px_30px_rgba(234,196,53,0.28)] hover:bg-beat-bright",
  secondary: "border border-line font-semibold text-ink hover:border-beat hover:bg-beat-soft",
  destructive:
    "border border-magenta-hot/40 font-semibold text-magenta-hot hover:border-magenta-hot hover:bg-magenta-hot/10",
  spotify: "bg-spotify font-bold text-ink hover:brightness-110",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3",
  icon: "h-10 w-10",
};

/**
 * The one Stage Night button: gold pill by default, with secondary /
 * destructive / spotify variants and a shared keyboard-focus ring.
 * Extra classes (widths, margins, one-off flourishes) pass through `class`.
 */
const Button: Component<ButtonProps> = (props) => {
  const [local, buttonProps] = splitProps(props, ["variant", "size", "class"]);

  const buttonClass = () =>
    `${BASE} ${VARIANTS[local.variant ?? "primary"]} ${SIZES[local.size ?? "md"]} ${local.class ?? ""}`;

  return <button type="button" {...buttonProps} class={buttonClass()} />;
};

export default Button;
