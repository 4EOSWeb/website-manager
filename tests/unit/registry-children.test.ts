import { test } from "node:test";
import assert from "node:assert/strict";
import { assertChild } from "../../src/platform/registry/children.ts";

test("closed parents reject children and listed types pass", () => {
  const closed = assertChild({ acceptsChildren: false }, "text");
  assert.equal(closed.ok, false);
  if (!closed.ok) assert.equal(closed.error.code, "parent_rejected");
  assert.equal(assertChild({ acceptsChildren: true, allowedChildren: ["text", "heading"] }, "text").ok, true);
});
