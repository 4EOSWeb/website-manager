import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fakeAdapter, fakeContext } from "./platform-helpers.ts";
import { validateAdapterIdentity } from "../../src/platform/adapter-validate.ts";
import { assertSameSite } from "../../src/platform/context.ts";

test("helpers build a context and a minimal adapter", () => {
  const context = fakeContext("site_example");
  assert.equal(assertSameSite(context, fakeContext("site_example")).ok, true);
  const adapter = validateAdapterIdentity(fakeAdapter("site_example"));
  assert.equal(adapter.ok, true);
  const source = readFileSync(new URL("./platform-helpers.ts", import.meta.url), "utf8");
  assert.equal(source.includes("/insights"), false);
  assert.equal(source.includes("Quantum Age"), false);
});
