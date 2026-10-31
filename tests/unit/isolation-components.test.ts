import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import harborAdapter from "../../fixtures/harbor/adapter.ts";
import quantumAgeAdapter from "../../adapters/quantum-age/adapter.ts";
import { customCatalog } from "../../src/platform/elements/custom.ts";
import { registryFromAdapter } from "../../src/platform/registry/discover.ts";

function ids(adapter: { components: { components: readonly { id: string }[] } }) {
  const registry = registryFromAdapter(adapter);
  assert.equal(registry.ok, true);
  if (!registry.ok) return [];
  return registry.value.list().map((item) => item.id);
}

test("each site registry returns only that site's components", () => {
  const harbor = registryFromAdapter(harborAdapter);
  const quantum = registryFromAdapter(quantumAgeAdapter);
  assert.equal(harbor.ok, true);
  assert.equal(quantum.ok, true);
  if (!harbor.ok || !quantum.ok) return;

  const harborIds = harbor.value.list().map((item) => item.id);
  const quantumIds = quantum.value.list().map((item) => item.id);
  assert.equal(harborIds.some((id) => id.startsWith("quantum-age.")), false);
  assert.equal(quantumIds.some((id) => id.startsWith("harbor.")), false);
  assert.equal(harborIds.includes("harbor.tide-clock"), true);
  assert.equal(quantumIds.includes("quantum-age.hero"), true);

  const tide = harbor.value.get("harbor.tide-clock");
  assert.ok(tide);
  const extra = harbor.value.register({ ...tide, id: "harbor.extra" });
  assert.equal(extra.ok, true);
  assert.equal(harbor.value.get("harbor.extra")?.id, "harbor.extra");
  assert.equal(quantum.value.get("harbor.extra"), undefined);
  assert.equal(quantum.value.list().some((item) => item.id === "harbor.extra"), false);

  const harborCustom = customCatalog(harborAdapter).map((item) => item.id);
  const quantumCustom = customCatalog(quantumAgeAdapter).map((item) => item.id);
  assert.equal(harborCustom.includes("harbor.tide-clock"), true);
  assert.equal(harborCustom.includes("quantum-age.hero"), false);
  assert.equal(quantumCustom.includes("quantum-age.hero"), true);
  assert.equal(quantumCustom.includes("harbor.tide-clock"), false);

  const source = readFileSync("src/platform/registry/register.ts", "utf8");
  assert.equal(source.includes("const items = new Map"), true);
  assert.equal(/^(?:let|const|var) items = new Map/m.test(source), false);
});
