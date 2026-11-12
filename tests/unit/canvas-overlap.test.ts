import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { boxesOverlap, overlapWarning } from "../../src/platform/canvas/overlap.ts";

test("overlap sets a warning and leaves the boxes where they are", () => {
  const node = { x: 8, y: 8, w: 36, h: 28 };
  const other = { x: 14, y: 14, w: 42, h: 28 };
  const before = structuredClone({ node, other });
  assert.equal(overlapWarning(node, [other]), "These items overlap.");
  assert.deepEqual({ node, other }, before);
  assert.equal(boxesOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 9, y: 0, w: 10, h: 10 }), false);
  assert.equal(overlapWarning(node, [{ ...other, locked: true }]), null);
});

test("separate nodes show no overlap warning", () => {
  const node = { x: 0, y: 0, w: 20, h: 20 };
  const other = { x: 40, y: 40, w: 20, h: 20 };
  assert.equal(overlapWarning(node, [other]), null);
  assert.equal(boxesOverlap(node, { x: 18.9, y: 0, w: 20, h: 20 }), true);
  const source = readFileSync(new URL("../../src/platform/canvas/overlap.ts", import.meta.url), "utf8");
  assert.equal(source.includes("overlays/"), false);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
  const inspector = readFileSync(new URL("../../src/components/editor/inspector/chrome.tsx", import.meta.url), "utf8");
  assert.equal(inspector.includes("These items overlap."), false);
  assert.equal(inspector.includes("overlapWarning"), true);
});
