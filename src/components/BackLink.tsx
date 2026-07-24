import { A } from "@solidjs/router";
import { Component } from "solid-js";

interface BackLinkProps {
  /** Where "back" goes. Always an explicit route, never session history. */
  href: string;
  /** Defaults to "Back"; pass a destination when the page has siblings. */
  label?: string;
  /** Extra classes on the link — spacing, mostly. */
  class?: string;
}

/**
 * The one way back. A real link to an explicit route rather than
 * `history.back()`, so the destination is the same whether the page was
 * reached in-app or opened cold from a shared URL — and so it middle-clicks,
 * cmd-clicks and shows a target in the status bar like any other link.
 */
const BackLink: Component<BackLinkProps> = (props) => {
  return (
    <A
      href={props.href}
      class={`inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-beat ${props.class || ""}`}
    >
      <svg aria-hidden="true" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      {props.label ?? "Back"}
    </A>
  );
};

export default BackLink;
