import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { currentParent } from "../../src/platform/drag/current-parent.ts";

function node(id: string, children: Array<Record<string, unknown>> = []) {
  return { id, type: "section", componentId: "generic.section", props: {}, styles: {}, responsive: {}, children, visibility: { hidden: false, hideOn: [] }, locked: { locked: false }, metadata: {} };
}

test("a child returns its parent and the page root cannot be dragged", () => {
  const child = node("node_a10000000003");
  const parent = node("node_a10000000002", [child]);
  const root = node("node_a10000000001", [parent]);
  const document = { version: 1, pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }] };
  assert.deepEqual(currentParent(document, child.id), { ok: true, parentId: parent.id });
  assert.deepEqual(currentParent(document, parent.id), { ok: true, parentId: root.id });
  assert.deepEqual(currentParent(document, root.id), { ok: false, code: "page_root" });
  assert.deepEqual(currentParent(document, "node_bbbbbbbbbbbb"), { ok: false, code: "node_not_found" });
  const source = readFileSync(new URL("../../src/platform/drag/current-parent.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
  }
});
