import { test } from "node:test";
import assert from "node:assert/strict";
import { bindingsSchema } from "../../src/platform/document/bindings.ts";

test("a binding key is opaque and an invalid key fails", () => {
  assert.equal(bindingsSchema.safeParse({ items: { key: "posts.latest" } }).success, true);
  assert.equal(bindingsSchema.safeParse({ items: { key: "Posts" } }).success, false);
});
