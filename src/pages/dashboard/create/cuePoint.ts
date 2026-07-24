// Pure helpers for the "Start at (seconds)" cue-point input in the song editor.

// Leave this much of the song after the cue point, so playback never starts
// right at (or past) the end.
const CUE_END_BUFFER_SECONDS = 10;

// Latest whole second the cue point may be set to: the track length less a
// buffer, so playback always has some song left to play. Only Spotify-selected
// tracks carry a duration; a missing or non-positive duration means "no cap"
// (undefined). Tracks shorter than the buffer cap at 0.
export function maxCueSeconds(durationMs: number | undefined): number | undefined {
  if (durationMs == null || durationMs <= 0) return undefined;
  return Math.max(0, Math.floor(durationMs / 1000) - CUE_END_BUFFER_SECONDS);
}

// Parse the raw cue-point input: a non-negative integer of seconds, or
// undefined when blank/invalid (blank means "leave the existing value").
export function parseCueSeconds(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

// Clamp a parsed cue point to the track length; no cap when maxSeconds is
// undefined. An undefined cue point passes through untouched.
export function clampCueSeconds(
  seconds: number | undefined,
  maxSeconds: number | undefined,
): number | undefined {
  return seconds != null && maxSeconds != null ? Math.min(seconds, maxSeconds) : seconds;
}
