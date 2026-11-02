import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { flexIndexFromPointer, flexInsert, flexInsertionLine } from "../../src/platform/drag/flex-insert.ts";
import { flowReorder } from "../../src/platform/drag/flow-insert.ts";

const parent = "node_a10000000001";
const first = "node_a10000000002";
const second = "node_a10000000003";
const layout = { mode: "layout", display: "flex", direction: "row", gap: 12, align: "start", justify: "between", wrap: false };
const parents = { allowedParents: ["stack", "section", "container"] };
const openParent = { acceptsChildren: true as const };

function document() {
  return {
    version: 1,
    pages: [
      {
        id: "page_aaaaaaaaaaaa",
        route: "/",
        root: {
          id: parent,
          type: "stack",
          layout,
          children: [
            { id: first, type: "card", children: [] },
            { id: second, type: "card", children: [] },
          ],
        },
      },
    ],
  };
}

function ids(value: unknown): string[] {
  const root = (value as { pages: { root: { children: { id: string }[] } }[] }).pages[0].root;
  return root.children.map((child) => child.id);
}

test("row insert uses the x position and column uses a horizontal line", () => {
  const row = [{ start: 0, end: 100 }, { start: 120, end: 220 }];
  assert.equal(flexIndexFromPointer("row", 180, row), 2);
  assert.equal(flexIndexFromPointer("row", 40, row), 0);
  assert.equal(flexIndexFromPointer("column", 180, row), 2);
  assert.equal(flexInsertionLine("row"), "vertical");
  assert.equal(flexInsertionLine("column"), "horizontal");
});

test("a flex drop changes child order and keeps flex settings", () => {
  const source = document();
  const next = flexInsert(source, {
    parentId: parent,
    index: 2,
    nodeId: first,
    draggedLocked: false,
    childType: "card",
    childParents: parents,
    parentType: "stack",
    parentChildren: openParent,
  });
  assert.equal(next.ok, true);
  if (!next.ok) return;
  assert.deepEqual(ids(next.document), [second, first]);
  const root = (next.document as { pages: { root: { layout: unknown } }[] }).pages[0].root;
  assert.deepEqual(root.layout, layout);
  assert.deepEqual((source.pages[0].root.layout), layout);
});

test("an incompatible flex child is rejected and flow reorder still works", () => {
  const source = document();
  const rejected = flexInsert(source, {
    parentId: parent,
    index: 1,
    nodeId: first,
    draggedLocked: false,
    childType: "button",
    childParents: parents,
    parentType: "text",
    parentChildren: { acceptsChildren: false },
  });
  assert.deepEqual(rejected, { ok: false, reason: "parent_rejected" });
  assert.deepEqual(ids(source), [first, second]);
  const locked = flexInsert(source, {
    parentId: parent,
    index: 1,
    nodeId: first,
    draggedLocked: true,
    childType: "card",
    childParents: parents,
    parentType: "stack",
    parentChildren: openParent,
  });
  assert.deepEqual(locked, { ok: false, reason: "locked" });
  const flowed = flowReorder(source, first, second, true);
  assert.ok(flowed);
  assert.deepEqual(ids(flowed), [second, first]);
  const sourceText = readFileSync(new URL("../../src/platform/drag/flex-insert.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(sourceText.includes(word), false, word);
  }
});
