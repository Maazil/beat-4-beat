import { A, useNavigate } from "@solidjs/router";
import { type Component, createSignal, For, Show } from "solid-js";

export interface LandingNavLink {
  label: string;
  /** In-page anchors start with "#"; anything else is an app route. */
  href: string;
}

const NavLink: Component<{ link: LandingNavLink; onNavigate?: () => void }> = (props) => (
  <Show
    when={props.link.href.startsWith("#")}
    fallback={
      <A href={props.link.href} onClick={() => props.onNavigate?.()}>
        {props.link.label}
      </A>
    }
  >
    <a href={props.link.href} onClick={() => props.onNavigate?.()}>
      {props.link.label}
    </a>
  </Show>
);

/**
 * Shared marketing-page nav (landing + host guide). Styles live in
 * `stage-night.css`, which each page already imports.
 *
 * Wide screens get the links inline. Under 720px they collapse into a
 * hamburger panel — "Sign in" stays in the bar either way, since it's the one
 * thing a visitor is most likely to be reaching for.
 */
const LandingNav: Component<{ links: LandingNavLink[] }> = (props) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = createSignal(false);

  return (
    <nav
      onKeyDown={(e) => {
        if (e.key === "Escape") setIsOpen(false);
      }}
    >
      <a class="wordmark" href="/">
        <span class="tick" />
        BEAT 4 BEAT
      </a>
      <div class="navlinks">
        <For each={props.links}>{(link) => <NavLink link={link} />}</For>
        <button type="button" class="btn-signin" onClick={() => navigate("/login")}>
          Sign in
        </button>
        <button
          type="button"
          class="navtoggle"
          aria-label={isOpen() ? "Close menu" : "Open menu"}
          aria-expanded={isOpen()}
          onClick={() => setIsOpen(!isOpen())}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M3 6h14M3 10h14M3 14h14"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <Show when={isOpen()}>
        {/* Tap-anywhere-else to dismiss; Escape covers the keyboard path. */}
        <div class="navbackdrop" aria-hidden="true" onClick={() => setIsOpen(false)} />
        <div class="navmenu">
          <For each={props.links}>
            {(link) => <NavLink link={link} onNavigate={() => setIsOpen(false)} />}
          </For>
        </div>
      </Show>
    </nav>
  );
};

export default LandingNav;
