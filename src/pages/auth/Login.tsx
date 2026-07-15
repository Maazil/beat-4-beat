import { useNavigate, useSearchParams } from "@solidjs/router";
import { Component, createEffect, createSignal, Show } from "solid-js";
import Logo from "../../components/Logo";
import { useAuth } from "../../context/AuthContext";

const Login: Component = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const auth = useAuth();
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  // Only allow in-app paths as redirect targets
  const redirectTarget = () => {
    const target = searchParams.redirect;
    // "//host" is a protocol-relative external URL — reject it
    return typeof target === "string" && target.startsWith("/") && !target.startsWith("//")
      ? target
      : "/dashboard";
  };

  createEffect(() => {
    if (auth.state.isLoading) return;

    if (auth.isAuthenticated()) {
      navigate(redirectTarget(), { replace: true });
    }
  });

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await auth.signInWithGoogle();
      navigate(redirectTarget());
    } catch (err: any) {
      setError(err?.message || "Could not sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="bg-stage relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <div class="pointer-events-none absolute inset-0">
        <div class="bg-halftone absolute inset-0 opacity-60" />
        <div class="animate-ambient-float absolute -right-24 bottom-24 h-80 w-80 rounded-full bg-beat/10 blur-[140px]" />
      </div>

      <div class="animate-rise-in relative z-10 w-full max-w-md rounded-3xl border border-line bg-surface p-8 shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
        <Logo class="mb-8 h-9 w-auto" />
        <h1 class="font-display mb-2 text-3xl font-bold tracking-tight text-ink">Sign in</h1>
        <p class="mb-6 text-muted">
          Sign in with your Google account to create and manage game rooms.
        </p>

        <Show
          when={!auth.state.isLoading}
          fallback={<p class="text-center text-muted">Loading account…</p>}
        >
          <Show when={error()}>
            <div class="mb-6 rounded-xl border border-magenta-hot/40 bg-magenta-hot/10 p-3">
              <p class="text-sm text-magenta-hot">{error()}</p>
            </div>
          </Show>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading()}
            class="flex w-full items-center justify-center gap-3 rounded-full bg-beat px-6 py-3 font-bold text-night shadow-[0_8px_30px_rgba(234,196,53,0.28)] transition duration-300 hover:bg-beat-bright disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading() ? "Signing in…" : "Sign in with Google"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            class="mx-auto mt-6 block font-mono text-xs tracking-wide text-muted uppercase transition hover:text-beat"
          >
            ← Back to the front page
          </button>
        </Show>
      </div>
    </div>
  );
};

export default Login;
