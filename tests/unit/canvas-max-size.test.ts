import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { enforceMaxSize } from "../../src/platform/canvas/max-size.ts";
import { enforceMinSize } from "../../src/platform/canvas/min-size.ts";
import { placeOnCanvas } from "../../src/platform/drag/canvas-place.ts";

test("width cannot exceed the parent and x plus w stays inside", () => {
  const wide = enforceMaxSize({ x: 0, y: 0, w: 140, h: 28 });
  assert.equal(wide.w, 100);
  assert.equal(wide.x + wide.w, 100);
  const overflow = enforceMaxSize({ x: 80, y: 70, w: 50, h: 40 });
  assert.equal(overflow.w, 20);
  assert.equal(overflow.x + overflow.w, 100);
  assert.equal(overflow.h, 30);
  assert.equal(overflow.y + overflow.h, 100);
  const limited = enforceMaxSize({ x: 10, y: 10, w: 80, h: 80 }, { maxWidth: 40, maxHeight: 25 });
  assert.equal(limited.w, 40);
  assert.equal(limited.h, 25);
});

test("the stored box stays inside and the minimum still applies", () => {
  const fitted = enforceMaxSize(enforceMinSize({ x: 10, y: 12, w: 1, h: 0.4 }));
  assert.equal(fitted.w, 2);
  assert.equal(fitted.h, 2);
  const stored = placeOnCanvas({
    version: 1,
    pages: [{ id: "page_aaaaaaaaaaaa", route: "/", root: { id: "node_a10000000001", type: "section", children: [{ id: "node_a10000000002", type: "image", box: { x: 10, y: 12, w: 36, h: 28 }, children: [] }] } }],
  }, { nodeId: "node_a10000000002", breakpoint: "desktop", x: 80, y: 70, w: 50, h: 40 });
  const box = (stored as { pages: { root: { children: { box: { x: number; y: number; w: number; h: number } }[] } }[] }).pages[0].root.children[0].box;
  assert.deepEqual(box, { x: 80, y: 70, w: 20, h: 30 });
  const source = readFileSync(new URL("../../src/platform/canvas/max-size.ts", import.meta.url), "utf8");
  assert.equal(source.includes("overlays/"), false);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
  const script = readFileSync(new URL("../../src/platform/canvas/runtime.ts", import.meta.url), "utf8");
  assert.equal(script.includes("next.x + next.w > 1"), true);
});
