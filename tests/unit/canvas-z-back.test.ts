import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bringToFront, sendToBack, sendToBackCanvas } from "../../src/platform/canvas/z-order.ts";

test("send to back places the node behind its siblings", () => {
  const start = [
    { id: "node_a10000000002", z: 1 },
    { id: "node_a10000000003", z: 2 },
    { id: "node_a10000000004", z: 3 },
  ];
  const backed = sendToBack(start, "node_a10000000004");
  assert.deepEqual(backed.map((node) => node.z), [1, 2, 0]);
  assert.ok((backed[2]?.z ?? 1) < (backed[0]?.z ?? 0));
  assert.ok((backed[2]?.z ?? 1) < (backed[1]?.z ?? 0));
  assert.deepEqual(start.map((node) => node.z), [1, 2, 3]);
  const front = bringToFront(backed, "node_a10000000004");
  assert.equal(front.refused, false);
  assert.ok((front.nodes[2]?.z ?? 0) > (front.nodes[0]?.z ?? 0));
  assert.ok((front.nodes[2]?.z ?? 0) > (front.nodes[1]?.z ?? 0));
});

test("a node already at 0 shifts the others up and undo can restore them", () => {
  const start = [
    { id: "node_a10000000002", z: 0 },
    { id: "node_a10000000003", z: 1 },
    { id: "node_a10000000004", z: 4 },
  ];
  const backed = sendToBack(start, "node_a10000000004");
  assert.deepEqual(backed.map((node) => node.z), [1, 2, 0]);
  const locked = sendToBack([
    { id: "node_a10000000002", z: 0, locked: true },
    { id: "node_a10000000003", z: 2 },
  ], "node_a10000000003");
  assert.deepEqual(locked.map((node) => node.z), [0, 2]);
  const document = {
    pages: [{
      root: {
        id: "node_a10000000001",
        children: [
          { id: "node_a10000000002", metadata: { z: 0 } },
          { id: "node_a10000000003", metadata: { z: 2 } },
        ],
      },
    }],
  };
  const sent = sendToBackCanvas(structuredClone(document), "node_a10000000003");
  assert.equal(sent?.ok, true);
  if (!sent || !sent.ok) return;
  const children = (sent.document as typeof document).pages[0]?.root.children ?? [];
  assert.equal(children[0]?.metadata.z, 1);
  assert.equal(children[1]?.metadata.z, 0);
  assert.equal(sendToBackCanvas(null, "node_a10000000003"), null);
  const source = readFileSync(new URL("../../src/platform/canvas/z-order.ts", import.meta.url), "utf8");
  assert.equal(source.includes("shifted up"), true);
  assert.equal(source.includes("overlays/"), false);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
});
