import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { writeMobileBox, type BreakpointNode } from "../../src/platform/canvas/breakpoint-write.ts";
import { placeOnCanvas } from "../../src/platform/drag/canvas-place.ts";

test("a mobile move keeps desktop x and y and the tablet override", () => {
  const button: BreakpointNode = {
    box: { x: 18, y: 24, w: 20, h: 10 },
    responsive: { strategy: "custom", tablet: { box: { x: 6, y: 8, w: 20, h: 10 } } },
  };
  const next = writeMobileBox(button, { x: 40, y: 50, w: 20, h: 10 });
  assert.equal(next.box?.x, 18);
  assert.equal(next.box?.y, 24);
  assert.equal(next.responsive?.tablet?.box?.x, 6);
  assert.equal(next.responsive?.tablet?.box?.y, 8);
  assert.equal(next.responsive?.mobile?.box?.x, 40);
  assert.equal(next.responsive?.mobile?.box?.y, 50);
  assert.equal(next.responsive?.strategy, "custom");
  const document = {
    pages: [{
      root: {
        id: "node_a10000000001",
        children: [{
          id: "node_a10000000002",
          type: "button",
          box: { x: 18, y: 24, w: 20, h: 10 },
          responsive: { strategy: "custom", tablet: { box: { x: 6, y: 8, w: 20, h: 10 } } },
        }],
      },
    }],
  };
  const stored = placeOnCanvas(document, { nodeId: "node_a10000000002", breakpoint: "mobile", x: 40, y: 50, w: 20, h: 10 });
  const child = (stored as { pages: { root: { children: BreakpointNode[] } }[] }).pages[0]?.root.children[0];
  assert.equal(child?.box?.x, 18);
  assert.equal(child?.box?.y, 24);
  assert.equal(child?.responsive?.tablet?.box?.x, 6);
  assert.equal(child?.responsive?.mobile?.box?.x, 40);
  const source = readFileSync(new URL("../../src/platform/canvas/breakpoint-write.ts", import.meta.url), "utf8");
  assert.equal(source.includes("overlays/"), false);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
});
