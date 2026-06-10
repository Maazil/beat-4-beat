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
      setError(err instanceof Error ? err.message : "Kunne ikke godta invitasjonen");
    }
  });

  return (
    <div class="flex min-h-screen items-center justify-center bg-[#f4f6f8] p-6">
      <Show
        when={error()}
        fallback={
          <div class="text-center">
            <div class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-700" />
            <p class="text-neutral-600">Godtar invitasjonen…</p>
          </div>
        }
      >
        <div class="max-w-md text-center">
          <h2 class="mb-4 text-2xl font-bold text-neutral-900">Kunne ikke godta invitasjonen</h2>
          <p class="mb-6 text-neutral-600">{error()}</p>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            class="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Gå til dashbordet
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
