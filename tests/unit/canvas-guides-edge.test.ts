import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { edgeGuides } from "../../src/platform/canvas/guides-edge.ts";
import { centerGuides } from "../../src/platform/canvas/guides-center.ts";

test("an edge guide snaps to the left edge", () => {
  const near = edgeGuides({ x: 0.6, y: 20, w: 36, h: 28 }, false);
  assert.equal(near.left, true);
  assert.equal(near.box.x, 0);
  const alt = edgeGuides({ x: 0.6, y: 20, w: 36, h: 28 }, true);
  assert.equal(alt.left, true);
  assert.equal(alt.box.x, 0.6);
  const away = edgeGuides({ x: 8, y: 20, w: 36, h: 28 }, false);
  assert.equal(away.left, false);
  assert.equal(away.box.x, 8);
});

test("center guides still appear and flow is not an edge guide", () => {
  const center = centerGuides({ x: 31.5, y: 10, w: 36, h: 28 }, false);
  assert.equal(center.vertical, true);
  assert.equal(center.box.x + center.box.w / 2, 50);
  const source = readFileSync(new URL("../../src/platform/canvas/guides-edge.ts", import.meta.url), "utf8");
  assert.equal(source.includes("overlays/"), false);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
  const script = readFileSync(new URL("../../src/platform/canvas/runtime.ts", import.meta.url), "utf8");
  assert.equal(script.includes('line("edge-left"'), true);
  assert.equal(script.includes('data-section-type") === "flow"'), true);
});
