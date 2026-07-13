import { useNavigate, useParams } from "@solidjs/router";
import { Component, createSignal, onMount, Show } from "solid-js";
import ProtectedRoute from "../../components/ProtectedRoute";
import { acceptRoomInvite } from "../../services/roomsService";

const InviteAccept: Component = () => {
  const params = useParams<{ roomId: string; token: string }>();
  const navigate = useNavigate();
  const [error, setError] = createSignal<string | null>(null);

  onMount(async () => {
    try {
      await acceptRoomInvite(params.roomId, params.token);
      navigate(`/dashboard/create?edit=${params.roomId}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept the invite");
    }
  });

  return (
    <div class="bg-stage flex min-h-screen items-center justify-center p-6">
      <Show
        when={error()}
        fallback={
          <div class="text-center">
            <div class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-line border-t-beat" />
            <p class="text-muted">Accepting the invite…</p>
          </div>
        }
      >
        <div class="max-w-md rounded-3xl border border-line bg-surface p-8 text-center">
          <h2 class="font-display mb-4 text-2xl font-bold text-ink">Could not accept the invite</h2>
          <p class="mb-6 text-muted">{error()}</p>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            class="rounded-full bg-beat px-6 py-3 font-bold text-night transition hover:bg-beat-bright"
          >
            Go to dashboard
          </button>
        </div>
      </Show>
    </div>
  );
};

export default function InviteAcceptWrapper() {
  return (
    <ProtectedRoute>
      <InviteAccept />
    </ProtectedRoute>
  );
}
