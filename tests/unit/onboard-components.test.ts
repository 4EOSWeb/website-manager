import { test } from "node:test";
import assert from "node:assert/strict";
import harborAdapter from "../../fixtures/harbor/adapter.ts";
import quantumAgeAdapter from "../../adapters/quantum-age/adapter.ts";
import { parseAdapter } from "../../src/platform/adapter/index.ts";
import { discoverOnboardingComponents } from "../../src/platform/onboarding/discover.ts";

test("harbor shows Tide clock and duplicate ids fail", () => {
  const parsed = parseAdapter(harborAdapter);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const client = discoverOnboardingComponents(parsed.value, "client-admin");
  assert.equal(client.ok, true);
  if (!client.ok) return;
  assert.equal(client.components.some((component) => component.name === "Tide clock"), true);
  assert.equal(JSON.stringify(client.components).includes("src/"), false);
  assert.equal(client.components.every((component) => component.id === undefined), true);

  const admin = discoverOnboardingComponents(parsed.value, "super-admin");
  assert.equal(admin.ok, true);
  if (admin.ok) assert.equal(admin.components.some((component) => component.id === "harbor.tide-clock"), true);

  const duplicate = {
    ...parsed.value,
    components: { components: [parsed.value.components.components[0], parsed.value.components.components[0]] },
  };
  const failed = discoverOnboardingComponents(duplicate, "client-admin");
  assert.equal(failed.ok, false);
});

test("the quantum age registry is unchanged", () => {
  const parsed = parseAdapter(quantumAgeAdapter);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const before = parsed.value.components.components.map((component) => component.id);
  discoverOnboardingComponents(parsed.value, "super-admin");
  assert.deepEqual(parsed.value.components.components.map((component) => component.id), before);
});
