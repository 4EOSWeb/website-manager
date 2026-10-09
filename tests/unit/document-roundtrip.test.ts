import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { validateDocument as validateFromDocument } from "../../src/platform/document/index.ts";
import { validateDocument as validateFromPlatform } from "../../src/platform/index.ts";
import { emptyCanvasPage } from "./fixtures/empty-canvas-page.ts";
import { stackedPage } from "./fixtures/stacked-page.ts";

function shape(document: { pages: Array<{ id: string; root: { id: string; layout?: { mode?: string }; children: Array<{ id: string }> } }> }) {
  const page = document.pages[0];
  return {
    pageId: page?.id,
    rootId: page?.root.id,
    mode: page?.root.layout?.mode,
    childIds: page?.root.children.map((child) => child.id),
  };
}

test("fixtures keep their ids and order after JSON", () => {
  for (const fixture of [emptyCanvasPage, stackedPage]) {
    const parsed = validateFromDocument(JSON.parse(JSON.stringify(fixture)));
    const throughPlatform = validateFromPlatform(JSON.parse(JSON.stringify(fixture)));
    assert.equal(parsed.ok, true);
    assert.equal(throughPlatform.ok, true);
    if (parsed.ok && throughPlatform.ok) {
      assert.deepEqual(shape(parsed.value), shape(fixture));
      assert.deepEqual(shape(throughPlatform.value), shape(fixture));
    }
  }
  const scan = spawnSync("rg", ["-i", "quantum|insights|heroimage|brand-mark|plum", "src/platform"], { encoding: "utf8" });
  assert.equal(scan.stdout, "");
  assert.equal(scan.status, 1);
});
