import { test } from "node:test";
import assert from "node:assert/strict";
import { siteMetadataSchema } from "../../src/platform/adapter/metadata.ts";
import { validateAdapterIdentity } from "../../src/platform/adapter-validate.ts";

const site = {
  id: "sample",
  name: "Sample",
  productionUrl: "https://example.com",
  repository: { owner: "example", name: "sample" },
  defaultBranch: "dev",
};

test("a missing repository fails and branch dev passes", () => {
  const withoutRepository = {
    id: site.id,
    name: site.name,
    productionUrl: site.productionUrl,
    defaultBranch: site.defaultBranch,
  };
  assert.equal(siteMetadataSchema.safeParse(withoutRepository).success, false);
  const checked = validateAdapterIdentity({ version: 1, site: withoutRepository });
  assert.equal(checked.ok, false);
  if (!checked.ok) assert.equal(checked.error.path, "site.repository");
  const valid = siteMetadataSchema.safeParse(site);
  assert.equal(valid.success, true);
  if (valid.success) assert.equal(valid.data.defaultBranch, "dev");
});
