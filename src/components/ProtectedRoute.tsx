import { useNavigate } from "@solidjs/router";
import { ParentComponent, Show, onMount } from "solid-js";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute: ParentComponent = (props) => {
  const auth = useAuth();
  const navigate = useNavigate();

  onMount(() => {
    if (!auth.isAuthenticated()) {
      // Redirect to homepage if not authenticated
      navigate("/", { replace: true });
    }
  });

  return (
    <Show
      when={auth.isAuthenticated()}
      fallback={
        <div class="flex min-h-screen items-center justify-center bg-[#f4f6f8]">
          <div class="text-center">
            <h2 class="mb-4 text-2xl font-bold text-neutral-900">
              Tilgang nektet
            </h2>
            <p class="mb-6 text-neutral-600">
              Du må være logget inn for å se denne siden.
            </p>
            <button
              type="button"
              onClick={() => navigate("/")}
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
