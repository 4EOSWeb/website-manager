import { test } from "node:test";
import assert from "node:assert/strict";
import sample from "../fixtures/adapters/sample/adapter.ts";
import { levelCapabilities } from "../../src/platform/adapter/level.ts";
import { validateAdapterIdentity } from "../../src/platform/adapter-validate.ts";

test("level 0 fails and the level 1 sample adapter validates", () => {
  const zero = validateAdapterIdentity({ ...sample, level: 0 });
  assert.equal(zero.ok, false);
  if (!zero.ok) assert.equal(zero.error.path, "level");
  const valid = validateAdapterIdentity(sample);
  assert.equal(valid.ok, true);
  if (valid.ok) assert.equal(valid.value.level, 1);
  assert.equal(levelCapabilities(1).supportsFreeCanvas, false);
  assert.equal(levelCapabilities(2).supportsFreeCanvas, true);
});
