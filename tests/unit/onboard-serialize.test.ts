import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import harborAdapter from "../../fixtures/harbor/adapter.ts";
import quantumAgeAdapter from "../../adapters/quantum-age/adapter.ts";
import { parseAdapter } from "../../src/platform/adapter/index.ts";
import { ok } from "../../src/platform/result.ts";
import { validateOnboardingSerialization } from "../../src/platform/onboarding/validate-serialize.ts";

test("harbor serialization passes and a parent path fails", () => {
  const parsed = parseAdapter(harborAdapter);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.deepEqual(validateOnboardingSerialization(parsed.value), { ok: true });

  const escaped = validateOnboardingSerialization({
    ...parsed.value,
    serialize: () => ok([{ path: "../secret.json", contents: "{}\n" }]),
  });
  assert.equal(escaped.ok, false);
  if (!escaped.ok) assert.match(escaped.problem, /workspace/);
});

test("quantum age drafts are not rewritten", () => {
  const source = readFileSync("src/platform/onboarding/validate-serialize.ts", "utf8");
  assert.equal(source.includes("writeFile"), false);
  const parsed = parseAdapter(quantumAgeAdapter);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const result = validateOnboardingSerialization(parsed.value);
  assert.equal("ok" in result, true);
});
