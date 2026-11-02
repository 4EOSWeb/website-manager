import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { snapAxis, snapCanvasBox } from "../../src/platform/canvas/snap.ts";

test("a 4-point snap rounds x to a multiple of 4", () => {
  const box = { x: 6.2, y: 3, w: 36, h: 28 };
  const next = snapCanvasBox(box, 4, false);
  assert.equal(next.x, 8);
  assert.equal(next.x % 4, 0);
  assert.equal(next.y, 4);
  assert.equal(box.x, 6.2);
  assert.equal(snapAxis(10, 4, false), 12);
  assert.equal(snapAxis(14, 4, false), 16);
});

test("alt leaves the raw percent and flow is outside the canvas snap", () => {
  const box = { x: 6.2, y: 3, w: 36, h: 28 };
  assert.deepEqual(snapCanvasBox(box, 4, true), box);
  assert.equal(snapAxis(6.2, 0, false), 6.2);
  const source = readFileSync(new URL("../../src/platform/canvas/snap.ts", import.meta.url), "utf8");
  assert.equal(source.includes("overlays/"), false);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
  const script = readFileSync(new URL("../../src/platform/canvas/runtime.ts", import.meta.url), "utf8");
  const drag = script.slice(script.indexOf("function updateDrag"));
  const flowReturn = drag.indexOf('if (drag.kind === "block")');
  const snapCall = drag.indexOf("snapShare(");
  assert.equal(flowReturn > 0 && snapCall > flowReturn, true);
  assert.equal(drag.slice(0, snapCall).includes('type: "4eos-place"'), false);
});
