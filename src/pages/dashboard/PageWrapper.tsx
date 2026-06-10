import { A } from "@solidjs/router";
import { createSignal, onCleanup, onMount, type ParentComponent } from "solid-js";
import Logo from "../../components/Logo";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";

const PageWrapper: ParentComponent = (props) => {
  const auth = useAuth();
  const [isAtTop, setIsAtTop] = createSignal(true);

  const handleScroll = () => {
    setIsAtTop(window.scrollY < 50);
  };

  onMount(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
  });

  onCleanup(() => {
    window.removeEventListener("scroll", handleScroll);
  });

  return (
    <ProtectedRoute>
      <div class="bg-stage min-h-screen text-ink">
        <header
          class="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur transition-transform duration-300"
          style={{
            transform: isAtTop() ? "translateY(0)" : "translateY(-100%)",
          }}
        >
          <div class="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
            <A class="flex items-center gap-3" href="/dashboard">
              <Logo class="h-8 w-auto" />
            </A>
            <nav class="flex items-center gap-5 text-sm font-medium text-muted">
              <A class="flex items-center gap-2 transition hover:text-beat" href="/profile">
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
