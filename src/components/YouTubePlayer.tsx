import { Component, createSignal, Show } from "solid-js";

interface YouTubePlayerProps {
  videoId: string;
  /** Cue point in seconds. */
  startSeconds: number;
  onClose: () => void;
}

/**
 * Bottom-bar embedded YouTube player for songs without a Spotify link.
 * The video starts covered so the shared screen doesn't spoil the answer —
 * only audio plays until the host hits "Show video". Pause/resume go
 * through the iframe API via postMessage; closing unmounts the iframe,
 * which stops playback.
 */
const YouTubePlayer: Component<YouTubePlayerProps> = (props) => {
  const [revealed, setRevealed] = createSignal(false);
  const [isPlaying, setIsPlaying] = createSignal(true);

  let iframe: HTMLIFrameElement | undefined;

  const command = (func: "playVideo" | "pauseVideo") => {
    iframe?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: [] }), "*");
    setIsPlaying(func === "playVideo");
  };

  const src = () =>
    `https://www.youtube-nocookie.com/embed/${props.videoId}` +
    `?autoplay=1&start=${Math.max(0, Math.floor(props.startSeconds))}&enablejsapi=1&rel=0`;

  return (
    <div class="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface/95 px-4 py-3 md:backdrop-blur">
      <div class="mx-auto flex max-w-7xl items-center gap-4">
        {/* Video box — covered until the host reveals it */}
        <div class="relative aspect-video h-24 shrink-0 overflow-hidden rounded-lg border border-line bg-night">
          <iframe
            ref={iframe}
            src={src()}
            title="YouTube player"
            allow="autoplay; encrypted-media"
            class="h-full w-full"
          />
          <Show when={!revealed()}>
            <div class="absolute inset-0 flex items-center justify-center bg-night">
              <span class="font-display text-3xl font-bold text-beat">?</span>
            </div>
          </Show>
        </div>

        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <p class="font-mono text-xs tracking-wide text-muted uppercase">Playing via YouTube</p>
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => command(isPlaying() ? "pauseVideo" : "playVideo")}
              class="rounded-full border border-line px-3 py-1 text-xs font-bold text-ink transition hover:border-beat hover:bg-beat-soft"
            >
              {isPlaying() ? "Pause" : "Resume"}
            </button>
            <button
              type="button"
              onClick={() => setRevealed(!revealed())}
              class="rounded-full border border-line px-3 py-1 text-xs font-semibold text-muted transition hover:border-beat hover:text-ink"
            >
              {revealed() ? "Hide video" : "Show video"}
            </button>
          </div>
        </div>

        <button
          type="button"
          title="Stop and close"
          onClick={() => props.onClose()}
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 text-muted transition hover:border-beat hover:text-beat"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default YouTubePlayer;
