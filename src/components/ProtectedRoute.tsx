import { useNavigate } from "@solidjs/router";
import { ParentComponent, Show, createEffect } from "solid-js";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  requireHost?: boolean;
  roomHostId?: string;
}

const ProtectedRoute: ParentComponent<ProtectedRouteProps> = (props) => {
  const auth = useAuth();
  const navigate = useNavigate();

  createEffect(() => {
    if (auth.state.isLoading) return;

    if (!auth.isAuthenticated()) {
      navigate("/login", { replace: true });
      return;
    }

    if (props.requireHost && !auth.isRoomHost(props.roomHostId)) {
      navigate("/", { replace: true });
    }
  });

  const hasAccess = () => {
    if (!auth.isAuthenticated()) return false;
    if (props.requireHost && !auth.isRoomHost(props.roomHostId)) return false;
    return true;
  };

  return (
    <Show
      when={!auth.state.isLoading}
      fallback={
        <div class="flex min-h-screen items-center justify-center bg-[#f4f6f8]">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-700" />
        </div>
      }
    >
      <Show
        when={hasAccess()}
        fallback={
          <div class="flex min-h-screen items-center justify-center bg-[#f4f6f8]">
            <div class="text-center">
              <h2 class="mb-4 text-2xl font-bold text-neutral-900">Tilgang nektet</h2>
              <p class="mb-6 text-neutral-600">
                {!auth.isAuthenticated()
                  ? "Du må være logget inn for å se denne siden."
                  : "Kun rom-verten har tilgang til denne siden."}
              </p>
              <button
                type="button"
                onClick={() => navigate(auth.isAuthenticated() ? "/" : "/login")}
                class="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Gå til forsiden
              </button>
            </div>
          </div>
        }
      >
        {props.children}
      </Show>
    </Show>
  );
};

export default ProtectedRoute;
