import { test } from "node:test";
import assert from "node:assert/strict";
import { sourceSchema } from "../../src/platform/document/source.ts";

test("provider-managed content does not require a site name", () => {
  assert.equal(sourceSchema.safeParse({ origin: "provider", providerManaged: true }).success, true);
  assert.equal(sourceSchema.safeParse({ origin: "imported", providerManaged: false }).success, false);
});
