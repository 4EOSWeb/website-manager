import { test } from "node:test";
import assert from "node:assert/strict";
import harborAdapter from "../../fixtures/harbor/adapter.ts";
import { listedPages } from "../../src/components/editor/page-list.ts";
import { customCatalog } from "../../src/platform/elements/custom.ts";
import { createButton } from "../../src/platform/elements/button.ts";
import { harborSiteDraft, harborVisualDocument } from "../../scripts/register-harbor-site.ts";

test("the harbor editor seed lists harbor pages and the tide clock", () => {
  const draft = harborSiteDraft();
  const visual = harborVisualDocument();
  const pages = listedPages(visual, draft.pages);
  assert.deepEqual(pages.map((page) => page.route), ["/", "/work", "/studio", "/journal", "/visit"]);
  assert.equal(pages.some((page) => page.route === "/approach"), false);
  assert.equal(JSON.stringify(draft).toLowerCase().includes("quantum"), false);
  const custom = customCatalog(harborAdapter);
  assert.equal(custom.some((item) => item.id === "harbor.tide-clock"), true);
  assert.equal(custom.some((item) => item.id.startsWith("quantum-age.")), false);
  assert.equal(createButton().componentId, "generic.button");
});
