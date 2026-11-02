import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { centerGuides } from "../../src/platform/canvas/guides-center.ts";
import { snapCanvasBox } from "../../src/platform/canvas/snap.ts";

test("a center guide appears within 1 percent and snaps the node", () => {
  const near = centerGuides({ x: 31.5, y: 10, w: 36, h: 28 }, false);
  assert.equal(near.vertical, true);
  assert.equal(near.horizontal, false);
  assert.equal(near.box.x + near.box.w / 2, 50);
  assert.equal(near.box.y, 10);
  assert.equal("guide" in near.box, false);
  const alt = centerGuides({ x: 31.5, y: 10, w: 36, h: 28 }, true);
  assert.equal(alt.vertical, true);
  assert.equal(alt.box.x, 31.5);
});

test("grid snap still applies away from the center", () => {
  const snapped = snapCanvasBox({ x: 6.2, y: 3, w: 36, h: 28 }, 4, false);
  const guided = centerGuides(snapped, false);
  assert.equal(guided.vertical, false);
  assert.equal(guided.horizontal, false);
  assert.equal(guided.box.x, 8);
  const source = readFileSync(new URL("../../src/platform/canvas/guides-center.ts", import.meta.url), "utf8");
  assert.equal(source.includes("overlays/"), false);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
  const script = readFileSync(new URL("../../src/platform/canvas/runtime.ts", import.meta.url), "utf8");
  assert.equal(script.includes('setAttribute("data-guide", "center-x")'), true);
});
