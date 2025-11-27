import { useNavigate } from "@solidjs/router";
import { Component, createEffect, createSignal, Show } from "solid-js";
import { useAuth } from "../../context/AuthContext";

const Login: Component = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [error, setError] = createSignal("");
  const [loadingProvider, setLoadingProvider] = createSignal<
    "google" | "guest" | null
  >(null);

  createEffect(() => {
    if (auth.state.isLoading) return;

    if (auth.isAuthenticated()) {
      const destination = auth.isGuest() ? "/market" : "/dashboard";
      navigate(destination, { replace: true });
    }
  });

  const handleGoogleSignIn = async () => {
    setError("");
    setLoadingProvider("google");
    try {
      await auth.signInWithGoogle();
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Kunne ikke logge inn med Google");
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleGuestSignIn = async () => {
    setError("");
    setLoadingProvider("guest");
    try {
      await auth.signInAnonymously();
      navigate("/market");
    } catch (err: any) {
      setError(err?.message || "Kunne ikke logge inn som gjest");
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div class="flex min-h-screen items-center justify-center bg-[#f4f6f8] p-6">
      <div class="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 class="mb-2 text-3xl font-bold text-neutral-900">Logg inn</h1>
        <p class="mb-6 text-neutral-600">
          Velg hvordan du vil fortsette. Google-kontoer får full tilgang til å
          opprette og administrere rom.
        </p>

        <Show
          when={!auth.state.isLoading}
          fallback={<p class="text-center text-neutral-500">Laster konto…</p>}
        >
          {error() && (
            <div class="mb-6 rounded-lg border border-red-200 bg-red-50 p-3">
              <p class="text-sm text-red-700">{error()}</p>
            </div>
          )}

          <div class="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loadingProvider() !== null}
              class="flex w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingProvider() === "google"
                ? "Logger inn..."
                : "Logg inn med Google"}
            </button>

            <button
              type="button"
              onClick={handleGuestSignIn}
              disabled={loadingProvider() !== null}
              class="w-full rounded-lg border-2 border-neutral-300 px-6 py-3 font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingProvider() === "guest"
                ? "Logger inn som gjest..."
                : "Fortsett som gjest"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate("/")}
            class="mx-auto mt-6 block text-sm text-neutral-600 hover:text-neutral-900"
          >
            ← Tilbake til forsiden
          </button>
        </Show>
      </div>
    </div>
  );
};

export default Login;
