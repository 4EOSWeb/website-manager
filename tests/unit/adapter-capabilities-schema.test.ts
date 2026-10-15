import { test } from "node:test";
import assert from "node:assert/strict";
import { validateAdapterCapabilities } from "../../src/platform/adapter/capabilities.ts";

const flags = {
  supportsPageCreation: false,
  supportsBlog: false,
  supportsNavigationEditing: false,
  supportsFreeCanvas: false,
  supportsStructuredSections: true,
  supportsThemeEditing: false,
  supportsCustomComponents: false,
  supportsForms: false,
  supportsSharedLayouts: false,
  supportsReviewPublishing: false,
};

test("level 1 rejects a free canvas and omitted capability keys", () => {
  const canvas = validateAdapterCapabilities(1, { ...flags, supportsFreeCanvas: true });
  assert.equal(canvas.ok, false);
  if (!canvas.ok) assert.equal(canvas.error.path, "capabilities.supportsFreeCanvas");
  const omitted = { ...flags };
  delete (omitted as Partial<typeof flags>).supportsBlog;
  assert.equal(validateAdapterCapabilities(1, omitted).ok, false);
  const open = validateAdapterCapabilities(2, { ...flags, supportsFreeCanvas: true, supportsPageCreation: true, supportsCustomComponents: true });
  assert.equal(open.ok, true);
});
