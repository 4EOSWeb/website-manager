import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderCanvasBreakpoint } from "../../src/platform/canvas/reflow-render.ts";

test("reflow stacks an off-canvas desktop box, scale keeps percentages, and custom uses the mobile box", () => {
  const heading = {
    id: "node_a10000000002",
    box: { x: 80, y: 10, w: 40, h: 12 },
    responsive: { strategy: "reflow" as const },
  };
  const button = {
    id: "node_a10000000003",
    box: { x: 18, y: 24, w: 20, h: 10 },
    responsive: { strategy: "custom" as const, mobile: { box: { x: 4, y: 6, w: 90, h: 10 } } },
  };
  const reflow = renderCanvasBreakpoint([heading, button], "mobile");
  assert.deepEqual(reflow[0], { id: heading.id, mode: "stack" });
  assert.equal("box" in reflow[0], false);
  assert.equal(reflow[1]?.mode, "placed");
  if (reflow[1]?.mode === "placed") {
    assert.equal(reflow[1].box.x, 4);
    assert.equal(reflow[1].box.y, 6);
  }
  const scaled = renderCanvasBreakpoint([{ ...heading, responsive: { strategy: "scale" } }], "mobile");
  assert.deepEqual(scaled[0], { id: heading.id, mode: "placed", box: { x: 80, y: 10, w: 40, h: 12 } });
  const desktop = renderCanvasBreakpoint([heading], "desktop");
  assert.deepEqual(desktop[0], { id: heading.id, mode: "placed", box: { x: 80, y: 10, w: 40, h: 12 } });
  const source = readFileSync(new URL("../../src/platform/canvas/reflow-render.ts", import.meta.url), "utf8");
  assert.equal(source.includes("overlays/"), false);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
});
