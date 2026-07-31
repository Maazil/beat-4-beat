import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

/*
  A stale font URL cannot be caught after deploy: Hosting rewrites any unknown
  /fonts path to index.html and answers 200 with `immutable`, so the browser
  quietly falls back to a system font and the bad response is edge-cached for a
  year. See the `── Fonts ──` comment in src/index.css.
*/

// vitest runs from the repo root, and `import.meta.url` is not a file:// URL
// under the Vite transform — resolve against cwd instead.
const repoFile = (path: string) => join(process.cwd(), path);
const read = (path: string) => readFileSync(repoFile(path), "utf8");

const fontUrls = (source: string) => [
  ...new Set(source.match(/\/fonts\/[A-Za-z0-9._-]+\.woff2/g) ?? []),
];

describe("font assets", () => {
  test.each([
    ["src/index.css", "@font-face src"],
    ["index.html", "preload"],
  ])("every %s font URL resolves to a file in public/ (%s)", (file) => {
    const urls = fontUrls(read(file));

    expect(urls.length).toBeGreaterThan(0);
    expect(urls.filter((url) => !existsSync(repoFile(`public${url}`)))).toEqual([]);
  });

  test("each instanced filename agrees with its font-weight descriptor", () => {
    const blocks = read("src/index.css").split("@font-face").slice(1);
    const mismatched = blocks.flatMap((block) => {
      const url = block.match(/\/fonts\/[A-Za-z0-9._-]+\.woff2/)?.[0];
      const weight = block.match(/font-weight:\s*(\d+)\s+(\d+)/);
      if (!url || !weight) return [];

      const suffix = url.match(/wght(\d+)-(\d+)/);
      return suffix?.[1] === weight[1] && suffix[2] === weight[2] ? [] : [url];
    });

    expect(mismatched).toEqual([]);
  });
});
