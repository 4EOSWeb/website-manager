import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { writeTabletBox, type BreakpointNode } from "../../src/platform/canvas/breakpoint-write.ts";
import { placeOnCanvas } from "../../src/platform/drag/canvas-place.ts";

test("a tablet move keeps the desktop box and leaves mobile absent", () => {
  const sibling: BreakpointNode = { box: { x: 4, y: 4, w: 10, h: 8 } };
  const heading: BreakpointNode = { box: { x: 8, y: 8, w: 20, h: 10 } };
  const next = writeTabletBox(heading, { x: 44, y: 18, w: 20, h: 10 });
  assert.equal(next.box?.x, 8);
  assert.equal(next.box?.y, 8);
  assert.equal(next.responsive?.strategy, "custom");
  assert.equal(next.responsive?.tablet?.box?.x, 44);
  assert.equal(next.responsive?.mobile, undefined);
  assert.equal(sibling.responsive, undefined);
  const document = {
    pages: [{
      root: {
        id: "node_a10000000001",
        children: [{ id: "node_a10000000002", type: "text", box: { x: 12, y: 16, w: 30, h: 12 } }],
      },
    }],
  };
  const stored = placeOnCanvas(document, { nodeId: "node_a10000000002", breakpoint: "tablet", x: 22, y: 28, w: 30, h: 12 });
  const child = (stored as { pages: { root: { children: BreakpointNode[] } }[] }).pages[0]?.root.children[0];
  assert.equal(child?.box?.x, 12);
  assert.equal(child?.responsive?.tablet?.box?.x, 22);
  assert.equal(child?.responsive?.strategy, "custom");
  assert.equal(child?.responsive?.mobile, undefined);
  const source = readFileSync(new URL("../../src/platform/canvas/breakpoint-write.ts", import.meta.url), "utf8");
  assert.equal(source.includes("overlays/"), false);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
});
