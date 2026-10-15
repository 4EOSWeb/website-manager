import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { acceptLink, linkTarget } from "../../src/components/editor/inspector/link-model.ts";

test("a page path saves, a javascript address does not, and new tab is target new", () => {
  assert.equal(acceptLink("/contact"), "/contact");
  assert.equal(acceptLink("  /contact  "), "/contact");
  assert.equal(acceptLink("javascript:alert(1)"), null);
  assert.equal(acceptLink("javascript:void(0)"), null);
  assert.equal(linkTarget(true), "new");
  assert.equal(linkTarget(false), "same");
  const fields = readFileSync("src/components/editor/inspector/link-fields.tsx", "utf8");
  assert.equal(fields.includes("LinkPicker"), true);
  assert.equal(fields.includes("acceptLink"), true);
  assert.equal(fields.includes("Open in a new tab"), true);
  const lowered = `${fields}\n${readFileSync("src/components/editor/inspector/link-model.ts", "utf8")}`.toLowerCase();
  assert.equal(lowered.includes("quantum"), false);
  assert.equal(lowered.includes("plum"), false);
  assert.equal(lowered.includes("hero"), false);
  const blocks = readFileSync("src/components/editor/inspector/blocks.tsx", "utf8");
  assert.equal(blocks.includes("LinkPicker"), true);
  assert.equal(blocks.includes("Open in a new tab"), true);
});
