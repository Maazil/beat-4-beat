// ── YouTube URL utilities ──────────────────────────────────────────────

export interface YouTubeRef {
  videoId: string;
  /** Start position parsed from the URL's t/start param, in seconds. */
  startSeconds?: number;
}

// YouTube video ids are always 11 URL-safe base64 chars
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Parse a t/start query param: plain seconds ("90", "90s") or the
 * "1h2m3s" form. Returns undefined for anything else.
 */
export function parseTimeParam(t: string | null): number | undefined {
  if (!t) return undefined;
  if (/^\d+s?$/.test(t)) return parseInt(t, 10);
  const match = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!match || (!match[1] && !match[2] && !match[3])) return undefined;
  return +(match[1] ?? 0) * 3600 + +(match[2] ?? 0) * 60 + +(match[3] ?? 0);
}

/**
 * Extract the video id (and any start time) from a YouTube URL.
 * Supports watch, youtu.be, shorts, embed, and music.youtube.com links.
 * Returns null for anything that isn't clearly a YouTube video.
 */
export function parseYouTubeUrl(input: string): YouTubeRef | null {
  if (!input) return null;

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.replace(/^www\./, "");
  let videoId: string | null = null;

  if (host === "youtu.be") {
    videoId = url.pathname.split("/")[1] ?? null;
  } else if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
    if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v");
    } else if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/")) {
      videoId = url.pathname.split("/")[2] ?? null;
    }
  }

  if (!videoId || !VIDEO_ID.test(videoId)) return null;

  const startSeconds = parseTimeParam(url.searchParams.get("t") ?? url.searchParams.get("start"));
  return { videoId, ...(startSeconds != null ? { startSeconds } : {}) };
}
