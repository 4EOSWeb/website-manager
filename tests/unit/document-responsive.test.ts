import { test } from "node:test";
import assert from "node:assert/strict";
import { responsiveSchema } from "../../src/platform/document/responsive.ts";

test("missing breakpoint overrides are valid and an unknown breakpoint fails", () => {
  assert.equal(responsiveSchema.safeParse({}).success, true);
  assert.equal(responsiveSchema.safeParse({ tablet: { styles: { fontSize: 16 } } }).success, true);
  assert.equal(responsiveSchema.safeParse({ wide: {} }).success, false);
});
