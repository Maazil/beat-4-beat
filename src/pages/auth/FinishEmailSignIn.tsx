import { useNavigate } from "@solidjs/router";
import { Component, createSignal, Match, onMount, Switch } from "solid-js";
import Logo from "../../components/Logo";
import { useAuth } from "../../context/AuthContext";

const FinishEmailSignIn: Component = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [status, setStatus] = createSignal<"working" | "invalid" | "error">("working");
  const [message, setMessage] = createSignal("");

  // Completing the sign-in is a one-shot side effect that reads the current
  // URL, so it belongs in onMount rather than a derivation.
  onMount(async () => {
    try {
      const signedIn = await auth.completeEmailSignIn(window.location.href);
      if (signedIn) {
        navigate("/dashboard", { replace: true });
      } else {
        setStatus("invalid");
      }
    } catch (err: any) {
      setMessage(err?.message || "This sign-in link is invalid or has expired.");
      setStatus("error");
    }
  });

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
          <Match when={status() === "invalid" || status() === "error"}>
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
