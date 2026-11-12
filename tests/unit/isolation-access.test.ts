import { test } from "node:test";
import assert from "node:assert/strict";
import harborAdapter from "../../fixtures/harbor/adapter.ts";
import { siteDraftFromAdapter } from "../../src/lib/adapter-draft.ts";
import { editorAdapterView } from "../../src/platform/editor-adapter.ts";

test("a Harbor editor with no saved draft does not receive the Quantum Age document", () => {
  const view = editorAdapterView(harborAdapter);
  assert.ok(view);
  const site = siteDraftFromAdapter(view, "Harbor & Co.");
  const routes = site.pages.map((page) => page.route);
  assert.equal(routes.includes("/work"), true);
  assert.equal(routes.includes("/approach"), false);
  assert.equal(JSON.stringify(site).includes("Quantum Age"), false);
  assert.equal(site.chrome.header.siteName, "Harbor & Co.");
});
