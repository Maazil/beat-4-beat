import { useNavigate } from "@solidjs/router";
import { Component } from "solid-js";
import { useAuth } from "../../context/AuthContext";

const Profile: Component = () => {
  const auth = useAuth();
  const name = auth.state.user?.displayName?.split(" ")[0] || "Bruker";

  const navigate = useNavigate();
  return (
    <main class="mx-auto w-full max-w-6xl px-6 py-12">
      <div class="mb-12 flex w-full flex-col items-center justify-between gap-4">
        <div>Hei {name}, velkommen til din profil!</div>

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
            onClick={() => auth.signOut()}
          >
            Logg ut
          </button>
        </section>
      </div>
    </main>
  );
};

export default Profile;
