import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadAdapter } from "../../src/platform/adapter-loader.ts";

test("a missing adapter id fails and a present loader is returned", async () => {
  const missing = await loadAdapter("missing", {});
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.error.code, "adapter_not_found");

  const found = await loadAdapter("sample", {
    sample: async () => ({ version: 1, site: { id: "sample", name: "Sample" } }),
  });
  assert.equal(found.ok, true);
  if (found.ok) assert.equal((found.value as { site: { id: string } }).site.id, "sample");
});

test("the loader does not import a site", () => {
  const source = readFileSync(new URL("../../src/platform/adapter-loader.ts", import.meta.url), "utf8");
  assert.equal(source.includes("overlays/"), false);
  assert.equal(source.includes("adapters/"), false);
});
