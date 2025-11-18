import { useNavigate } from "@solidjs/router";
import { Component, createSignal } from "solid-js";
import { useAuth } from "../../context/AuthContext";

const Guest: Component = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [loading, setLoading] = createSignal(false);

  const handleGuestSignIn = async () => {
    setLoading(true);
    try {
      await auth.signInAnonymously();
      navigate("/market");
    } catch (error) {
      console.error("Failed to sign in as guest:", error);
      alert("Kunne ikke logge inn som gjest");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="flex min-h-screen items-center justify-center bg-[#f4f6f8] p-6">
      <div class="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 class="mb-2 text-3xl font-bold text-neutral-900">
          Fortsett som gjest
        </h1>
        <p class="mb-6 text-neutral-600">
          Du kan spille i rom, men du vil ikke kunne lage egne rom eller lagre
          fremgang.
        </p>

        <div class="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 class="mb-2 font-semibold text-blue-900">Som gjest kan du:</h3>
          <ul class="space-y-1 text-sm text-blue-800">
            <li>✓ Delta i rom via delt lenke</li>
            <li>✓ Spille Beat 4 Beat</li>
            <li>✓ Interagere med spillbrettet</li>
          </ul>
        </div>

        <div class="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <h3 class="mb-2 font-semibold text-neutral-900">
            Som gjest kan du IKKE:
          </h3>
          <ul class="space-y-1 text-sm text-neutral-700">
            <li>✗ Lage egne rom</li>
            <li>✗ Redigere rom</li>
            <li>✗ Få tilgang til vertspanel</li>
            <li>✗ Lagre maler</li>
          </ul>
        </div>

        <button
          type="button"
          onClick={handleGuestSignIn}
          disabled={loading()}
          class="mb-3 w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading() ? "Logger inn..." : "Fortsett som gjest"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/login")}
          class="w-full rounded-lg border-2 border-blue-600 px-6 py-3 font-medium text-blue-600 transition hover:bg-blue-50"
        >
          Opprett fullverdig konto
        </button>

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

export default Guest;
