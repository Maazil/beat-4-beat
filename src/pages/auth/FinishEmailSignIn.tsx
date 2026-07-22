import { useNavigate, useSearchParams } from "@solidjs/router";
import { Component, createEffect, createSignal, Match, onMount, Switch } from "solid-js";
import Button from "../../components/forms/Button";
import Input from "../../components/forms/Input";
import Logo from "../../components/Logo";
import { useAuth } from "../../context/AuthContext";
import { safeRedirectTarget } from "../../lib/safeRedirect";

type Status = "working" | "needEmail" | "error";

const FinishEmailSignIn: Component = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const auth = useAuth();
  const [status, setStatus] = createSignal<Status>("working");
  const [message, setMessage] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [completed, setCompleted] = createSignal(false);

  // Only allow in-app paths as redirect targets, mirroring the guard on /login.
  const destination = () => safeRedirectTarget(searchParams.redirect);

  // Redirect once THIS link's sign-in has completed and the auth observer has
  // populated the user — not on ambient auth state. Gating on `completed`
  // (rather than `isAuthenticated` alone) means a user who is already signed in
  // and opens an invalid/expired link still reaches onMount's validation and
  // error path instead of being bounced away. Waiting for the observer (rather
  // than navigating the instant signInWithEmailLink resolves) keeps a protected
  // destination from bouncing back to /login before the auth state lands.
  createEffect(() => {
    if (completed() && auth.isAuthenticated()) {
      navigate(destination(), { replace: true });
    }
  });

  const finish = async (address: string) => {
    setStatus("working");
    setMessage("");
    try {
      await auth.completeEmailSignIn(window.location.href, address);
      setCompleted(true);
      // Navigation is handled by the effect above once auth state updates.
    } catch (err: any) {
      setMessage(err?.message || "This sign-in link is invalid or has expired.");
      setStatus("error");
    }
  };

  // Completing the sign-in reads the current URL, so it runs once on mount. If
  // the email was stashed on this device we finish straight away; otherwise we
  // ask the user to confirm the address the link was sent to.
  onMount(() => {
    void (async () => {
      if (!(await auth.isEmailSignInLink(window.location.href))) {
        setMessage("This sign-in link is invalid or has expired.");
        setStatus("error");
        return;
      }
      const stored = auth.getStoredSignInEmail();
      if (stored) {
        void finish(stored);
      } else {
        setStatus("needEmail");
      }
    })();
  });

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const address = email().trim();
    if (address) void finish(address);
  };

  return (
    <div class="bg-stage relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <div class="pointer-events-none absolute inset-0">
        <div class="bg-halftone absolute inset-0 opacity-60" />
        <div class="animate-ambient-float absolute -right-24 bottom-24 h-80 w-80 rounded-full bg-beat/10 blur-[140px]" />
      </div>

      <div class="animate-rise-in relative z-10 w-full max-w-md rounded-3xl border border-line bg-surface p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
        <Logo class="mx-auto mb-8 h-9 w-auto" />
        <Switch>
          <Match when={status() === "working"}>
            <p class="text-muted">Signing you in…</p>
          </Match>

          <Match when={status() === "needEmail"}>
            <h1 class="font-display mb-6 text-3xl font-bold tracking-tight text-ink">
              Confirm your email
            </h1>
            <form onSubmit={handleSubmit} class="flex flex-col gap-3">
              <Input
                type="email"
                required
                autofocus
                autocomplete="email"
                aria-label="Email address"
                placeholder="you@example.com"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
              />
              <Button type="submit" size="lg" class="w-full">
                Continue
              </Button>
            </form>
          </Match>

          <Match when={status() === "error"}>
            <h1 class="font-display mb-2 text-2xl font-bold tracking-tight text-ink">
              Couldn’t sign you in
            </h1>
            <p class="mb-6 text-muted">
              {message() || "This sign-in link is invalid or has expired."}
            </p>
            <button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              class="mx-auto block font-mono text-xs tracking-wide text-muted uppercase transition hover:text-beat"
            >
              ← Back to sign in
            </button>
          </Match>
        </Switch>
      </div>
    </div>
  );
};

export default FinishEmailSignIn;
