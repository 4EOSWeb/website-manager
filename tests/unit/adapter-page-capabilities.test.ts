import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolvePageCapabilities } from "../../src/platform/adapter/page-capabilities.ts";

test("provider-managed pages cannot edit the body", () => {
  const blocked = resolvePageCapabilities(2, { providerManaged: true, editBody: true });
  assert.equal(blocked.ok, false);
  const level1 = resolvePageCapabilities(1);
  assert.equal(level1.ok, true);
  if (level1.ok) {
    assert.equal(level1.value.editMetadata, true);
    assert.equal(level1.value.editBody, false);
    assert.equal(level1.value.editHeader, false);
  }
  const source = readFileSync(new URL("../../src/platform/adapter/page-capabilities.ts", import.meta.url), "utf8");
  assert.equal(/insights|articles/i.test(source), false);
});
