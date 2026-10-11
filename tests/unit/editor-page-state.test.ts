import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { articlePatternFrom, articleRouteFor, articleSlug, selectActivePage } from "../../src/components/editor/state/page.ts";

const visual = {
  version: 1,
  pages: [{ id: "page_abcdefabcdef", route: "/", title: "Home" }],
};
const version3 = [{ id: "page_home", route: "/", title: "Home" }];

test("home opens from the visual document route", () => {
  const page = selectActivePage("/", visual, version3);
  assert.equal(page?.source, "visual");
  assert.equal(page?.route, "/");
  assert.equal(page?.id, "page_abcdefabcdef");
  assert.equal(selectActivePage("/missing", visual, version3), null);
});

test("a version 3-only draft still opens", () => {
  const page = selectActivePage("/", null, version3);
  assert.equal(page?.source, "version3");
  assert.equal(page?.id, "page_home");
});

test("article routes come from the adapter pattern", () => {
  const pattern = articlePatternFrom({ articles: { enabled: true, routePattern: "/insights/:slug" } });
  assert.equal(pattern, "/insights/:slug");
  assert.equal(articleRouteFor(pattern ?? "", "note"), "/insights/note");
  assert.equal(articleSlug(pattern ?? "", "/insights/note"), "note");
  assert.equal(articleSlug(pattern ?? "", "/insights"), null);
  assert.equal(articlePatternFrom(null), null);
  assert.equal(articlePatternFrom({ articles: { enabled: false, routePattern: "/insights/:slug" } }), null);
  const shell = readFileSync(new URL("../../src/components/editor-shell.tsx", import.meta.url), "utf8");
  assert.equal(shell.includes("`/insights/${item.slug}`"), false);
  assert.equal(shell.includes("`/insights/${post.slug}`"), false);
});
