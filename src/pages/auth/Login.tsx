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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err?.message || "Kunne ikke logge inn som gjest");
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div class="bg-ambient relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      {/* Animated background glows */}
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute -right-24 bottom-24 h-80 w-80 rounded-full bg-red-700/15 blur-[140px]" />
        {/* <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,48,64,0.12)_0,rgba(10,10,14,0)_70%)]" /> */}
        <div class="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,25,70,0.08)_0%,rgba(9,9,13,0)_40%,rgba(255,25,70,0.06)_75%,rgba(9,9,13,0)_100%)]" />
      </div>

      <div class="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">
        <h1 class="mb-2 text-3xl font-bold text-neutral-100">Logg inn</h1>
        <p class="mb-6 text-neutral-400">
          Velg hvordan du vil fortsette. Google-kontoer får full tilgang til å
          opprette og administrere rom.
        </p>

        <Show
          when={!auth.state.isLoading}
          fallback={<p class="text-center text-neutral-500">Laster konto…</p>}
        >
          {error() && (
            <div class="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <p class="text-sm text-red-300">{error()}</p>
            </div>
          )}

          <div class="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loadingProvider() !== null}
              class="flex w-full items-center justify-center gap-3 rounded-full border border-red-500/60 bg-red-500/20 px-6 py-3 font-semibold text-red-200 transition duration-300 hover:border-red-400/80 hover:bg-red-500/30 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingProvider() === "google"
                ? "Logger inn..."
                : "Logg inn med Google"}
            </button>

            <button
              type="button"
              onClick={handleGuestSignIn}
              disabled={loadingProvider() !== null}
              class="w-full rounded-full border border-neutral-600 bg-transparent px-6 py-3 font-medium text-neutral-300 transition duration-300 hover:border-neutral-500 hover:bg-white/5 hover:text-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingProvider() === "guest"
                ? "Logger inn som gjest..."
                : "Fortsett som gjest"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate("/")}
            class="mx-auto mt-6 block text-sm text-neutral-500 transition hover:text-neutral-300"
          >
            ← Tilbake til forsiden
          </button>
        </Show>
      </div>
    </div>
  );
};

export default Login;
