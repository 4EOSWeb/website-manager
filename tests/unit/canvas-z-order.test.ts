import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bringForward, bringForwardCanvas, sendBackward, sendBackwardCanvas } from "../../src/platform/canvas/z-order.ts";

test("bring forward swaps with the next sibling and does not jump to the front", () => {
  const raised = bringForward([
    { id: "node_a10000000002", z: 1 },
    { id: "node_a10000000003", z: 2 },
    { id: "node_a10000000004", z: 3 },
  ], "node_a10000000002");
  assert.deepEqual(raised.map((node) => node.z), [2, 1, 3]);
  const gap = bringForward([{ id: "node_a10000000002", z: 1 }, { id: "node_a10000000003", z: 5 }], "node_a10000000002");
  assert.deepEqual(gap.map((node) => node.z), [2, 5]);
});

test("send backward swaps with the previous sibling and undo restores z", () => {
  const start = [
    { id: "node_a10000000002", z: 1 },
    { id: "node_a10000000003", z: 2 },
  ];
  const lowered = sendBackward(start, "node_a10000000003");
  assert.deepEqual(lowered.map((node) => node.z), [2, 1]);
  assert.deepEqual(bringForward(lowered, "node_a10000000003").map((node) => node.z), [1, 2]);
  const blocked = sendBackward([
    { id: "node_a10000000002", z: 1, locked: true },
    { id: "node_a10000000003", z: 2 },
  ], "node_a10000000003");
  assert.deepEqual(blocked.map((node) => node.z), [1, 2]);
  const document = {
    pages: [{
      root: {
        id: "node_a10000000001",
        children: [
          { id: "node_a10000000002", metadata: { z: 1 } },
          { id: "node_a10000000003", metadata: { z: 2 } },
        ],
      },
    }],
  };
  const sent = sendBackwardCanvas(structuredClone(document), "node_a10000000003");
  assert.equal(sent?.ok, true);
  if (!sent || !sent.ok) return;
  const children = (sent.document as typeof document).pages[0]?.root.children ?? [];
  assert.equal(children[0]?.metadata.z, 2);
  assert.equal(children[1]?.metadata.z, 1);
});

test("a locked node does not change z", () => {
  const locked = bringForward([
    { id: "node_a10000000002", z: 1, locked: true },
    { id: "node_a10000000003", z: 2 },
  ], "node_a10000000002");
  assert.deepEqual(locked.map((node) => node.z), [1, 2]);
  const neighbor = bringForward([
    { id: "node_a10000000002", z: 1 },
    { id: "node_a10000000003", z: 2, locked: true },
  ], "node_a10000000002");
  assert.equal(neighbor[1]?.z, 2);
  assert.equal(neighbor[1]?.locked, true);
  const document = {
    pages: [{
      root: {
        id: "node_a10000000001",
        children: [
          { id: "node_a10000000002", metadata: { z: 1 } },
          { id: "node_a10000000003", metadata: { z: 2 } },
        ],
      },
    }],
  };
  const forwarded = bringForwardCanvas(structuredClone(document), "node_a10000000002");
  assert.equal(forwarded?.ok, true);
  if (!forwarded || !forwarded.ok) return;
  const children = (forwarded.document as typeof document).pages[0]?.root.children ?? [];
  assert.equal(children[0]?.metadata.z, 2);
  assert.equal(children[1]?.metadata.z, 1);
  assert.equal(bringForwardCanvas(null, "node_a10000000002"), null);
  const source = readFileSync(new URL("../../src/platform/canvas/z-order.ts", import.meta.url), "utf8");
  assert.equal(source.includes("overlays/"), false);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
});
