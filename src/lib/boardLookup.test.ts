import { describe, expect, it } from "vitest";
import { buildItemIndex, buildRoundLabels, pickRandomUnplayed, unplayedItems } from "./boardLookup";
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

describe("unplayedItems", () => {
  it("collects unrevealed songs across categories in board order", () => {
    const played = new Set(["s2"]);
    const remaining = unplayedItems([pop, rock], (id) => played.has(id));
    expect(remaining.map((item) => item.id)).toEqual(["s1", "s3"]);
  });

  it("is empty once every song has been played", () => {
    expect(unplayedItems([pop, rock], () => true)).toEqual([]);
  });

  it("is empty for no categories", () => {
    expect(unplayedItems([], () => false)).toEqual([]);
  });
});

describe("pickRandomUnplayed", () => {
  const remaining = unplayedItems([pop, rock], () => false);

  it("only picks songs that have a URL when any are left", () => {
    // s2 is the single item with a songUrl, so every draw must land on it
    for (const roll of [0, 0.5, 0.999]) {
      expect(pickRandomUnplayed(remaining, () => roll)?.id).toBe("s2");
    }
  });

  it("spreads picks across the playable pool", () => {
    const playable = [
      song("a", { songUrl: "https://example.com/a" }),
      song("b", { songUrl: "https://example.com/b" }),
    ];
    expect(pickRandomUnplayed(playable, () => 0)?.id).toBe("a");
    expect(pickRandomUnplayed(playable, () => 0.999)?.id).toBe("b");
  });

  it("falls back to URL-less songs once nothing playable is left", () => {
    const urlLess = [song("x"), song("y")];
    expect(pickRandomUnplayed(urlLess, () => 0.999)?.id).toBe("y");
  });

  it("returns null on an exhausted board", () => {
    expect(pickRandomUnplayed([])).toBeNull();
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
