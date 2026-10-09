import { test } from "node:test";
import assert from "node:assert/strict";
import { platformVersion } from "../../src/platform/index.ts";

test("the platform version is 1", () => {
  assert.equal(platformVersion, 1);
});
