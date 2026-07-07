// ── Safe handling of user-provided song links ──────────────────────────
// Room content is user-generated: a hostile host can store any string in
// songUrl, and it ends up in <a href> (Scoreboard) and window.open
// (RoomPlay) on every player's screen. These helpers make sure only
// http(s) links and Spotify track URIs ever get through — never
// javascript:/data:/other schemes.

/** spotify:track:… URIs open the Spotify app and are the one non-http scheme we allow. */
const SPOTIFY_TRACK_URI = /^spotify:track:[A-Za-z0-9]+$/;

/** True for absolute http(s) URLs only. */
export function isSafeExternalUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** True when a songUrl is safe to use as a link target. */
export function isSafeSongHref(input: string): boolean {
  return SPOTIFY_TRACK_URI.test(input) || isSafeExternalUrl(input);
}

/** Open a song link in a new tab, silently dropping unsafe schemes. */
export function openSongUrl(songUrl: string): void {
  if (isSafeSongHref(songUrl)) {
    window.open(songUrl, "_blank", "noopener");
    return;
  }
  console.warn("[openSongUrl] Blocked song link with unsafe scheme:", songUrl);
}
