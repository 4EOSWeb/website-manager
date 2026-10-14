import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateDocument } from "../../src/platform/document/document.ts";
import { blankCanvasPage } from "../../src/platform/templates/blank-canvas.ts";
import { blankStructuredPage } from "../../src/platform/templates/blank-structured.ts";

test("a blank canvas page has no children and a blank structured page stays flow", () => {
  const document = blankCanvasPage();
  assert.equal(document.pages[0]?.root.layout?.mode, "canvas");
  assert.equal(document.pages[0]?.root.children.length, 0);
  const parsed = validateDocument(document);
  assert.equal(parsed.ok, true);
  assert.equal(blankStructuredPage().pages[0]?.root.layout?.mode, "flow");
  const source = readFileSync("src/platform/templates/blank-canvas.ts", "utf8").toLowerCase();
  assert.equal(source.includes("quantum"), false);
  assert.equal(source.includes("hero"), false);
  assert.equal(source.includes("plum"), false);
});
