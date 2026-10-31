import { test } from "node:test";
import assert from "node:assert/strict";
import harborAdapter from "../../fixtures/harbor/adapter.ts";
import quantumAgeAdapter from "../../adapters/quantum-age/adapter.ts";
import { discoverStaticRoutes } from "../../src/platform/adapter/routes.ts";
import { fakeContext } from "./platform-helpers.ts";

async function paths(routes: unknown, websiteId: string) {
  const found = await discoverStaticRoutes(routes)(fakeContext(websiteId));
  assert.equal(found.ok, true);
  if (!found.ok) return [];
  return found.value.map((route) => route.path);
}

test("route discovery for one site does not return the other site's routes", async () => {
  const harbor = await paths(harborAdapter.routes, "web_harbor");
  const quantum = await paths(quantumAgeAdapter.routes, "web_quantum_age");
  assert.equal(harbor.includes("/approach"), false);
  assert.equal(quantum.includes("/work"), false);
  assert.equal(harbor.includes("/work"), true);
  assert.equal(quantum.includes("/approach"), true);
  assert.notDeepEqual(harbor, quantum);
});
