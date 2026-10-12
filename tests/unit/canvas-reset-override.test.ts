import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resetBreakpointBox, resetOverride } from "../../src/platform/canvas/reset-override.ts";
import type { BreakpointNode } from "../../src/platform/canvas/breakpoint-write.ts";

test("resetting mobile removes that box, keeps desktop, and restores reflow when nothing else is custom", () => {
  const button: BreakpointNode = {
    box: { x: 18, y: 24, w: 20, h: 10 },
    responsive: {
      strategy: "custom",
      tablet: { box: { x: 6, y: 8, w: 20, h: 10 } },
      mobile: { box: { x: 40, y: 50, w: 20, h: 10 } },
    },
  };
  const kept = resetBreakpointBox(button, "mobile");
  assert.equal(button.responsive?.mobile?.box?.x, 40);
  assert.equal(kept.box?.x, 18);
  assert.equal(kept.box?.y, 24);
  assert.equal(kept.responsive?.tablet?.box?.x, 6);
  assert.equal(kept.responsive?.mobile, undefined);
  assert.equal(kept.responsive?.strategy, "custom");
  const cleared = resetBreakpointBox(kept, "tablet");
  assert.equal(cleared.box?.x, 18);
  assert.equal(cleared.responsive?.tablet, undefined);
  assert.equal(cleared.responsive?.strategy, "reflow");
  const scaled = resetBreakpointBox({
    box: { x: 18, y: 24, w: 20, h: 10 },
    responsive: { strategy: "scale", mobile: { box: { x: 40, y: 50, w: 20, h: 10 } } },
  }, "mobile");
  assert.equal(scaled.responsive?.strategy, "scale");
  assert.equal(scaled.responsive?.mobile, undefined);
  assert.equal(scaled.box?.y, 24);
  const document = {
    pages: [{
      root: {
        id: "node_a10000000001",
        children: [{
          id: "node_a10000000002",
          type: "button",
          box: { x: 18, y: 24, w: 20, h: 10 },
          responsive: { strategy: "custom", mobile: { box: { x: 40, y: 50, w: 20, h: 10 } } },
        }],
      },
    }],
  };
  const stored = resetOverride(document, "node_a10000000002", "mobile") as {
    pages: { root: { children: BreakpointNode[] } }[];
  };
  const child = stored.pages[0]?.root.children[0];
  assert.equal(child?.box?.x, 18);
  assert.equal(child?.responsive?.mobile, undefined);
  assert.equal(child?.responsive?.strategy, "reflow");
  const source = readFileSync(new URL("../../src/platform/canvas/reset-override.ts", import.meta.url), "utf8");
  assert.equal(source.includes("overlays/"), false);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
});
