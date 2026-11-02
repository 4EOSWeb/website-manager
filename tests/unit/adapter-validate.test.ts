import { test } from "node:test";
import assert from "node:assert/strict";
import { validateAdapterIdentity } from "../../src/platform/adapter-validate.ts";

test("a missing version fails and version 1 with id and name passes", () => {
  const missing = validateAdapterIdentity({ site: { id: "sample", name: "Sample" } });
  assert.equal(missing.ok, false);
  if (!missing.ok) {
    assert.equal(missing.error.code, "adapter_invalid");
    assert.equal(missing.error.path, "version");
    assert.equal(/quantum|insights|harbor/i.test(missing.error.message), false);
  }

  const valid = validateAdapterIdentity({
    version: 1,
    level: 1,
    site: {
      id: "sample",
      name: "Sample",
      productionUrl: "https://example.com",
      repository: { owner: "example", name: "sample" },
      defaultBranch: "dev",
    },
  });
  assert.equal(valid.ok, true);
  if (valid.ok) assert.equal(valid.value.site.id, "sample");
});
