import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { handleGesture } from "../../src/platform/drag/handle.ts";

test("only the handle starts a drag, and only after the threshold", () => {
  assert.equal(handleGesture({ onHandle: true, onText: false, startX: 0, startY: 0, x: 3, y: 0 }), "none");
  assert.equal(handleGesture({ onHandle: true, onText: false, startX: 0, startY: 0, x: 4, y: 0 }), "drag");
  assert.equal(handleGesture({ onHandle: false, onText: true, startX: 0, startY: 0, x: 40, y: 0 }), "none");
  assert.equal(handleGesture({ onHandle: true, onText: true, startX: 0, startY: 0, x: 40, y: 0 }), "none");
  const source = readFileSync(new URL("../../src/platform/drag/handle.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
  }
});
