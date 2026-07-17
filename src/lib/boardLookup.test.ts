import { describe, expect, it } from "vitest";
import { buildItemIndex, buildRoundLabels } from "./boardLookup";
import type { Category } from "../model/category";
import type { SongItem } from "../model/songItem";

const song = (id: string, overrides?: Partial<SongItem>): SongItem => ({
  id,
  level: 1,
  isRevealed: false,
  ...overrides,
});

const category = (id: string, name: string, items: SongItem[]): Category => ({ id, name, items });

const pop = category("c1", "Pop", [
  song("s1", { level: 1, title: "Song One", artist: "Artist One" }),
  song("s2", { level: 2, songUrl: "https://open.spotify.com/track/xyz" }),
]);
const rock = category("c2", "Rock", [song("s3", { level: 3 })]);

describe("buildItemIndex", () => {
  it("indexes every item across categories with its category", () => {
    const index = buildItemIndex([pop, rock]);
    expect(index.size).toBe(3);
    expect(index.get("s1")?.item.title).toBe("Song One");
    expect(index.get("s1")?.category.name).toBe("Pop");
    expect(index.get("s3")?.category.name).toBe("Rock");
  });

  it("is empty for no categories", () => {
    expect(buildItemIndex([]).size).toBe(0);
  });
});

describe("buildRoundLabels", () => {
  const index = buildItemIndex([pop, rock]);

  it("labels rounds in play order", () => {
    const labels = buildRoundLabels(["s3", "s1"], index);
    expect(labels).toEqual([
      { title: undefined, artist: undefined, category: "Rock", level: 3, songUrl: undefined },
      { title: "Song One", artist: "Artist One", category: "Pop", level: 1, songUrl: undefined },
    ]);
  });

  it("keeps URL-only songs identifiable via category/level/link", () => {
    const [label] = buildRoundLabels(["s2"], index);
    expect(label.title).toBeUndefined();
    expect(label.category).toBe("Pop");
    expect(label.level).toBe(2);
    expect(label.songUrl).toBe("https://open.spotify.com/track/xyz");
  });

  it("yields an empty label for ids no longer on the board", () => {
    const [label] = buildRoundLabels(["gone"], index);
    expect(label).toEqual({
      title: undefined,
      artist: undefined,
      category: undefined,
      level: undefined,
      songUrl: undefined,
    });
  });

  it("returns no labels for an empty play order", () => {
    expect(buildRoundLabels([], index)).toEqual([]);
  });
});
