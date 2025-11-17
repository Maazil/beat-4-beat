import { useNavigate } from "@solidjs/router";
import { ParentComponent, Show, onMount } from "solid-js";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  requireFullUser?: boolean;
  requireHost?: boolean;
  roomHostId?: string;
}

const ProtectedRoute: ParentComponent<ProtectedRouteProps> = (props) => {
  const auth = useAuth();
  const navigate = useNavigate();

  onMount(() => {
    // Check if user needs to be logged in
    if (!auth.isAuthenticated()) {
      navigate("/login", { replace: true });
      return;
    }

    // Check if full user is required (not guest)
    if (props.requireFullUser && !auth.isFullUser()) {
      navigate("/login", { replace: true });
      return;
    }

    // Check if user is the host of this room
    if (props.requireHost && !auth.isRoomHost(props.roomHostId)) {
      navigate("/", { replace: true });
      return;
    }
  });

  const hasAccess = () => {
    if (!auth.isAuthenticated()) return false;
    if (props.requireFullUser && !auth.isFullUser()) return false;
    if (props.requireHost && !auth.isRoomHost(props.roomHostId)) return false;
    return true;
  };

  return (
    <Show
      when={hasAccess()}
      fallback={
        <div class="flex min-h-screen items-center justify-center bg-[#f4f6f8]">
          <div class="text-center">
            <h2 class="mb-4 text-2xl font-bold text-neutral-900">
              Tilgang nektet
            </h2>
            <p class="mb-6 text-neutral-600">
              {!auth.isAuthenticated()
                ? "Du må være logget inn for å se denne siden."
                : props.requireHost
                  ? "Kun rom-verten har tilgang til denne siden."
                  : "Du trenger en fullverdig konto for å se denne siden."}
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
  );
};

export default ProtectedRoute;
