import {
  createSignal,
  onCleanup,
  onMount,
  type ParentComponent,
} from "solid-js";
import Logo from "../../components/Logo";
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
    <div class="min-h-screen bg-[#f4f6f8] text-neutral-900">
      <header
        class="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 backdrop-blur transition-transform duration-300"
        style={{
          transform: isAtTop() ? "translateY(0)" : "translateY(-100%)",
        }}
      >
        <div class="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <div class="flex items-center gap-3">
            <Logo class="h-8 w-auto" />
          </div>
          <nav class="flex items-center gap-5 text-sm font-medium text-neutral-600">
            <a class="hover:text-neutral-900" href="/dashboard">
              Hjem
            </a>
            <a class="hover:text-neutral-900" href="/rooms">
              Rom
            </a>
            <a class="hover:text-neutral-900" href="/profile">
              Profile
            </a>
            <a
              class="hover:text-neutral-900"
              href="/"
              onClick={() => auth.signOut()}
            >
              Logg ut
            </a>
          </nav>
        </div>
      </header>

      {props.children}
    </div>
  );
};

export default PageWrapper;
