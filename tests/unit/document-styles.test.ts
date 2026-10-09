import { test } from "node:test";
import assert from "node:assert/strict";
import { stylesSchema } from "../../src/platform/document/styles.ts";

test("a token color is allowed and an unknown style key fails", () => {
  assert.equal(stylesSchema.safeParse({ color: "token:ink" }).success, true);
  assert.equal(stylesSchema.safeParse({ plum: "#70456e" }).success, false);
  assert.equal(stylesSchema.safeParse({ fontSize: 18 }).success, true);
});
