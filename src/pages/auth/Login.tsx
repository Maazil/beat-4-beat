import { useNavigate } from "@solidjs/router";
import { Component, createSignal } from "solid-js";
import { useAuth } from "../../context/AuthContext";

const Login: Component = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [name, setName] = createSignal("");
  const [isSignUp, setIsSignUp] = createSignal(false);
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp()) {
        await auth.signUpWithEmail(email(), password(), name());
      } else {
        await auth.signInWithEmail(email(), password());
      }
      navigate("/");
    } catch (err: any) {
      setError(err.message || "En feil oppstod");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="flex min-h-screen items-center justify-center bg-[#f4f6f8] p-6">
      <div class="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 class="mb-2 text-3xl font-bold text-neutral-900">
          {isSignUp() ? "Opprett konto" : "Logg inn"}
        </h1>
        <p class="mb-6 text-neutral-600">
          {isSignUp()
            ? "Få full tilgang til å lage og administrere rom"
            : "Velkommen tilbake til Beat 4 Beat"}
        </p>

        <form onSubmit={handleSubmit} class="space-y-4">
          {isSignUp() && (
            <div>
              <label class="mb-2 block text-sm font-medium text-neutral-700">
                Navn
              </label>
              <input
                type="text"
                value={name()}
                onInput={(e) => setName(e.currentTarget.value)}
                placeholder="Ditt navn"
                class="w-full rounded-lg border border-neutral-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                required={isSignUp()}
              />
            </div>
          )}

          <div>
            <label class="mb-2 block text-sm font-medium text-neutral-700">
              E-post
            </label>
            <input
              type="email"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
              placeholder="din@epost.no"
              class="w-full rounded-lg border border-neutral-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              required
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-neutral-700">
              Passord
            </label>
            <input
              type="password"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              placeholder="••••••••"
              class="w-full rounded-lg border border-neutral-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              required
            />
          </div>

          {error() && (
            <div class="rounded-lg border border-red-200 bg-red-50 p-3">
              <p class="text-sm text-red-700">{error()}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading()}
            class="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading() ? "Vent..." : isSignUp() ? "Opprett konto" : "Logg inn"}
          </button>
        </form>

        <div class="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp());
              setError("");
            }}
            class="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {isSignUp()
              ? "Har du allerede en konto? Logg inn"
              : "Har du ikke konto? Registrer deg"}
          </button>
        </div>

        <div class="mt-6 border-t border-neutral-200 pt-6">
          <button
            type="button"
            onClick={() =>
              auth.signInAnonymously().then(() => navigate("/market"))
            }
            class="w-full rounded-lg border-2 border-neutral-300 px-6 py-3 font-medium text-neutral-700 transition hover:bg-neutral-50"
          >
            Fortsett som gjest
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate("/")}
          class="mx-auto mt-4 block text-sm text-neutral-600 hover:text-neutral-900"
        >
          ← Tilbake til forsiden
        </button>
      </div>
    </div>
  );
};

export default Login;
