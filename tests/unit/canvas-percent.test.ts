import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { toPercent, toPixel } from "../../src/platform/canvas/percent.ts";
import { canvasPoint, placeOnCanvas } from "../../src/platform/drag/canvas-place.ts";

test("percent and pixels convert inside the parent", () => {
  assert.equal(toPixel(50, 200), 100);
  assert.equal(toPercent(100, 200), 50);
  assert.equal(toPercent(250, 200), 100);
  assert.equal(toPercent(-20, 200), 0);
  assert.equal(toPixel(140, 200), 200);
  assert.equal(toPercent(1, 3), 33.3);
  assert.equal(toPercent(0, 0), 0);
  const source = readFileSync(new URL("../../src/platform/canvas/percent.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
  }
});

test("an existing parent-relative placement still lands on the same point", () => {
  const parent = { x: 40, y: 80, width: 400, height: 200 };
  assert.deepEqual(canvasPoint({ x: 140, y: 130 }, parent), { x: 25, y: 25 });
  assert.deepEqual(canvasPoint({ x: 900, y: 900 }, parent), { x: 100, y: 100 });
  const stored = placeOnCanvas({
    version: 1,
    pages: [{ id: "page_aaaaaaaaaaaa", route: "/", root: { id: "node_a10000000001", type: "section", children: [{ id: "node_a10000000002", type: "button", box: { x: 18.75, y: 32.11, w: 42, h: 28 }, children: [] }] } }],
  }, { nodeId: "node_a10000000002", breakpoint: "desktop", x: 18.75, y: 32.11, w: 42, h: 28 });
  const box = (stored as { pages: { root: { children: { box: { x: number; y: number } }[] } }[] }).pages[0].root.children[0].box;
  assert.deepEqual(box, { x: 18.75, y: 32.11, w: 42, h: 28 });
});
