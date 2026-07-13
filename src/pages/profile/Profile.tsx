import { useNavigate } from "@solidjs/router";
import { Component, createSignal, Show } from "solid-js";
import { useAuth } from "../../context/AuthContext";
import { updateDjName } from "../../services/usersService";

const Profile: Component = () => {
  const auth = useAuth();
  const name = auth.state.user?.displayName?.split(" ")[0] || "there";
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
      alert("Could not save DJ name. Please try again.");
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
      <div class="mx-auto flex w-full max-w-sm flex-col gap-6">
        <div class="text-center">
          <h1 class="font-display text-3xl font-bold tracking-tight text-ink">Hi {name}</h1>
          <p class="mt-2 text-sm text-muted">Welcome to your profile</p>
        </div>

        {/* DJ Name section */}
        <section class="rounded-2xl border border-line bg-surface p-5">
          <h3 class="mb-3 font-mono text-xs font-semibold tracking-[0.2em] text-muted uppercase">
            DJ name
          </h3>
          <Show
            when={editingDjName()}
            fallback={
              <div class="flex items-center justify-between gap-3">
                <span class="text-lg font-semibold text-ink">{auth.djName() || "Not set"}</span>
                <button
                  type="button"
                  onClick={() => {
                    setDjNameInput(auth.djName() || "");
                    setEditingDjName(true);
                  }}
                  class="rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-ink transition hover:border-beat hover:text-beat"
                >
                  Edit
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
                placeholder="E.g. DJ Mustard"
                class="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-muted/60 outline-none focus:border-beat focus:ring-2 focus:ring-beat/20"
                autofocus
              />
              <div class="flex gap-2">
                <button
                  type="submit"
                  disabled={isSaving()}
                  class="rounded-full bg-beat px-5 py-2 text-sm font-bold text-night transition hover:bg-beat-bright disabled:opacity-50"
                >
                  {isSaving() ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDjName(false)}
                  class="rounded-full border border-line px-5 py-2 text-sm font-semibold text-ink transition hover:bg-surface-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Show>
          <p class="mt-2 text-xs text-muted">This name is shown as the host name on your rooms</p>
        </section>

        <section class="flex flex-col gap-3">
          <button
            type="button"
            class="inline-flex w-full items-center justify-center rounded-full bg-beat px-5 py-2.5 text-sm font-bold text-night transition hover:bg-beat-bright"
            onClick={() => navigate("/dashboard")}
          >
            Go to dashboard
          </button>
          <button
            type="button"
            class="inline-flex w-full items-center justify-center rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-beat hover:bg-beat-soft"
            onClick={logoutAndRedirect}
          >
            Sign out
          </button>
        </section>
      </div>
    </main>
  );
};

export default Profile;
