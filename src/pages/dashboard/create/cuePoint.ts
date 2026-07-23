// Pure helpers for the "Start at (seconds)" cue-point input in the song editor.

// Track length in whole seconds, so the cue point can't be set past the end of
// the song. Only Spotify-selected tracks carry a duration; a missing or
// non-positive duration means "no cap" (undefined).
export function maxCueSeconds(durationMs: number | undefined): number | undefined {
  return durationMs != null && durationMs > 0 ? Math.floor(durationMs / 1000) : undefined;
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
