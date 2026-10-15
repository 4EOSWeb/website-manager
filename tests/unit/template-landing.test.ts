import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateDocument } from "../../src/platform/document/document.ts";
import { landingPage } from "../../src/platform/templates/landing.ts";

test("a landing page uses generic nodes and neutral copy", () => {
  const document = landingPage();
  const parsed = validateDocument(document);
  assert.equal(parsed.ok, true);
  const serialized = JSON.stringify(document);
  assert.equal(serialized.includes("Landing page"), true);
  assert.equal(serialized.includes("Describe the offer"), true);
  assert.equal(serialized.includes("Get started"), true);
  assert.equal(serialized.includes("quantum-age."), false);
  const ids: string[] = serialized.match(/generic\.[a-z]+/g) ?? [];
  assert.equal(ids.includes("generic.heading"), true);
  assert.equal(ids.includes("generic.button"), true);
  assert.equal(ids.includes("generic.card"), true);
  const source = readFileSync("src/platform/templates/landing.ts", "utf8").toLowerCase();
  assert.equal(source.includes("quantum"), false);
  assert.equal(source.includes("plum"), false);
  assert.equal(source.includes("hero"), false);
});
