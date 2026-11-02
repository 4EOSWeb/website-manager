import { test } from "node:test";
import assert from "node:assert/strict";
import harborAdapter from "../../fixtures/harbor/adapter.ts";
import quantumAgeAdapter from "../../adapters/quantum-age/adapter.ts";
import { parseAdapter } from "../../src/platform/adapter/index.ts";
import { discoverOnboardingRoutes } from "../../src/platform/onboarding/discover.ts";

test("harbor routes include /work and an empty level 2 list fails", async () => {
  const parsed = parseAdapter(harborAdapter);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const before = parsed.value.routes.map((route) => route.path);
  const discovered = await discoverOnboardingRoutes(parsed.value);
  assert.equal(discovered.ok, true);
  if (discovered.ok) assert.equal(discovered.routes.some((route) => route.path === "/work"), true);
  assert.deepEqual(parsed.value.routes.map((route) => route.path), before);

  const empty = await discoverOnboardingRoutes({ ...parsed.value, routes: [] });
  assert.equal(empty.ok, false);
  if (!empty.ok) assert.match(empty.problem, /level 2/);

  const warning = await discoverOnboardingRoutes({ ...parsed.value, level: 1, routes: [] });
  assert.equal(warning.ok, true);
  if (warning.ok) assert.match(warning.warning ?? "", /level 1/);
});

test("quantum age routes are left unchanged", async () => {
  const parsed = parseAdapter(quantumAgeAdapter);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const before = parsed.value.routes.map((route) => route.path);
  await discoverOnboardingRoutes(parsed.value);
  assert.deepEqual(parsed.value.routes.map((route) => route.path), before);
});
