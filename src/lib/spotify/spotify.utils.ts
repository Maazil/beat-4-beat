// ── Spotify URL / URI utilities ────────────────────────────────────────

/**
 * Convert a Spotify track URL to a `spotify:track:ID` URI.
 *
 * Accepts any of these formats:
 *   - Full URL:  https://open.spotify.com/track/6LxSe8Y...?si=abc
 *   - URI:       spotify:track:6LxSe8Y...
 *   - Plain ID:  6LxSe8Y...
 *
 * Returns `null` if the input doesn't look like a Spotify track reference.
 */
export function spotifyUrlToUri(input: string): string | null {
  if (!input) return null;

  // Already a Spotify URI
  const uriMatch = input.match(/^spotify:track:([A-Za-z0-9]+)$/);
  if (uriMatch) return input;

  // Full URL — extract the track ID
  const urlMatch = input.match(/open\.spotify\.com\/track\/([A-Za-z0-9]+)/);
  if (urlMatch) return `spotify:track:${urlMatch[1]}`;

  // Bare 22-char Spotify ID (Spotify IDs are always 22 base-62 chars)
  if (/^[A-Za-z0-9]{22}$/.test(input)) return `spotify:track:${input}`;

  return null;
}
