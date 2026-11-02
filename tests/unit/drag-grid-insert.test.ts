import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gridCellIndex, gridInsert } from "../../src/platform/drag/grid-insert.ts";
import { flexIndexFromPointer } from "../../src/platform/drag/flex-insert.ts";
import { flowReorder } from "../../src/platform/drag/flow-insert.ts";

const parent = "node_a10000000001";
const first = "node_a10000000002";
const second = "node_a10000000003";
const third = "node_a10000000004";
const layout = { mode: "layout", display: "grid", columns: 2, gap: 16, align: "stretch" };

function document() {
  return {
    version: 1,
    pages: [
      {
        id: "page_aaaaaaaaaaaa",
        route: "/",
        root: {
          id: parent,
          type: "grid",
          layout,
          children: [
            { id: first, type: "card", children: [] },
            { id: second, type: "card", children: [] },
            { id: third, type: "card", children: [] },
          ],
        },
      },
    ],
  };
}

function ids(value: unknown): string[] {
  const root = (value as { pages: { root: { children: { id: string }[]; layout: { columns: number } } }[] }).pages[0].root;
  return root.children.map((child) => child.id);
}

test("the other column is the cell under the pointer", () => {
  const origin = { x: 0, y: 0 };
  const cell = { width: 100, height: 80 };
  assert.equal(gridCellIndex(2, { x: 150, y: 10 }, origin, cell), 1);
  assert.equal(gridCellIndex(2, { x: 20, y: 10 }, origin, cell), 0);
  assert.equal(gridCellIndex(2, { x: 150, y: 100 }, origin, cell), 3);
});

test("the highlighted cell receives the node and the column count stays", () => {
  const source = document();
  const next = gridInsert(source, { parentId: parent, nodeId: first, cell: 1 });
  assert.ok(next);
  assert.deepEqual(ids(next), [second, first, third]);
  const columns = (next as { pages: { root: { layout: { columns: number } } }[] }).pages[0].root.layout.columns;
  assert.equal(columns, 2);
  assert.equal(source.pages[0].root.layout.columns, 2);
  assert.equal(flexIndexFromPointer("row", 180, [{ start: 0, end: 100 }, { start: 120, end: 220 }]), 2);
  const flowed = flowReorder(source, first, second, true);
  assert.ok(flowed);
  assert.deepEqual(ids(flowed), [second, first, third]);
  const sourceText = readFileSync(new URL("../../src/platform/drag/grid-insert.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(sourceText.includes(word), false, word);
  }
});
