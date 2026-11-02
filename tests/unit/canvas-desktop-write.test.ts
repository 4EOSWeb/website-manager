import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { writeDesktopBox, type BreakpointNode } from "../../src/platform/canvas/breakpoint-write.ts";
import { placeOnCanvas } from "../../src/platform/drag/canvas-place.ts";

test("a desktop move changes the base box and leaves tablet and mobile absent", () => {
  const node: BreakpointNode = { box: { x: 8, y: 8, w: 20, h: 10 } };
  const next = writeDesktopBox(node, { x: 32, y: 14, w: 20, h: 10 });
  assert.deepEqual(next.box, { x: 32, y: 14, w: 20, h: 10 });
  assert.equal(next.responsive, undefined);
  assert.equal(node.box?.x, 8);
  const existing: BreakpointNode = {
    box: { x: 8, y: 8, w: 20, h: 10 },
    responsive: { strategy: "custom", tablet: { box: { x: 4, y: 6, w: 20, h: 10 } } },
  };
  const kept = writeDesktopBox(existing, { x: 32, y: 14, w: 20, h: 10 });
  assert.equal(kept.box?.x, 32);
  assert.deepEqual(kept.responsive?.tablet?.box, { x: 4, y: 6, w: 20, h: 10 });
  assert.equal(kept.responsive?.mobile, undefined);
  const document = {
    pages: [{
      root: {
        id: "node_a10000000001",
        children: [{ id: "node_a10000000002", type: "text" }],
      },
    }],
  };
  const stored = placeOnCanvas(document, { nodeId: "node_a10000000002", breakpoint: "desktop", x: 18, y: 22, w: 30, h: 12 });
  const child = (stored as { pages: { root: { children: { box?: { x: number }; responsive?: unknown }[] } }[] }).pages[0]?.root.children[0];
  assert.equal(child?.box?.x, 18);
  assert.equal(child?.responsive, undefined);
  const source = readFileSync(new URL("../../src/platform/canvas/breakpoint-write.ts", import.meta.url), "utf8");
  assert.equal(source.includes("overlays/"), false);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
});
