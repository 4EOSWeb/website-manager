import { test } from "node:test";
import assert from "node:assert/strict";
import harborAdapter from "../../fixtures/harbor/adapter.ts";
import quantumAgeAdapter from "../../adapters/quantum-age/adapter.ts";
import { adapterFontFamilies } from "../../src/components/editor/inspector/button-model.ts";

test("harbor and quantum age font lists do not leak", () => {
  const harbor = adapterFontFamilies(harborAdapter.fonts);
  const quantum = adapterFontFamilies(quantumAgeAdapter.fonts);
  assert.notDeepEqual(harbor, quantum);
  assert.deepEqual(harbor, ["Fraunces", "IBM Plex Sans"]);
  assert.equal(harbor.includes("Figtree"), false);
  assert.equal(harbor.includes("Source Serif 4"), false);
  assert.equal(quantum.includes("Fraunces"), false);
  assert.equal(quantum.includes("IBM Plex Sans"), false);
  assert.equal(quantum.includes("Figtree"), true);
});
