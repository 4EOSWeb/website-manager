import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { publishAllowlist } from "../../adapters/quantum-age/publish-allowlist.ts";
import { adapterNotFound } from "../../src/platform/errors.ts";
import { err, ok } from "../../src/platform/result.ts";
import { ADAPTER_FILES, allowlistFromDiscovery, fallbackPublishAllowlist, filesForReview } from "../../src/lib/publish.ts";

test("a fake adapter refuses a path outside its allowlist", async () => {
  const source = readFileSync(new URL("../../src/lib/publish.ts", import.meta.url), "utf8");
  const withoutFallback = source.replace(/export const ADAPTER_FILES = \[[\s\S]*?\];/, "");
  assert.equal(withoutFallback.includes("insights"), false);
  assert.equal(source.includes("web_quantum_age"), false);
  assert.deepEqual(publishAllowlist, fallbackPublishAllowlist());
  for (const file of ADAPTER_FILES) assert.equal(publishAllowlist.includes(file), true);
  assert.equal(publishAllowlist.includes("src/content/pages/home.json"), true);
  assert.equal(publishAllowlist.includes("public/media/"), true);

  const fake = ["src/content/pages/home.json", "public/media/"];
  const refused = filesForReview(fake, ["src/content/pages/home.json", "src/app/secret.ts"]);
  assert.equal(refused.ok, false);
  if (!refused.ok) assert.equal(refused.error.message, "That file is not on the publish list.");
  const accepted = filesForReview(fake, ["public/media/photo.png"]);
  assert.equal(accepted.ok, true);

  const warnings: unknown[] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(args[0]);
  };
  try {
    const missing = await allowlistFromDiscovery("sample", err(adapterNotFound()), async () => ["src/content/pages/home.json"]);
    assert.equal(missing.warning?.includes("step 19.25"), true);
    assert.equal(missing.allowlist.includes("src/content/editor/site.json"), true);
    const found = await allowlistFromDiscovery("sample", ok(["sample"]), async () => fake);
    assert.equal(found.warning, undefined);
    assert.deepEqual(found.allowlist, fake);
  } finally {
    console.warn = original;
  }
  assert.equal(warnings.length, 1);
});
