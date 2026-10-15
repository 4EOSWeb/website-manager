import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { slugPatternOf, slugProblem } from "../../src/platform/pages/slug.ts";

const pattern = "/[a-z0-9]+(?:-[a-z0-9]+)*";

test("page addresses follow the adapter pattern", () => {
  assert.equal(slugProblem("", pattern).length > 0, true);
  assert.equal(slugProblem("/", pattern).length > 0, true);
  assert.equal(slugProblem("/notes", pattern), "");
  assert.equal(slugProblem("/Not-Valid", pattern).length > 0, true);
  const custom = slugPatternOf({ pageRules: { slugPattern: "/journal/[a-z]+" } });
  assert.equal(slugProblem("/journal/notes", custom), "");
  assert.equal(slugProblem("/notes", custom).length > 0, true);
  const source = readFileSync("src/platform/pages/slug.ts", "utf8").toLowerCase();
  assert.equal(source.includes("quantum"), false);
  assert.equal(source.includes("insights"), false);
  assert.equal(source.includes("/about"), false);
  assert.equal(source.includes("/contact"), false);
  assert.equal(source.includes("plum"), false);
});
