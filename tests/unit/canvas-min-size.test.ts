import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { enforceMinSize, minimumSize } from "../../src/platform/canvas/min-size.ts";
import { placeOnCanvas } from "../../src/platform/drag/canvas-place.ts";

test("width and height cannot go below the minimum", () => {
  assert.deepEqual(minimumSize(), { width: 2, height: 2 });
  assert.deepEqual(minimumSize({ minWidth: 8, minHeight: 4 }), { width: 8, height: 4 });
  const floored = enforceMinSize({ x: 10, y: 12, w: 1, h: 0.4 });
  assert.equal(floored.w, 2);
  assert.equal(floored.h, 2);
  const custom = enforceMinSize({ x: 0, y: 0, w: 5, h: 5 }, { minWidth: 8, minHeight: 4 });
  assert.equal(custom.w, 8);
  assert.equal(custom.h, 5);
  const west = enforceMinSize({ x: 10, y: 10, w: 1, h: 1 }, undefined, "nw");
  assert.equal(west.w, 2);
  assert.equal(west.h, 2);
  assert.equal(west.x, 9);
  assert.equal(west.y, 9);
});

test("a larger resize stays larger and the stored box keeps the floor", () => {
  assert.deepEqual(enforceMinSize({ x: 10, y: 20, w: 36, h: 28 }), { x: 10, y: 20, w: 36, h: 28 });
  const stored = placeOnCanvas({
    version: 1,
    pages: [{ id: "page_aaaaaaaaaaaa", route: "/", root: { id: "node_a10000000001", type: "section", children: [{ id: "node_a10000000002", type: "image", box: { x: 10, y: 12, w: 36, h: 28 }, children: [] }] } }],
  }, { nodeId: "node_a10000000002", breakpoint: "desktop", x: 10, y: 12, w: 1, h: 0.4 });
  const box = (stored as { pages: { root: { children: { box: { x: number; y: number; w: number; h: number } }[] } }[] }).pages[0].root.children[0].box;
  assert.deepEqual(box, { x: 10, y: 12, w: 2, h: 2 });
  const source = readFileSync(new URL("../../src/platform/canvas/min-size.ts", import.meta.url), "utf8");
  assert.equal(source.includes("overlays/"), false);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
  const script = readFileSync(new URL("../../overlays/quantum-age/src/components/site/canvas-script.ts", import.meta.url), "utf8");
  assert.equal(script.includes("canvasZone ? 0.02"), true);
});
