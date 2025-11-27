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
          <a class="flex items-center gap-3" href="/dashboard">
            <Logo class="h-8 w-auto" />
          </a>
          <nav class="flex items-center gap-5 text-sm font-medium text-neutral-600">
            <a
              class="flex items-center gap-2 hover:text-neutral-900"
              href="/profile"
            >
              <p>Hei {auth.userNameSplit()}</p>
              <img
                src={auth.state.user?.photoURL || "/default-avatar.png"}
                class="h-8 w-8 rounded-full"
                alt="Solid logo"
              />
            </a>
          </nav>
        </div>
      </header>

      {props.children}
    </div>
  );
};

export default PageWrapper;
