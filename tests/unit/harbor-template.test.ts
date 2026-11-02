import { test } from "node:test";
import assert from "node:assert/strict";
import harborAdapter from "../../fixtures/harbor/adapter.ts";
import { harborVisitTemplate } from "../../fixtures/harbor/templates.ts";
import { parseAdapter } from "../../src/platform/adapter/index.ts";
import { validateDocument } from "../../src/platform/document/document.ts";
import quantumAgeAdapter from "../../adapters/quantum-age/adapter.ts";

test("the harbor visit template is a version 1 canvas with the tide clock", () => {
  const document = validateDocument(harborVisitTemplate.document);
  assert.equal(document.ok, true);
  if (!document.ok) return;
  assert.equal(document.value.version, 1);
  const encoded = JSON.stringify(harborVisitTemplate.document);
  assert.equal(encoded.includes("harbor.tide-clock"), true);
  assert.equal(encoded.includes("quantum-age.hero"), false);
  const parsed = parseAdapter(harborAdapter);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.value.templates.templates.some((item) => item.id === "harbor.visit"), true);
  const quantum = parseAdapter(quantumAgeAdapter);
  assert.equal(quantum.ok, true);
});
