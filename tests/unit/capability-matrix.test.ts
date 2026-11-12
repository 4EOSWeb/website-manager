import assert from "node:assert/strict";
import test from "node:test";
import harbor from "../../fixtures/harbor/adapter.ts";
import quantum from "../../adapters/quantum-age/adapter.ts";

const flags = [
  "supportsPageCreation",
  "supportsBlog",
  "supportsNavigationEditing",
  "supportsFreeCanvas",
  "supportsStructuredSections",
  "supportsThemeEditing",
  "supportsCustomComponents",
  "supportsForms",
  "supportsSharedLayouts",
  "supportsReviewPublishing",
] as const;

test("the capability matrix matches both adapters", () => {
  assert.equal(harbor.capabilities.supportsReviewPublishing, false);
  assert.equal(quantum.capabilities.supportsReviewPublishing, true);
  assert.equal(harbor.capabilities.supportsForms, false);
  assert.equal(quantum.capabilities.supportsForms, true);
  assert.equal(harbor.capabilities.supportsBlog, false);
  assert.equal(quantum.capabilities.supportsBlog, true);
  for (const flag of flags) {
    assert.equal(typeof harbor.capabilities[flag], "boolean");
    assert.equal(typeof quantum.capabilities[flag], "boolean");
  }
});
