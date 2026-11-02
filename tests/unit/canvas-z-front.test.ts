import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bringForward } from "../../src/platform/canvas/z-order.ts";
import { alreadyInFront, bringToFront, bringToFrontCanvas } from "../../src/platform/canvas/z-order.ts";

const nodes = [
  { id: "node_a10000000002", z: 1 },
  { id: "node_a10000000003", z: 2 },
  { id: "node_a10000000004", z: 3 },
];

test("bring to front sets z above every sibling", () => {
  const front = bringToFront(nodes, "node_a10000000002");
  assert.equal(front.refused, false);
  assert.equal(front.nodes[0]?.z, 4);
  assert.ok((front.nodes[0]?.z ?? 0) > (front.nodes[1]?.z ?? 0));
  assert.ok((front.nodes[0]?.z ?? 0) > (front.nodes[2]?.z ?? 0));
  const stepped = bringForward(nodes, "node_a10000000002");
  assert.deepEqual(stepped.map((node) => node.z), [2, 1, 3]);
});

test("cap 200 refuses and a node already in front stays put", () => {
  const capped = bringToFront([
    { id: "node_a10000000002", z: 200 },
    { id: "node_a10000000003", z: 200 },
  ], "node_a10000000002");
  assert.equal(capped.refused, true);
  assert.deepEqual(capped.nodes.map((node) => node.z), [200, 200]);
  const ahead = bringToFront([
    { id: "node_a10000000002", z: 8 },
    { id: "node_a10000000003", z: 2 },
  ], "node_a10000000002");
  assert.equal(ahead.refused, true);
  assert.equal(ahead.nodes[0]?.z, 8);
  assert.equal(alreadyInFront, "This item is already at the front.");
  const document = {
    pages: [{
      root: {
        id: "node_a10000000001",
        children: [
          { id: "node_a10000000002", metadata: { z: 1 } },
          { id: "node_a10000000003", metadata: { z: 4 } },
        ],
      },
    }],
  };
  const moved = bringToFrontCanvas(structuredClone(document), "node_a10000000002");
  assert.equal(moved?.ok, true);
  if (!moved || !moved.ok) return;
  assert.equal(moved.refused, false);
  const children = (moved.document as typeof document).pages[0]?.root.children ?? [];
  assert.equal(children[0]?.metadata.z, 5);
  assert.equal(bringToFrontCanvas(null, "node_a10000000002"), null);
  const source = readFileSync(new URL("../../src/platform/canvas/z-order.ts", import.meta.url), "utf8");
  assert.equal(source.includes(alreadyInFront), true);
  assert.equal(source.includes("overlays/"), false);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
});
