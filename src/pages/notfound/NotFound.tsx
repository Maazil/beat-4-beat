import { useNavigate } from "@solidjs/router";
import { Component } from "solid-js";
import Button from "../../components/forms/Button";

const NotFound: Component = () => {
  const navigate = useNavigate();

  return (
    <main class="bg-stage relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6 text-center">
      <div class="bg-halftone pointer-events-none absolute inset-0 opacity-60" />
      <p class="relative font-mono text-xs font-semibold tracking-[0.35em] text-beat uppercase">
        ♪ Off beat
      </p>
      <h1 class="font-display relative mt-4 text-8xl font-extrabold tracking-tight text-ink">
        404
      </h1>
      <p class="relative mt-4 max-w-sm text-muted">
        This page missed its cue. Let's get you back on track.
      </p>
      <Button size="lg" class="relative mt-8" onClick={() => navigate("/")}>
        Back to the front page
      </Button>
    </main>
  );
};

export default NotFound;
