import { test } from "node:test";
import assert from "node:assert/strict";
import harborAdapter from "../../fixtures/harbor/adapter.ts";
import quantumAgeAdapter from "../../adapters/quantum-age/adapter.ts";
import { adapterColorTokens } from "../../src/components/editor/inspector/generated-model.ts";

function values(tokens: { id: string; value: string }[]) {
  return new Set(tokens.map((token) => token.value.toLowerCase()));
}

test("harbor and quantum age color tokens stay on their own sites", () => {
  const harbor = adapterColorTokens(harborAdapter);
  const quantum = adapterColorTokens(quantumAgeAdapter);
  assert.notDeepEqual(
    harbor.map((token) => token.id),
    quantum.map((token) => token.id),
  );
  const sea = harbor.find((token) => token.id === "sea");
  const plum = quantum.find((token) => token.id === "plum");
  assert.ok(sea);
  assert.ok(plum);
  assert.equal(values(quantum).has(sea.value.toLowerCase()), false);
  assert.equal(values(harbor).has(plum.value.toLowerCase()), false);
  assert.equal(harbor.some((token) => token.id === "plum"), false);
  assert.equal(quantum.some((token) => token.id === "sea"), false);
});
