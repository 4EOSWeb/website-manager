import { test } from "node:test";
import assert from "node:assert/strict";
import harborAdapter from "../../fixtures/harbor/adapter.ts";
import quantumAgeAdapter from "../../adapters/quantum-age/adapter.ts";
import { LIBRARY } from "../../src/lib/library.ts";
import { legacyLibraryVisible } from "../../src/components/editor/inspector/capability-gate.ts";
import { customCatalog } from "../../src/platform/elements/custom.ts";

test("harbor hides blog library entries that quantum age still shows", () => {
  const insights = LIBRARY.find((entry) => entry.label === "Insights summary");
  const zone = LIBRARY.find((entry) => entry.label === "Freeform zone");
  assert.ok(insights);
  assert.ok(zone);
  assert.equal(legacyLibraryVisible(insights.id, harborAdapter), false);
  assert.equal(legacyLibraryVisible(zone.id, harborAdapter), false);
  assert.equal(legacyLibraryVisible(insights.id, quantumAgeAdapter), true);
  assert.equal(legacyLibraryVisible(zone.id, quantumAgeAdapter), true);
  const harborCustom = customCatalog(harborAdapter).map((item) => item.name);
  assert.equal(harborCustom.includes("Insights summary"), false);
  assert.equal(harborCustom.includes("Logo"), false);
  const quantumCustom = customCatalog(quantumAgeAdapter).map((item) => item.name);
  assert.equal(quantumCustom.includes("Insights summary"), true);
});
