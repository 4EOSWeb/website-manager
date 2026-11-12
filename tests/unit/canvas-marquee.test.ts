import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { canStartMarquee, marqueeBox, marqueeReady, nodesInMarquee } from "../../src/platform/canvas/marquee.ts";

test("nodes inside the rectangle are selected", () => {
  assert.equal(marqueeReady(0, 0, 3, 0), false);
  assert.equal(marqueeReady(0, 0, 4, 0), true);
  const rect = marqueeBox(80, 200, 10, 20);
  assert.deepEqual(rect, { x: 10, y: 20, w: 70, h: 180 });
  const selected = nodesInMarquee(rect, [
    { id: "node_a10000000001", x: 20, y: 30, w: 40, h: 20 },
    { id: "node_a10000000002", x: 30, y: 80, w: 20, h: 20 },
    { id: "node_a10000000003", x: 200, y: 30, w: 20, h: 20 },
  ]);
  assert.deepEqual(selected, ["node_a10000000001", "node_a10000000002"]);
});

test("a marquee does not start on a node, a handle, or a text selection", () => {
  assert.equal(canStartMarquee({ onNode: true, onHandle: false, textSelected: false }), false);
  assert.equal(canStartMarquee({ onNode: false, onHandle: true, textSelected: false }), false);
  assert.equal(canStartMarquee({ onNode: false, onHandle: false, textSelected: true }), false);
  assert.equal(canStartMarquee({ onNode: false, onHandle: false, textSelected: false }), true);
  const source = readFileSync(new URL("../../src/platform/canvas/marquee.ts", import.meta.url), "utf8");
  assert.equal(source.includes("overlays/"), false);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
  const script = readFileSync(new URL("../../src/platform/canvas/runtime.ts", import.meta.url), "utf8");
  assert.equal(script.includes('kind: "marquee"'), true);
  assert.equal(script.includes('data-marquee", "true"'), true);
  assert.equal(script.includes("function startDrag"), true);
  assert.equal(script.includes("function selectionBlocksDrag"), true);
});
