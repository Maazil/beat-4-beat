import { useNavigate } from "@solidjs/router";
import { Component, createSignal, Show } from "solid-js";
import { useAuth } from "../../context/AuthContext";
import { updateDjName } from "../../services/usersService";

const Profile: Component = () => {
  const auth = useAuth();
  const name = auth.state.user?.displayName?.split(" ")[0] || "Bruker";
  const navigate = useNavigate();

  const [editingDjName, setEditingDjName] = createSignal(false);
  const [djNameInput, setDjNameInput] = createSignal(auth.djName() || "");
  const [isSaving, setIsSaving] = createSignal(false);

  const handleSaveDjName = async () => {
    const uid = auth.state.user?.uid;
    if (!uid) return;

    setIsSaving(true);
    try {
      const trimmed = djNameInput().trim();
      await updateDjName(uid, trimmed);
      auth.setDjName(trimmed || null);
      setEditingDjName(false);
    } catch (err) {
      console.error("Failed to save DJ name:", err);
      alert("Kunne ikke lagre DJ-navn. Prøv igjen.");
    } finally {
      setIsSaving(false);
    }
  };

  const logoutAndRedirect = async () => {
    await auth.signOut();
    navigate("/");
  };

  return (
    <main class="mx-auto w-full max-w-6xl px-6 py-12">
      <div class="mb-12 flex w-full flex-col items-center justify-between gap-6">
        <div>Hei {name}, velkommen til din profil!</div>

        {/* DJ Name section */}
        <section class="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 class="mb-3 text-sm font-semibold text-neutral-700">DJ-navn</h3>
          <Show
            when={editingDjName()}
            fallback={
              <div class="flex items-center justify-between gap-3">
                <span class="text-lg font-medium text-neutral-900">
                  {auth.djName() || "Ikke satt"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDjNameInput(auth.djName() || "");
                    setEditingDjName(true);
                  }}
                  class="rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-200"
                >
                  Endre
                </button>
              </div>
            }
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveDjName();
              }}
              class="flex flex-col gap-3"
            >
              <input
                type="text"
                value={djNameInput()}
                onInput={(e) => setDjNameInput(e.currentTarget.value)}
                placeholder="F.eks. DJ Mustard"
                class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                autofocus
              />
              <div class="flex gap-2">
                <button
                  type="submit"
                  disabled={isSaving()}
                  class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving() ? "Lagrer..." : "Lagre"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDjName(false)}
                  class="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-200"
                >
                  Avbryt
                </button>
              </div>
            </form>
          </Show>
          <p class="mt-2 text-xs text-neutral-400">
            Dette navnet vises som vertsnavn på rommene dine
          </p>
        </section>

        <section class="w-60">
          <button
            type="button"
            class="inline-flex w-full items-center justify-center rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700"
            onClick={() => navigate("/dashboard")}
          >
            Til dashboard
          </button>
        </section>

        <section id="overview" class="w-60">
          <button
            type="button"
            class="inline-flex w-full items-center justify-center rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700"
            onClick={logoutAndRedirect}
          >
            Logg ut
          </button>
        </section>
      </div>
    </main>
  );
};

export default Profile;
