import type { ParentComponent } from "solid-js";
import Logo from "../../components/Logo";

const PageWrapper: ParentComponent = (props) => {
  return (
    <div class="min-h-screen bg-[#f4f6f8] text-neutral-900">
      <header class="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div class="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <div class="flex items-center gap-3">
            <Logo class="h-8 w-auto" />
          </div>
          <nav class="flex items-center gap-5 text-sm font-medium text-neutral-600">
            <a class="hover:text-neutral-900" href="/dashboard">
              Hjem
            </a>
            <a class="hover:text-neutral-900" href="/dashboard/rooms">
              Rom
            </a>
            <a class="hover:text-neutral-900" href="/dashboard/profile">
              Profile
            </a>
          </nav>
        </div>
      </header>
      
      {props.children}
    </div>
  );
};

export default PageWrapper;
