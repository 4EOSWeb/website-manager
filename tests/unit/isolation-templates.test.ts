import { test } from "node:test";
import assert from "node:assert/strict";
import harborAdapter from "../../fixtures/harbor/adapter.ts";
import quantumAgeAdapter from "../../adapters/quantum-age/adapter.ts";
import { templateChoices } from "../../src/platform/templates/catalog.ts";

test("template pickers keep site templates on their own adapter", () => {
  const harbor = templateChoices(harborAdapter).map((item) => item.id);
  const quantum = templateChoices(quantumAgeAdapter).map((item) => item.id);
  assert.equal(harbor.includes("harbor.visit"), true);
  assert.equal(harbor.includes("blank"), true);
  assert.equal(harbor.includes("canvas"), true);
  assert.equal(harbor.includes("insights-landing"), false);
  assert.equal(harbor.some((id) => id.startsWith("quantum-age")), false);
  assert.equal(quantum.includes("harbor.visit"), false);
  assert.equal(quantum.includes("insights-landing"), true);
  assert.equal(quantum.includes("blank"), true);
});
