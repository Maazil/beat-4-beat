import { useNavigate, useSearchParams } from "@solidjs/router";
import { Component, createEffect, createSignal, Show } from "solid-js";
import Button from "../../components/forms/Button";
import Input from "../../components/forms/Input";
import Logo from "../../components/Logo";
import { useAuth } from "../../context/AuthContext";

const Login: Component = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const auth = useAuth();
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [email, setEmail] = createSignal("");
  const [linkSent, setLinkSent] = createSignal(false);

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

  const handleEmailLink = async (e: Event) => {
    e.preventDefault();
    setError("");
    const address = email().trim();
    if (!address) {
      setError("Enter your email address");
      return;
    }
    setLoading(true);
    try {
      await auth.sendEmailSignInLink(address);
      setLinkSent(true);
    } catch (err: any) {
      setError(err?.message || "Could not send the sign-in link");
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
          Sign in to create and manage game rooms — use Google, or get a magic link by email.
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

          <Show
            when={!linkSent()}
            fallback={
              <div class="rounded-xl border border-line bg-surface-2 p-4 text-center">
                <p class="mb-1 text-ink">Check your inbox ✉️</p>
                <p class="text-sm text-muted">
                  We sent a sign-in link to <span class="text-ink">{email().trim()}</span>. Open it
                  on this device to finish signing in.
                </p>
              </div>
            }
          >
            <Button size="lg" class="w-full" onClick={handleGoogleSignIn} disabled={loading()}>
              {loading() ? "Signing in…" : "Sign in with Google"}
            </Button>

            <div class="my-6 flex items-center gap-3 text-xs text-muted">
              <span class="h-px flex-1 bg-line" />
              <span class="font-mono tracking-wide uppercase">or</span>
              <span class="h-px flex-1 bg-line" />
            </div>

            <form onSubmit={handleEmailLink} class="flex flex-col gap-3">
              <Input
                type="email"
                required
                autocomplete="email"
                placeholder="you@example.com"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
                disabled={loading()}
              />
              <Button
                type="submit"
                variant="secondary"
                size="lg"
                class="w-full"
                disabled={loading()}
              >
                {loading() ? "Sending…" : "Email me a sign-in link"}
              </Button>
            </form>
          </Show>

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
