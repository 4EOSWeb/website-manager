import { test } from "node:test";
import assert from "node:assert/strict";
import { thumbnailSrc } from "../../src/platform/registry/thumbnail.ts";

const context = { websiteId: "web_sample" };

test("another website id fails and a generic button placeholder passes", () => {
  const foreign = thumbnailSrc({ thumbnail: "sites/web_other/hero.png", category: "image" }, context);
  assert.equal(foreign.ok, false);
  if (!foreign.ok) assert.equal(foreign.error.code, "site_mismatch");
  const button = thumbnailSrc({ thumbnail: "generic:button", category: "actions" }, context);
  assert.equal(button.ok, true);
  if (button.ok) assert.equal(button.value, "generic:button");
  const remote = thumbnailSrc({ thumbnail: "https://cdn.example/a.png", category: "image" }, context);
  assert.equal(remote.ok, false);
  if (!remote.ok) assert.equal(remote.error.code, "adapter_invalid");
  const local = thumbnailSrc({ thumbnail: "hero.png", category: "image" }, context);
  assert.equal(local.ok, true);
  if (local.ok) assert.equal(local.value, "sites/web_sample/media/hero.png");
});
