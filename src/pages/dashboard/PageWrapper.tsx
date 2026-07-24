import { A } from "@solidjs/router";
import { createMemo, createSignal, onCleanup, onMount, type ParentComponent } from "solid-js";
import Logo from "../../components/Logo";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import { initialHeaderState, nextHeaderState } from "../../lib/headerScroll";

const PageWrapper: ParentComponent = (props) => {
  const auth = useAuth();
  const [headerScroll, setHeaderScroll] = createSignal(initialHeaderState());
  // Only the flag reaches the DOM, so scrolling within a direction is free.
  const isHidden = createMemo(() => headerScroll().hidden);

  const handleScroll = () => {
    setHeaderScroll((prev) => nextHeaderState(prev, window.scrollY));
  };

  onMount(() => {
    // The page may be restored mid-scroll; start from wherever we actually are.
    setHeaderScroll(initialHeaderState(window.scrollY));
    window.addEventListener("scroll", handleScroll, { passive: true });
  });

  onCleanup(() => {
    window.removeEventListener("scroll", handleScroll);
  });

  return (
    <ProtectedRoute>
      <div class="bg-stage min-h-screen text-ink">
        <header
          class="sticky top-0 z-20 border-b border-line bg-night/95 transition-transform duration-300 md:bg-night/85 md:backdrop-blur"
          style={{
            transform: isHidden() ? "translateY(-100%)" : "translateY(0)",
          }}
        >
          <div class="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
            <A class="flex items-center gap-3" href="/dashboard">
              <Logo class="h-8 w-auto" />
            </A>
            <nav class="flex items-center gap-5 text-sm font-medium text-muted">
              <A class="flex items-center gap-2 transition hover:text-ink" href="/profile">
                <p>Hi {auth.userNameSplit()}</p>
                <img
                  src={auth.state.user?.photoURL || "/images/default-avatar.png"}
                  class="h-8 w-8 rounded-full border border-line"
                  alt="User image"
                  referrerpolicy="no-referrer"
                />
              </A>
            </nav>
          </div>
        </header>

        {props.children}
      </div>
    </ProtectedRoute>
  );
};

export default PageWrapper;
