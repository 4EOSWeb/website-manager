import { test } from "node:test";
import assert from "node:assert/strict";
import { componentsSchema } from "../../src/platform/adapter/components.ts";

test("component ids are lowercase and an empty list is valid", () => {
  assert.equal(componentsSchema.safeParse({ components: [{ id: "site.primary-button" }] }).success, true);
  assert.equal(componentsSchema.safeParse({ components: [{ id: "Hero" }] }).success, false);
  assert.equal(componentsSchema.safeParse({ components: [] }).success, true);
});
