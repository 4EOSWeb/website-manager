import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mixedProps, toggleCanvasSelection } from "../../src/platform/canvas/multi-select.ts";
import { clickNode } from "../../src/components/editor/state/selection.ts";

test("two shift-clicks select two nodes and a plain click leaves one", () => {
  const first = clickNode({ nodeIds: [] }, "node_a10000000001", true);
  const both = clickNode(first, "node_a10000000002", true);
  assert.deepEqual(both.nodeIds, ["node_a10000000001", "node_a10000000002"]);
  assert.deepEqual(toggleCanvasSelection(both.nodeIds, "node_a10000000001", false), ["node_a10000000001"]);
  const removed = clickNode(both, "node_a10000000002", true);
  assert.deepEqual(removed.nodeIds, ["node_a10000000001"]);
  assert.equal(mixedProps(["Learn more", "Learn more"]), false);
  assert.equal(mixedProps(["Learn more", "Read more"]), true);
});

test("text selection still does not become a multi-drag rule", () => {
  const source = readFileSync(new URL("../../src/platform/canvas/multi-select.ts", import.meta.url), "utf8");
  assert.equal(source.includes("overlays/"), false);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
  const inspector = readFileSync(new URL("../../src/components/editor/inspector/chrome.tsx", import.meta.url), "utf8");
  assert.equal(inspector.includes(">Mixed<"), true);
  assert.equal(inspector.includes("disabled={disabled || mixed}"), true);
  const script = readFileSync(new URL("../../overlays/quantum-age/src/components/site/canvas-script.ts", import.meta.url), "utf8");
  assert.equal(script.includes("shift: multi"), true);
  assert.equal(script.includes("function selectionBlocksDrag"), true);
});
