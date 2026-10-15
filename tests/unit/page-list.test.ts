import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { listedPages, pageGroups } from "../../src/components/editor/page-list.ts";

const legacy = [
  { route: "/", title: "Home", navVisible: true, archived: false },
  { route: "/contact", title: "Contact", navVisible: true, archived: false },
  { route: "/notes", title: "Notes", navVisible: false, archived: true },
];

test("a partial visual document falls back to the version 3 page list", () => {
  const visual = { version: 1, pages: [{ id: "page_0123456789ab", route: "/notes", title: "Notes", metadata: {} }] };
  const pages = listedPages(visual, legacy);
  assert.deepEqual(pages.map((page) => page.route), ["/", "/contact", "/notes"]);
  const groups = pageGroups(pages);
  assert.deepEqual(groups[0]?.items.map((page) => page.title), ["Home", "Contact"]);
  assert.deepEqual(groups[2]?.items.map((page) => page.title), ["Notes"]);
  const covered = listedPages({ version: 1, pages: legacy.map((page) => ({ ...page, id: "page_0123456789ab", metadata: { navVisible: page.navVisible, archived: page.archived } })) }, legacy);
  assert.equal(covered.find((page) => page.route === "/notes")?.archived, true);
  const panel = readFileSync("src/components/editor/panels.tsx", "utf8");
  assert.equal(panel.includes("/insights/"), false);
  const lowered = readFileSync("src/components/editor/page-list.ts", "utf8").toLowerCase();
  assert.equal(lowered.includes("quantum"), false);
  assert.equal(lowered.includes("insights"), false);
  assert.equal(lowered.includes("hero"), false);
});
