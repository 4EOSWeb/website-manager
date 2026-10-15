import { test } from "node:test";
import assert from "node:assert/strict";
import { createPlatformId, isPlatformId } from "../../src/platform/ids.ts";

test("generated platform ids are unique and match the checker", () => {
  const ids = new Set<string>();
  for (let index = 0; index < 100; index += 1) {
    const id = createPlatformId(index % 3 === 0 ? "page" : index % 3 === 1 ? "node" : "grp");
    assert.equal(isPlatformId(id), true);
    assert.equal(/quantum|insights|hero/i.test(id), false);
    ids.add(id);
  }
  assert.equal(ids.size, 100);
  assert.equal(isPlatformId("page_not-valid"), false);
  assert.equal(isPlatformId("site_aabbccddeeff"), false);
});
