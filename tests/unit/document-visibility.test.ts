import { test } from "node:test";
import assert from "node:assert/strict";
import { visibilitySchema } from "../../src/platform/document/visibility.ts";

test("visibility is a boolean plus unique breakpoints", () => {
  assert.equal(visibilitySchema.safeParse({ hidden: true, hideOn: ["mobile"] }).success, true);
  assert.equal(visibilitySchema.safeParse({ hidden: "yes", hideOn: [] }).success, false);
  assert.equal(visibilitySchema.safeParse({ hidden: false, hideOn: ["mobile", "mobile"] }).success, false);
  assert.equal(visibilitySchema.safeParse({ hidden: false, hideOn: ["print"] }).success, false);
});
