import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveMissingBreakpoint } from "../../src/platform/document/strategy.ts";

test("a missing mobile breakpoint reflows and leaves the desktop box", () => {
  const desktop = { x: 70, y: 80, w: 40, h: 30 };
  const child = { box: { ...desktop }, responsive: {} };
  const resolved = resolveMissingBreakpoint(child, "mobile");
  assert.deepEqual(resolved, { mode: "flow", direction: "vertical" });
  assert.equal("x" in resolved, false);
  assert.deepEqual(child.box, desktop);

  const explicit = resolveMissingBreakpoint({ box: { ...desktop }, responsive: { strategy: "reflow" } }, "mobile");
  assert.deepEqual(explicit, { mode: "flow", direction: "vertical" });
  assert.deepEqual(child.box, desktop);
});
