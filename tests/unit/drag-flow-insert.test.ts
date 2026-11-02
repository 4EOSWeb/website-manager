import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { flowInsert, flowInsertionLine, flowReorder } from "../../src/platform/drag/flow-insert.ts";

const parent = "node_a10000000001";
const first = "node_a10000000002";
const second = "node_a10000000003";
const third = "node_a10000000004";

type FlowNode = { id: string; children: FlowNode[]; metadata?: { legacyId?: string } };

function document(): { version: number; pages: { id: string; route: string; root: FlowNode }[] } {
  return {
    version: 1,
    pages: [
      {
        id: "page_aaaaaaaaaaaa",
        route: "/",
        root: {
          id: parent,
          children: [
            { id: first, children: [] },
            { id: second, children: [] },
            { id: third, children: [] },
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

test("flow direction chooses the insertion line", () => {
  assert.equal(flowInsertionLine("vertical"), "horizontal");
  assert.equal(flowInsertionLine("horizontal"), "vertical");
});

test("dropping below a sibling places the node after it", () => {
  const source = document();
  const next = flowReorder(source, first, second, true);
  assert.ok(next);
  assert.deepEqual(ids(next), [second, first, third]);
  assert.deepEqual(ids(source), [first, second, third]);
});

test("a new node and a same-parent move share flow insert", () => {
  const source = document();
  const created = "node_b10000000001";
  const inserted = flowInsert(source, { parentId: parent, index: 1, node: { id: created, children: [] } });
  assert.ok(inserted);
  assert.deepEqual(ids(inserted), [first, created, second, third]);
  const moved = flowInsert(source, { parentId: parent, index: 2, nodeId: first });
  assert.ok(moved);
  assert.deepEqual(ids(moved), [second, third, first]);
});

test("a legacy block id reorders through the same function", () => {
  const source = document();
  const root = source.pages[0].root;
  root.children[0] = { id: first, children: [], metadata: { legacyId: `page/0/block/0/${"blk_alpha"}` } };
  root.children[1] = { id: second, children: [], metadata: { legacyId: `page/0/block/1/${"blk_beta"}` } };
  const next = flowReorder(source, "blk_alpha", "blk_beta", true);
  assert.ok(next);
  assert.deepEqual(ids(next), [second, first, third]);
});

test("a different parent is left unchanged", () => {
  const source = document();
  source.pages[0].root.children[2] = {
    id: third,
    children: [{ id: "node_c10000000001", children: [] }],
  };
  assert.equal(flowReorder(source, first, "node_c10000000001", true), null);
  assert.equal(flowInsert(null, { parentId: parent, index: 0, nodeId: first }), null);
  const sourceText = readFileSync(new URL("../../src/platform/drag/flow-insert.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(sourceText.includes(word), false, word);
  }
});
