import { describe, expect, it } from "vitest";
import { spotifyUrlToUri } from "./spotify.utils";

const ID = "6LxSe8YmdPxy095Ux6znaQ"; // 22 base-62 chars

describe("spotifyUrlToUri", () => {
  it("passes an existing spotify:track: URI through unchanged", () => {
    expect(spotifyUrlToUri(`spotify:track:${ID}`)).toBe(`spotify:track:${ID}`);
  });

  it("extracts the id from a full open.spotify.com URL with query params", () => {
    expect(spotifyUrlToUri(`https://open.spotify.com/track/${ID}?si=abc123`)).toBe(
      `spotify:track:${ID}`,
    );
  });

  it("accepts a bare 22-character track id", () => {
    expect(spotifyUrlToUri(ID)).toBe(`spotify:track:${ID}`);
  });

  it("rejects non-Spotify URLs", () => {
    expect(spotifyUrlToUri("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(spotifyUrlToUri("https://open.spotify.com/playlist/xyz")).toBeNull();
  });

  it("rejects empty input and ids of the wrong length", () => {
    expect(spotifyUrlToUri("")).toBeNull();
    expect(spotifyUrlToUri("abc")).toBeNull();
  });
});
