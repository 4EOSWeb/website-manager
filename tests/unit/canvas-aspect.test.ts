import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lockAspect, ratioWithin } from "../../src/platform/canvas/aspect.ts";
import { placeOnCanvas } from "../../src/platform/drag/canvas-place.ts";

const start = { x: 8, y: 8, w: 36, h: 28 };

test("shift resize keeps the start ratio within 1 percent", () => {
  const proposed = { x: 8, y: 8, w: 50, h: 50 };
  const locked = lockAspect(proposed, start, { shift: true, corner: "se" });
  assert.equal(ratioWithin(locked, start), true);
  const freed = lockAspect(proposed, start, { shift: false, corner: "se" });
  assert.deepEqual(freed, proposed);
  assert.equal(ratioWithin(freed, start), false);
});

test("a stored aspect survives reload", () => {
  const stored = placeOnCanvas({
    version: 1,
    pages: [{
      id: "page_aaaaaaaaaaaa",
      route: "/",
      root: {
        id: "node_a10000000001",
        type: "section",
        children: [{ id: "node_a10000000002", type: "image", box: { x: 8, y: 8, w: 36, h: 28, aspect: 1.5 }, children: [] }],
      },
    }],
  }, { nodeId: "node_a10000000002", breakpoint: "desktop", x: 10, y: 12, w: 30, h: 10 });
  const box = (stored as { pages: { root: { children: { box: { x: number; y: number; w: number; h: number; aspect?: number } }[] } }[] }).pages[0].root.children[0].box;
  assert.equal(box.aspect, 1.5);
  assert.equal(ratioWithin(box, { w: 1.5, h: 1 }), true);
  const source = readFileSync(new URL("../../src/platform/canvas/aspect.ts", import.meta.url), "utf8");
  assert.equal(source.includes("overlays/"), false);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
  const script = readFileSync(new URL("../../src/platform/canvas/runtime.ts", import.meta.url), "utf8");
  assert.equal(script.includes("drag.shift"), true);
});
