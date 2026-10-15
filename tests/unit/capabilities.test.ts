import { test } from "node:test";
import assert from "node:assert/strict";
import { capabilityNames, hasCapability } from "../../src/platform/capabilities.ts";

test("an absent capability is false", () => {
  assert.equal(hasCapability({}, "supportsPageCreation"), false);
  assert.equal(hasCapability({ supportsBlog: true }, "supportsBlog"), true);
  assert.equal(hasCapability({ supportsBlog: false }, "supportsBlog"), false);
  for (const name of capabilityNames) assert.equal(/quantum|insights|hero/i.test(name), false);
});
