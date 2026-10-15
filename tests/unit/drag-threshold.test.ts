import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DRAG_THRESHOLD_PX, classifyPointerMove } from "../../src/platform/drag/threshold.ts";

test("movement under 4 pixels is a click and 4 pixels can drag", () => {
  assert.equal(DRAG_THRESHOLD_PX, 4);
  assert.equal(classifyPointerMove(0, 0, 3, 0), "click");
  assert.equal(classifyPointerMove(20, 8, 20, 11), "click");
  assert.equal(classifyPointerMove(0, 0, 4, 0), "drag");
  assert.equal(classifyPointerMove(10, 10, 6, 10), "drag");
  assert.equal(classifyPointerMove(0, 0, 0, 0), "click");
  const source = readFileSync(new URL("../../src/platform/drag/threshold.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
  }
});
