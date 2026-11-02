import { test } from "node:test";
import assert from "node:assert/strict";
import { inheritedBreakpoints } from "../../src/platform/document/inheritance.ts";

const box = { x: 10, y: 10, w: 40, h: 20 };

test("a desktop-only box inherits tablet and mobile", () => {
  assert.deepEqual(inheritedBreakpoints({ box, responsive: {} }), ["tablet", "mobile"]);
  assert.deepEqual(inheritedBreakpoints({ box, responsive: { mobile: { box } } }), ["tablet"]);
});
