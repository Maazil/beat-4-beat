import { useLocation, useNavigate } from "@solidjs/router";
import { ParentComponent, Show, createEffect } from "solid-js";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  requireHost?: boolean;
  roomHostId?: string;
}

const ProtectedRoute: ParentComponent<ProtectedRouteProps> = (props) => {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  createEffect(() => {
    if (auth.state.isLoading) return;

    if (!auth.isAuthenticated()) {
      // Preserve the page the user tried to open (e.g. an invite link) so
      // Login can return them there after signing in.
      const target = location.pathname + location.search;
      navigate(`/login?redirect=${encodeURIComponent(target)}`, { replace: true });
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
        <div class="bg-stage flex min-h-screen items-center justify-center">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-line border-t-beat" />
        </div>
      }
    >
      <Show
        when={hasAccess()}
        fallback={
          <div class="bg-stage flex min-h-screen items-center justify-center">
            <div class="text-center">
              <h2 class="font-display mb-4 text-2xl font-bold text-ink">Access denied</h2>
              <p class="mb-6 text-muted">
                {!auth.isAuthenticated()
                  ? "You need to be signed in to view this page."
                  : "Only the room host can access this page."}
              </p>
              <button
                type="button"
                onClick={() => navigate(auth.isAuthenticated() ? "/" : "/login")}
                class="rounded-full bg-beat px-6 py-3 font-bold text-white transition hover:bg-beat-deep"
              >
                Go to the front page
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
