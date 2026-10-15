import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateDocument } from "../../src/platform/document/document.ts";
import { emptyCanvasPage } from "./fixtures/empty-canvas-page.ts";
import { stackedPage } from "./fixtures/stacked-page.ts";

test("generic fixtures validate and do not name a specific website", () => {
  const canvas = validateDocument(emptyCanvasPage);
  const stacked = validateDocument(stackedPage);
  assert.equal(canvas.ok, true);
  assert.equal(stacked.ok, true);
  if (canvas.ok) assert.equal(canvas.value.pages[0]?.root.layout?.mode, "canvas");
  if (stacked.ok) {
    assert.equal(stacked.value.pages[0]?.root.layout?.mode, "flow");
    assert.deepEqual(stacked.value.pages[0]?.root.children.map((child) => child.type), ["heading", "text"]);
  }
  for (const name of ["empty-canvas-page.ts", "stacked-page.ts"]) {
    const source = readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
    assert.equal(/quantum|insights|plum|heroimage|brand-mark|\/about|\/contact|\/insights/i.test(source), false);
  }
});
