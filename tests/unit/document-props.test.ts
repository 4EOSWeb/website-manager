import { test } from "node:test";
import assert from "node:assert/strict";
import { propsSchema } from "../../src/platform/document/props.ts";

test("nested plain props pass and a function fails", () => {
  assert.equal(propsSchema.safeParse({ label: "Read more", meta: { count: 2 } }).success, true);
  assert.equal(propsSchema.safeParse({ action: () => undefined }).success, false);
});
