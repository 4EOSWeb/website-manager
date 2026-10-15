import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import harborAdapter from "../../fixtures/harbor/adapter.ts";
import { harborButton, harborTideClock, harborTideClockProps } from "../../fixtures/harbor/registry.ts";
import { parseAdapter } from "../../src/platform/adapter/index.ts";

test("the harbor registry lists the tide clock and the button", () => {
  assert.equal(harborTideClock.id, "harbor.tide-clock");
  assert.equal(harborButton.id, "harbor.button");
  assert.equal("label" in harborTideClockProps.shape, true);
  const parsed = parseAdapter(harborAdapter);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const ids = parsed.value.components.components.map((item) => item.id);
  assert.equal(ids.includes("harbor.tide-clock"), true);
  assert.equal(ids.includes("harbor.button"), true);
  assert.equal(ids.includes("quantum-age.hero"), false);
  assert.equal(ids.includes("quantum-age.logo"), false);
  const source = readFileSync("fixtures/harbor/registry.ts", "utf8");
  assert.equal(source.includes("quantum-age"), false);
});
