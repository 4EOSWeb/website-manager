import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import quantumAgeAdapter from "../../adapters/quantum-age/adapter.ts";
import { validateAdapterFile, validateAdapterValue } from "../../src/platform/onboarding/validate-adapter.ts";

test("the harbor adapter file passes", async () => {
  const result = await validateAdapterFile(process.cwd(), "fixtures/harbor/adapter.ts");
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.adapter.routes.some((route) => route.path === "/work"), true);
});

test("a broken adapter returns field errors", () => {
  const result = validateAdapterValue({ version: 1, level: 2 });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.errors.length > 1, true);
    for (const error of result.errors) {
      assert.equal(typeof error.path, "string");
      assert.equal(error.message.includes("\n"), false);
    }
  }
});

test("the quantum age adapter still parses", () => {
  assert.equal(validateAdapterValue(quantumAgeAdapter).ok, true);
});

test("the client form does not import an adapter module", () => {
  const form = readFileSync("src/app/sites/new/paths.tsx", "utf8") + readFileSync("src/app/sites/new/identity.tsx", "utf8");
  assert.equal(form.includes("parseAdapter"), false);
  assert.equal(form.includes("fixtures/harbor"), false);
  assert.equal(form.includes("validateAdapter"), false);
});
